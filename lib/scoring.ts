import { categoryMatch, isHardType } from "./constraints";
import type {
  Confidence,
  Constraint,
  ConstraintSet,
  Evidence,
  Place,
  Recommendation,
  Role,
  ScoreBreakdown,
} from "./domain";
import type { SoftAssessment } from "./openai";

const CONFIDENCE_WEIGHT: Record<Confidence, number> = {
  CONFIRMED: 1,
  LIKELY: 0.7,
  INFERRED: 0.4,
  UNKNOWN: 0,
};

export function hardFilter(places: Place[], constraints: ConstraintSet, radius: number) {
  const category = constraints.must.find((item) => item.type === "category");
  const wanted = typeof category?.value === "string" ? category.value : undefined;
  return places.filter((place) => {
    if (place.distance != null && place.distance > radius) return false;
    if (wanted && categoryMatch(place.category, wanted) === "miss") return false;
    return true;
  });
}

function fieldEvidence(place: Place): Evidence[] {
  return [
    {
      field: "distance",
      label: "거리",
      value: place.distance != null ? `${place.distance}m` : "없음",
      confidence: place.distance != null ? "CONFIRMED" : "UNKNOWN",
      source: "kakao",
    },
    {
      field: "category",
      label: "카테고리",
      value: place.category || "없음",
      confidence: place.category ? "CONFIRMED" : "UNKNOWN",
      source: "kakao",
    },
    {
      field: "phone",
      label: "전화번호",
      value: place.phone || "없음",
      confidence: place.phone ? "CONFIRMED" : "UNKNOWN",
      source: "kakao",
    },
    {
      field: "address",
      label: "주소",
      value: place.roadAddress || place.address || "없음",
      confidence: place.address ? "CONFIRMED" : "UNKNOWN",
      source: "kakao",
    },
  ];
}

function unverifiable(constraint: Constraint): Evidence {
  return {
    field: constraint.type,
    label: constraint.label,
    value: "확인 불가",
    confidence: "UNKNOWN",
    source: "카카오 로컬 검색에 해당 필드가 없음",
  };
}

function constraintEvidence(
  constraint: Constraint,
  place: Place,
  assessment?: SoftAssessment,
): Evidence {
  if (constraint.type === "category") {
    const wanted = String(constraint.value);
    const matched = categoryMatch(place.category, wanted);
    return {
      field: "category",
      label: constraint.label,
      value: place.category || "없음",
      confidence: matched === "match" ? "CONFIRMED" : "UNKNOWN",
      source: "kakao",
    };
  }
  if (constraint.type === "radius") {
    return {
      field: "radius",
      label: constraint.label,
      value: place.distance != null ? `${place.distance}m` : "없음",
      confidence: place.distance != null ? "CONFIRMED" : "UNKNOWN",
      source: "kakao",
    };
  }
  if (isHardType(constraint.type)) return unverifiable(constraint);

  const bucket = constraint.priority === "AVOID" ? assessment?.avoid : assessment?.prefer;
  const found = bucket?.find((item) => item.type === constraint.type);
  if (!found || found.state === "unknown") return unverifiable(constraint);
  const confidence: Confidence =
    found.state === "yes" ? "INFERRED" : found.state === "partial" ? "INFERRED" : "INFERRED";
  return {
    field: constraint.type,
    label: constraint.label,
    value: found.state === "no" ? "해당 낮음" : found.state === "partial" ? "일부 추정" : "추정",
    confidence,
    source: "모델 추정. 장소 원천 데이터에는 없음",
  };
}

function preferPoints(constraints: ConstraintSet, assessment?: SoftAssessment) {
  if (constraints.prefer.length === 0) return 25;
  const share = 25 / constraints.prefer.length;
  const sum = constraints.prefer.reduce((total, item) => {
    const found = assessment?.prefer.find((entry) => entry.type === item.type);
    if (found?.state === "yes") return total + share;
    if (found?.state === "partial") return total + share * 0.5;
    return total;
  }, 0);
  return Math.round(sum);
}

function avoidPenalty(constraints: ConstraintSet, assessment?: SoftAssessment) {
  const sum = constraints.avoid.reduce((total, item) => {
    const found = assessment?.avoid.find((entry) => entry.type === item.type);
    if (found?.state === "yes") return total + 15;
    if (found?.state === "partial") return total + 8;
    return total;
  }, 0);
  return Math.min(30, sum);
}

function confidencePoints(evidence: Evidence[]) {
  if (evidence.length === 0) return 0;
  const average =
    evidence.reduce((total, item) => total + CONFIDENCE_WEIGHT[item.confidence], 0) /
    evidence.length;
  return Math.round(15 * average);
}

