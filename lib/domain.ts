export type Priority = "MUST" | "PREFER" | "AVOID";
export type Confidence = "CONFIRMED" | "LIKELY" | "INFERRED" | "UNKNOWN";
export type Role = "BEST_FIT" | "SAFE_PICK" | "WILD_CARD";
export type ConstraintSource = "UI" | "USER_TEXT" | "AI_INFERRED";

export type GeoLocation = {
  lat: number;
  lng: number;
  label: string;
};

export type Constraint = {
  id: string;
  type: string;
  value: string | number | boolean;
  priority: Priority;
  source: ConstraintSource;
  label: string;
};

export type ConstraintSet = {
  must: Constraint[];
  prefer: Constraint[];
  avoid: Constraint[];
  searchQueries: string[];
};

export type Place = {
  kakaoId: string;
  name: string;
  category: string;
  phone?: string;
  address: string;
  roadAddress?: string;
  lat: number;
  lng: number;
  distance?: number;
  kakaoPlaceUrl?: string;
};

export type Evidence = {
  field: string;
  label: string;
  value: string;
  confidence: Confidence;
  source?: string;
};

export type ScoreBreakdown = {
  location: number;
  category: number;
  prefer: number;
  context: number;
  confidence: number;
  avoid: number;
  contextAssessed: boolean;
};

export type Recommendation = {
  id: string;
  place: Place;
  role: Role;
  score: number;
  reason: string;
  tradeoff: string;
  evidence: Evidence[];
  breakdown: ScoreBreakdown;
  matchedCount: number;
  totalCount: number;
};

export type RelaxationOption = {
  id: string;
  change: "radius" | "category";
  label: string;
  from: string;
  to: string;
  nextRadius?: number;
  candidateCount: number;
  candidateGain: number;
};

export type Feedback = {
  placeId: string;
  rating: "great" | "ok" | "unsure" | "bad";
  reasons: string[];
  createdAt: string;
};

export type SearchSession = {
  id: string;
  location: GeoLocation;
  companion?: string;
  partySize?: number;
  radius: number;
  category?: string;
  budgetPerPerson?: number;
  prompt?: string;
  constraints: ConstraintSet;
  recommendations: Recommendation[];
  relaxation: RelaxationOption[];
  searchedCount?: number;
  passedCount?: number;
  notice?: string;
  feedback: Feedback[];
  createdAt: string;
  updatedAt: string;
};

export type DiningDraft = {
  location: GeoLocation | null;
  companion: string;
  customCompanion: string;
  partySize: number;
  category: string;
  budgetPerPerson: number | null;
  radius: number;
  parking: "must" | "prefer" | "off";
  quiet: boolean;
  reservation: boolean;
  avoidWaiting: boolean;
  prompt: string;
};

export const ROLE_COPY: Record<Role, { en: string; ko: string }> = {
  BEST_FIT: {
    en: "Best Fit",
    ko: "오늘 조건을 가장 균형 있게 만족하는 곳",
  },
  SAFE_PICK: {
    en: "Safe Pick",
    ko: "확인된 정보가 더 많아 실패 가능성이 낮은 곳",
  },
  WILD_CARD: {
    en: "Wild Card",
    ko: "일부 조건은 느슨하지만 다른 매력이 있는 곳",
  },
};

export const COMPANIONS = [
  { id: "alone", label: "혼자" },
  { id: "date", label: "연인" },
  { id: "friends", label: "친구" },
  { id: "family", label: "가족" },
  { id: "coworkers", label: "동료" },
  { id: "business", label: "비즈니스" },
  { id: "custom", label: "직접 입력" },
] as const;

export const FOOD_CATEGORIES = [
  "상관없음",
  "한식",
  "일식",
  "중식",
  "양식",
  "분식",
  "고기",
  "해산물",
  "카페",
] as const;

export const BUDGETS: { value: number | null; label: string }[] = [
  { value: null, label: "상관없음" },
  { value: 10000, label: "1만 원" },
  { value: 20000, label: "2만 원" },
  { value: 30000, label: "3만 원" },
  { value: 50000, label: "5만 원" },
];

export const RADII = [500, 1000, 2000, 3000, 5000];

export const EMPTY_DRAFT: DiningDraft = {
  location: null,
  companion: "",
  customCompanion: "",
  partySize: 2,
  category: "한식",
  budgetPerPerson: 30000,
  radius: 1000,
  parking: "off",
  quiet: false,
  reservation: false,
  avoidWaiting: false,
  prompt: "",
};

export function companionLabel(draft: Pick<DiningDraft, "companion" | "customCompanion">) {
  if (draft.companion === "custom") return draft.customCompanion.trim() || "직접 입력";
  return COMPANIONS.find((item) => item.id === draft.companion)?.label ?? draft.companion;
}

export function formatRadius(meters: number) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  const km = meters / 1000;
  return Number.isInteger(km) ? `${km}km` : `${km.toFixed(1)}km`;
}

export function formatDistance(meters?: number) {
  if (meters == null || Number.isNaN(meters)) return "거리 미확인";
  if (meters < 1000) return `${Math.round(meters)}m`;
  const km = meters / 1000;
  return Number.isInteger(km) ? `${km}km` : `${km.toFixed(1)}km`;
}

export function formatWon(amount?: number) {
  if (!amount) return "예산 제한 없음";
  return `1인 ${Math.round(amount / 10000)}만 원 이하`;
}
