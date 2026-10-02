import {
  companionLabel,
  formatRadius,
  type Constraint,
  type ConstraintSet,
  type ConstraintSource,
  type DiningDraft,
  type Priority,
} from "./domain";

export const ALLOWED_TYPES = [
  "radius",
  "category",
  "partySize",
  "parking",
  "noise",
  "budget",
  "reservation",
  "waiting",
  "atmosphere",
  "companion",
  "taste",
  "room",
  "other",
] as const;

export type AllowedType = (typeof ALLOWED_TYPES)[number];

const HARD_TYPES = new Set(["radius", "category"]);

export function isHardType(type: string) {
  return HARD_TYPES.has(type);
}

export function categoryGroupCode(category?: string) {
  return category === "카페" ? "CE7" : "FD6";
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  한식: ["한식", "한정식", "국밥", "백반", "찌개", "곰탕", "냉면"],
  일식: ["일식", "초밥", "스시", "돈가스", "우동", "라멘", "회"],
  중식: ["중식", "중국집"],
  양식: ["양식", "이탈리", "파스타", "피자", "스테이크", "버거", "햄버거"],
  분식: ["분식", "김밥", "떡볶이"],
  고기: ["고기", "육류", "곱창", "삼겹", "갈비"],
  해산물: ["해산물", "회", "조개", "게요리", "장어"],
  카페: ["카페", "디저트", "베이커리", "커피"],
};

export function categoryMatch(categoryName: string, wanted?: string) {
  if (!wanted || wanted === "상관없음") return "any" as const;
  const aliases = CATEGORY_ALIASES[wanted] ?? [wanted];
  return aliases.some((alias) => categoryName.includes(alias)) ? ("match" as const) : ("miss" as const);
}

export function defaultQueries(label: string, category?: string, companion?: string) {
  const area = label.replace(/\s+/g, " ").trim();
  const queries: string[] = [];
  if (category && category !== "상관없음") {
    queries.push(`${area} ${category}`);
    queries.push(`${area} ${category} 식당`);
  } else {
    queries.push(`${area} 음식점`);
  }
  if (companion === "family") queries.push(`${area} 가족 식사`);
  if (companion === "date") queries.push(`${area} 데이트`);
  if (companion === "business") queries.push(`${area} 비즈니스 식사`);
  return queries.slice(0, 3);
}

function makeConstraint(
  type: string,
  value: string | number | boolean,
  priority: Priority,
  source: ConstraintSource,
  label: string,
): Constraint {
  return {
    id: `${priority}:${type}:${String(value)}`,
    type,
    value,
    priority,
    source,
    label: label.slice(0, 40),
  };
}

export function constraintsFromDraft(draft: DiningDraft): ConstraintSet {
  const must: Constraint[] = [];
  const prefer: Constraint[] = [];
  const avoid: Constraint[] = [];
  const label = draft.location?.label ?? "이 근처";

  must.push(makeConstraint("radius", draft.radius, "MUST", "UI", `${formatRadius(draft.radius)} 이내`));

  if (draft.category && draft.category !== "상관없음") {
    must.push(makeConstraint("category", draft.category, "MUST", "UI", draft.category));
  }
  if (draft.partySize) {
    must.push(makeConstraint("partySize", draft.partySize, "MUST", "UI", `${draft.partySize}명`));
  }
  if (draft.budgetPerPerson) {
    must.push(
      makeConstraint("budget", draft.budgetPerPerson, "MUST", "UI", `1인 ${Math.round(draft.budgetPerPerson / 10000)}만 원 이하`),
    );
  }
  if (draft.parking === "must") {
    must.push(makeConstraint("parking", true, "MUST", "UI", "주차 필요"));
  } else if (draft.parking === "prefer") {
    prefer.push(makeConstraint("parking", true, "PREFER", "UI", "주차되면 좋음"));
  }
  if (draft.quiet) prefer.push(makeConstraint("noise", "quiet", "PREFER", "UI", "조용한 곳"));
  if (draft.reservation) prefer.push(makeConstraint("reservation", true, "PREFER", "UI", "예약 선호"));
  if (draft.avoidWaiting) avoid.push(makeConstraint("waiting", "long", "AVOID", "UI", "긴 웨이팅"));
  if (draft.companion) {
    prefer.push(
      makeConstraint("companion", draft.companion, "PREFER", "UI", companionLabel(draft)),
    );
  }

  return {
    must,
    prefer,
    avoid,
    searchQueries: defaultQueries(label, draft.category, draft.companion),
  };
}