function locationPoints(place: Place, radius: number) {
  if (place.distance == null || radius <= 0) return 8;
  const ratio = 1 - Math.min(place.distance, radius) / radius;
  return Math.round(20 * ratio);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildEvidence(place: Place, constraints: ConstraintSet, assessment?: SoftAssessment) {
  const base = fieldEvidence(place);
  const constraintsAll = [...constraints.must, ...constraints.prefer, ...constraints.avoid];
  const extra = constraintsAll
    .filter((item) => item.type !== "category" && item.type !== "radius")
    .map((item) => constraintEvidence(item, place, assessment));
  const category = constraints.must.find((item) => item.type === "category");
  const radius = constraints.must.find((item) => item.type === "radius");
  return [
    ...base,
    ...(radius ? [constraintEvidence(radius, place, assessment)] : []),
    ...(category ? [constraintEvidence(category, place, assessment)] : []),
    ...extra,
  ];
}

export function scorePlace(input: {
  place: Place;
  constraints: ConstraintSet;
  radius: number;
  assessment?: SoftAssessment;
  allPlaces: Place[];
  modelRan?: boolean;
}) {
  const evidence = buildEvidence(input.place, input.constraints, input.assessment);
  const location = locationPoints(input.place, input.radius);
  const wanted = input.constraints.must.find((item) => item.type === "category");
  const matched = categoryMatch(
    input.place.category,
    typeof wanted?.value === "string" ? wanted.value : undefined,
  );
  const category = matched === "miss" ? 0 : matched === "match" ? 20 : 14;
  const prefer = preferPoints(input.constraints, input.assessment);
  const contextAssessed = Boolean(input.assessment) || Boolean(input.modelRan);
  const context = input.assessment?.contextScore ?? 0;
  const confidence = confidencePoints(evidence);
  const avoid = avoidPenalty(input.constraints, input.assessment);
  const breakdown: ScoreBreakdown = {
    location,
    category,
    prefer,
    context,
    confidence,
    avoid,
    contextAssessed,
  };
  const objective = location + category + prefer + confidence - avoid;
  const score = contextAssessed
    ? clampScore(objective + context)
    : clampScore((objective / 80) * 100);

  const groups = [...input.constraints.must, ...input.constraints.prefer, ...input.constraints.avoid];
  const tracked = groups.map((constraint) => {
    return (
      evidence.find((item) => item.field === constraint.type && item.label === constraint.label) ??
      evidence.find((item) => item.field === constraint.type)
    );
  }).filter((item): item is Evidence => Boolean(item));
  const matchedCount = tracked.filter(
    (item) => item.confidence === "CONFIRMED" || item.confidence === "LIKELY",
  ).length;
  const unknowns = evidence.filter((item) => item.confidence === "UNKNOWN").map((item) => item.label);
  const unknownLine =
    unknowns.length > 0
      ? `이 조건은 현재 확인할 수 없습니다. ${[...new Set(unknowns)].slice(0, 4).join(", ")}`
      : "";

  const otherName = input.allPlaces.some(
    (place) => place.kakaoId !== input.place.kakaoId && place.name && input.assessment?.reason.includes(place.name),
  );
  const modelReason = !otherName ? input.assessment?.reason.trim() : "";
  const reason =
    modelReason ||
    `${input.place.category || "음식점"} · ${input.place.distance != null ? `${input.place.distance}m` : "거리 미확인"} 기준으로 골랐습니다.`;
  const modelTradeoff = input.assessment?.tradeoff.trim() ?? "";
  const tradeoff = unknownLine
    ? modelTradeoff.includes("확인할 수 없")
      ? modelTradeoff
      : [modelTradeoff, unknownLine].filter(Boolean).join(" ")
    : modelTradeoff || "확인된 범위 안에서 고른 후보입니다.";

  return {
    evidence,
    breakdown,
    score,
    reason,
    tradeoff,
    matchedCount,
    totalCount: tracked.length,
    confidenceScore: confidence,
    contextScore: context,
  };
}

export function assignRoles(
  places: Place[],
  constraints: ConstraintSet,
  radius: number,
  assessments: SoftAssessment[],
  modelRan = false,
): Recommendation[] {
  const byId = new Map(assessments.map((item) => [item.placeId, item]));
  const scored = places.map((place) => {
    const result = scorePlace({
      place,
      constraints,
      radius,
      assessment: byId.get(place.kakaoId),
      allPlaces: places,
      modelRan,
    });
    return { place, ...result };
  });
  scored.sort((a, b) => b.score - a.score || (a.place.distance ?? 99999) - (b.place.distance ?? 99999));
  if (scored.length === 0) return [];

  const chosen: { role: Role; item: (typeof scored)[number] }[] = [];
  const used = new Set<string>();
  const take = (role: Role, pool: typeof scored) => {
    const next = pool.find((item) => !used.has(item.place.kakaoId));
    if (!next) return;
    used.add(next.place.kakaoId);
    chosen.push({ role, item: next });
  };

  take("BEST_FIT", scored);
  const byConfidence = [...scored].sort(
    (a, b) => b.confidenceScore - a.confidenceScore || b.score - a.score,
  );
  take("SAFE_PICK", byConfidence);
  const byContext = [...scored].sort((a, b) => b.contextScore - a.contextScore || b.score - a.score);
  take("WILD_CARD", byContext);

  return chosen.map(({ role, item }) => ({
    id: item.place.kakaoId,
    place: item.place,
    role,
    score: item.score,
    reason: item.reason,
    tradeoff: item.tradeoff,
    evidence: item.evidence,
    breakdown: item.breakdown,
    matchedCount: item.matchedCount,
    totalCount: item.totalCount,
  }));
}

export function topCandidates(places: Place[], constraints: ConstraintSet, radius: number, limit = 8) {
  return [...places]
    .map((place) => ({
      place,
      objective: scorePlace({ place, constraints, radius, allPlaces: places }).score,
    }))
    .sort((a, b) => b.objective - a.objective)
    .slice(0, limit)
    .map((item) => item.place);
}
