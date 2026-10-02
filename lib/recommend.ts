import {
  applyRefinePatch,
  categoryGroupCode,
  mergeConstraints,
  readNumberConstraint,
  readStringConstraint,
} from "./constraints";
import { formatRadius, type ConstraintSet, type GeoLocation, type RelaxationOption, type SearchSession } from "./domain";
import { searchQueries } from "./kakao";
import { evaluatePlaces, parseConstraints, refineConstraints } from "./openai";
import { assignRoles, hardFilter, topCandidates } from "./scoring";
import { saveSession, getSession } from "./session";

const GPT_NOTICE = "AI 조건 분석에 실패해 선택하신 기본 조건으로 검색했습니다.";
const KAKAO_NOTICE = "장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";

export type RecommendRequest = {
  sessionId?: string;
  location: GeoLocation;
  radius: number;
  companion?: string;
  partySize?: number;
  category?: string;
  budgetPerPerson?: number;
  prompt?: string;
  constraints: ConstraintSet;
};

function now() {
  return new Date().toISOString();
}

function blankSession(input: RecommendRequest, id: string): SearchSession {
  const existing = input.sessionId ? getSession(input.sessionId) : null;
  return {
    id,
    location: input.location,
    companion: input.companion,
    partySize: input.partySize,
    radius: input.radius,
    category: input.category,
    budgetPerPerson: input.budgetPerPerson,
    prompt: input.prompt,
    constraints: input.constraints,
    recommendations: [],
    relaxation: [],
    feedback: existing?.feedback ?? [],
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
}

async function suggestRelaxations(input: RecommendRequest, baseCount: number) {
  const options: RelaxationOption[] = [];
  const nextRadius = Math.min(20000, input.radius + 1000);
  if (nextRadius > input.radius) {
    const places = await searchQueries({
      queries: input.constraints.searchQueries,
      categoryGroupCode: categoryGroupCode(input.category),
      lat: input.location.lat,
      lng: input.location.lng,
      radius: nextRadius,
    });
    const count = hardFilter(places, input.constraints, nextRadius).length;
    if (count > baseCount) {
      options.push({
        id: "radius",
        change: "radius",
        label: `반경 ${formatRadius(nextRadius)}`,
        from: formatRadius(input.radius),
        to: formatRadius(nextRadius),
        nextRadius,
        candidateCount: count,
        candidateGain: count - baseCount,
      });
    }
  }

  const category = readStringConstraint(input.constraints, "category");
  if (category && category !== "상관없음") {
    const relaxedConstraints: ConstraintSet = {
      ...input.constraints,
      must: input.constraints.must.filter((item) => item.type !== "category"),
      searchQueries: input.constraints.searchQueries.map((query) =>
        query.replace(category, "").replace(/\s+/g, " ").trim(),
      ),
    };
    const queries = relaxedConstraints.searchQueries.filter(Boolean);
    const places = await searchQueries({
      queries: queries.length > 0 ? queries : [input.location.label],
      categoryGroupCode: categoryGroupCode(undefined),
      lat: input.location.lat,
      lng: input.location.lng,
      radius: input.radius,
    });
    const count = hardFilter(places, relaxedConstraints, input.radius).length;
    if (count > baseCount) {
      options.push({
        id: "category",
        change: "category",
        label: `${category} 조건을 풀기`,
        from: category,
        to: "음식 제한 없음",
        candidateCount: count,
        candidateGain: count - baseCount,
      });
    }
  }
  return options;
}

export async function runRecommendation(input: RecommendRequest) {
  const id = input.sessionId ?? crypto.randomUUID();
  try {
    const radius = readNumberConstraint(input.constraints, "radius") ?? input.radius;
    const category = input.category ?? readStringConstraint(input.constraints, "category");
    const places = await searchQueries({
      queries: input.constraints.searchQueries,
      categoryGroupCode: categoryGroupCode(category),
      lat: input.location.lat,
      lng: input.location.lng,
      radius,
    });
    const filtered = hardFilter(places, input.constraints, radius);
    const session = blankSession({ ...input, radius, category }, id);
    session.searchedCount = places.length;
    session.passedCount = filtered.length;

    if (filtered.length === 0) {
      session.relaxation = await suggestRelaxations({ ...input, radius, category }, 0);
      session.recommendations = [];
      saveSession(session);
      return { ok: true as const, session, destination: "negotiate" as const };
    }

    const shortlist = topCandidates(filtered, input.constraints, radius, 8);
    let assessments: Awaited<ReturnType<typeof evaluatePlaces>> = [];
    let modelRan = false;
    try {
      assessments = await evaluatePlaces({
        constraints: input.constraints,
        places: shortlist,
        prompt: input.prompt,
      });
      modelRan = true;
    } catch {
      session.notice = GPT_NOTICE;
    }
    session.recommendations = assignRoles(shortlist, input.constraints, radius, assessments, modelRan);
    saveSession(session);
    return { ok: true as const, session, destination: "results" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : KAKAO_NOTICE;
    return {
      ok: false as const,
      error: message.includes("장소 정보") ? message : KAKAO_NOTICE,
    };
  }
}

export async function parseDraft(draft: Parameters<typeof parseConstraints>[0], base: ConstraintSet) {
  try {
    const extra = await parseConstraints(draft);
    return { constraints: mergeConstraints(base, extra), notice: undefined };
  } catch {
    return { constraints: base, notice: GPT_NOTICE };
  }
}

export async function applyPrompt(session: SearchSession, prompt: string) {
  try {
    const patch = await refineConstraints({ constraints: session.constraints, prompt });
    session.constraints = applyRefinePatch(session.constraints, patch);
    if (typeof patch.radius === "number") session.radius = patch.radius;
    if (typeof patch.budgetPerPerson === "number") session.budgetPerPerson = patch.budgetPerPerson;
    if (typeof patch.category === "string") {
      session.category = patch.category === "상관없음" ? undefined : patch.category;
    }
  } catch {
    session.notice = GPT_NOTICE;
  }
  session.prompt = prompt;
  return runRecommendation(sessionToRequest(session));
}

export function sessionToRequest(session: SearchSession): RecommendRequest {
  return {
    sessionId: session.id,
    location: session.location,
    radius: session.radius,
    companion: session.companion,
    partySize: session.partySize,
    category: session.category,
    budgetPerPerson: session.budgetPerPerson,
    prompt: session.prompt,
    constraints: session.constraints,
  };
}