type LooseConstraint = {
  type?: string;
  value?: unknown;
  label?: string;
  source?: string;
};

function sanitizeOne(
  raw: LooseConstraint,
  priority: Priority,
  fallbackSource: ConstraintSource,
): Constraint | null {
  const type = String(raw.type ?? "");
  if (!ALLOWED_TYPES.includes(type as AllowedType)) return null;
  const value = raw.value;
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  ) {
    return null;
  }
  if (typeof value === "string" && (value.length === 0 || value.length > 40)) return null;
  const source: ConstraintSource =
    raw.source === "UI" || raw.source === "USER_TEXT" || raw.source === "AI_INFERRED"
      ? raw.source
      : fallbackSource;
  const label = String(raw.label ?? type).slice(0, 40);
  return makeConstraint(type, value, priority, source, label);
}

type IncomingConstraint = {
  type: string;
  value: string | number | boolean;
  label: string;
  source?: ConstraintSource;
};

type IncomingSet = {
  must: IncomingConstraint[];
  prefer: IncomingConstraint[];
  avoid: IncomingConstraint[];
  searchQueries: string[];
};

export function sanitizeConstraintSet(input: IncomingSet): ConstraintSet {
  const must = input.must
    .map((item) => sanitizeOne(item, "MUST", item.source ?? "UI"))
    .filter((item): item is Constraint => Boolean(item))
    .slice(0, 8);
  const prefer = input.prefer
    .map((item) => sanitizeOne(item, "PREFER", item.source ?? "UI"))
    .filter((item): item is Constraint => Boolean(item))
    .slice(0, 8);
  const avoid = input.avoid
    .map((item) => sanitizeOne(item, "AVOID", item.source ?? "UI"))
    .filter((item): item is Constraint => Boolean(item))
    .slice(0, 8);
  const searchQueries = input.searchQueries
    .map((query) => query.replace(/\s+/g, " ").trim())
    .filter((query) => query.length > 0 && query.length <= 40)
    .slice(0, 3);
  return { must, prefer, avoid, searchQueries };
}

export function mergeConstraints(base: ConstraintSet, extra: ConstraintSet | null): ConstraintSet {
  if (!extra) return sanitizeConstraintSet(base);
  const key = (item: Constraint) => `${item.priority}:${item.type}`;
  const must = [...base.must];
  const prefer = [...base.prefer];
  const avoid = [...base.avoid];
  for (const item of extra.must) {
    if (!must.some((current) => key(current) === key(item))) must.push(item);
  }
  for (const item of extra.prefer) {
    if (!prefer.some((current) => key(current) === key(item))) prefer.push(item);
  }
  for (const item of extra.avoid) {
    if (!avoid.some((current) => key(current) === key(item))) avoid.push(item);
  }
  const searchQueries = extra.searchQueries.length > 0 ? extra.searchQueries : base.searchQueries;
  return sanitizeConstraintSet({ must, prefer, avoid, searchQueries });
}

export type ModelConstraintPayload = {
  must?: LooseConstraint[];
  prefer?: LooseConstraint[];
  avoid?: LooseConstraint[];
  searchQueries?: string[];
};

export function constraintSetFromModel(payload: ModelConstraintPayload): ConstraintSet {
  return sanitizeConstraintSet({
    must: (payload.must ?? [])
      .map((item) => sanitizeOne({ ...item, source: "USER_TEXT" }, "MUST", "USER_TEXT"))
      .filter((item): item is Constraint => Boolean(item)),
    prefer: (payload.prefer ?? [])
      .map((item) => sanitizeOne({ ...item, source: "USER_TEXT" }, "PREFER", "USER_TEXT"))
      .filter((item): item is Constraint => Boolean(item)),
    avoid: (payload.avoid ?? [])
      .map((item) => sanitizeOne({ ...item, source: "USER_TEXT" }, "AVOID", "USER_TEXT"))
      .filter((item): item is Constraint => Boolean(item)),
    searchQueries: payload.searchQueries ?? [],
  });
}

export type RefinePatch = {
  removeMust?: string[];
  removePrefer?: string[];
  removeAvoid?: string[];
  addPrefer?: LooseConstraint[];
  addMust?: LooseConstraint[];
  addAvoid?: LooseConstraint[];
  radius?: number | null;
  budgetPerPerson?: number | null;
  category?: string | null;
  searchQueries?: string[];
};

function withoutType(items: Constraint[], types: string[] | undefined) {
  if (!types?.length) return items;
  const drop = new Set(types);
  return items.filter((item) => !drop.has(item.type));
}

export function applyRefinePatch(set: ConstraintSet, patch: RefinePatch): ConstraintSet {
  let must = withoutType(set.must, patch.removeMust);
  let prefer = withoutType(set.prefer, patch.removePrefer);
  let avoid = withoutType(set.avoid, patch.removeAvoid);

  for (const item of patch.addMust ?? []) {
    const next = sanitizeOne({ ...item, source: "USER_TEXT" }, "MUST", "USER_TEXT");
    if (next && !must.some((current) => current.type === next.type)) must.push(next);
  }
  for (const item of patch.addPrefer ?? []) {
    const next = sanitizeOne({ ...item, source: "USER_TEXT" }, "PREFER", "USER_TEXT");
    if (next && !prefer.some((current) => current.type === next.type)) prefer.push(next);
  }
  for (const item of patch.addAvoid ?? []) {
    const next = sanitizeOne({ ...item, source: "USER_TEXT" }, "AVOID", "USER_TEXT");
    if (next && !avoid.some((current) => current.type === next.type)) avoid.push(next);
  }

  if (typeof patch.radius === "number") {
    must = must.filter((item) => item.type !== "radius");
    must.push(makeConstraint("radius", patch.radius, "MUST", "USER_TEXT", `${formatRadius(patch.radius)} 이내`));
  }
  if (typeof patch.budgetPerPerson === "number") {
    must = must.filter((item) => item.type !== "budget");
    must.push(
      makeConstraint(
        "budget",
        patch.budgetPerPerson,
        "MUST",
        "USER_TEXT",
        `1인 ${Math.round(patch.budgetPerPerson / 10000)}만 원 이하`,
      ),
    );
  }
  if (typeof patch.category === "string") {
    must = must.filter((item) => item.type !== "category");
    if (patch.category && patch.category !== "상관없음") {
      must.push(makeConstraint("category", patch.category, "MUST", "USER_TEXT", patch.category));
    }
  }

  return sanitizeConstraintSet({
    must,
    prefer,
    avoid,
    searchQueries: patch.searchQueries?.length ? patch.searchQueries : set.searchQueries,
  });
}

export function readNumberConstraint(set: ConstraintSet, type: string) {
  const found = set.must.find((item) => item.type === type);
  return typeof found?.value === "number" ? found.value : undefined;
}

export function readStringConstraint(set: ConstraintSet, type: string) {
  const found = [...set.must, ...set.prefer].find((item) => item.type === type);
  return typeof found?.value === "string" ? found.value : undefined;
}

export function syncSessionFields<T extends { radius: number; category?: string; budgetPerPerson?: number; constraints: ConstraintSet }>(
  session: T,
): T {
  const radius = readNumberConstraint(session.constraints, "radius");
  const category = session.constraints.must.find((item) => item.type === "category");
  const budget = readNumberConstraint(session.constraints, "budget");
  return {
    ...session,
    radius: radius ?? session.radius,
    category: typeof category?.value === "string" ? category.value : undefined,
    budgetPerPerson: budget,
  };
}
