import { z } from "zod";
import {
  constraintSetFromModel,
  type ModelConstraintPayload,
  type RefinePatch,
} from "./constraints";
import type { ConstraintSet, DiningDraft, Place } from "./domain";

const loose = z.object({
  type: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  label: z.string().optional(),
});

const parseSchema = z.object({
  must: z.array(loose).optional(),
  prefer: z.array(loose).optional(),
  avoid: z.array(loose).optional(),
  searchQueries: z.array(z.string()).optional(),
});

const refineSchema = z.object({
  removeMust: z.array(z.string()).optional(),
  removePrefer: z.array(z.string()).optional(),
  removeAvoid: z.array(z.string()).optional(),
  addMust: z.array(loose).optional(),
  addPrefer: z.array(loose).optional(),
  addAvoid: z.array(loose).optional(),
  radius: z.number().nullable().optional(),
  budgetPerPerson: z.number().nullable().optional(),
  category: z.string().nullable().optional(),
  searchQueries: z.array(z.string()).optional(),
});

const state = z.enum(["yes", "partial", "no", "unknown"]);

const evaluationSchema = z.object({
  evaluations: z.array(
    z.object({
      placeId: z.string(),
      prefer: z.array(z.object({ type: z.string(), state })).optional(),
      avoid: z.array(z.object({ type: z.string(), state })).optional(),
      contextScore: z.number().optional(),
      reason: z.string().optional(),
      tradeoff: z.string().optional(),
    }),
  ),
});

export type SoftAssessment = {
  placeId: string;
  prefer: { type: string; state: "yes" | "partial" | "no" | "unknown" }[];
  avoid: { type: string; state: "yes" | "partial" | "no" | "unknown" }[];
  contextScore: number;
  reason: string;
  tradeoff: string;
};

const SAFETY = `규칙:
1. 제공되지 않은 장소 정보는 사실로 만들지 않는다.
2. UNKNOWN 데이터를 CONFIRMED로 말하지 않는다.
3. 장소 이름을 새로 만들지 않는다.
4. 추천 후보는 주어진 candidate list 안에서만 다룬다.
5. 주차, 가격, 메뉴, 별점, 리뷰, 웨이팅, 룸, 소음, 영업 여부는 입력에 없으면 unknown이다.
6. JSON만 반환한다.`;

function messageText(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) return String(part.text ?? "");
        return "";
      })
      .join("");
  }
  return "";
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced ? fenced[1] : trimmed) as unknown;
}

async function complete(system: string, user: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) throw new Error("NO_OPENAI");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("GPT_FAILED");
  const payload = (await response.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const text = messageText(payload.choices?.[0]?.message?.content);
  if (!text) throw new Error("GPT_FAILED");
  return extractJson(text);
}

export async function parseConstraints(draft: DiningDraft) {
  const parsed = await complete(
    `${SAFETY}
사용자는 식사 장소를 찾고 있다. 구조화 입력과 자연어를 Must / Prefer / Avoid로 나눠라.
searchQueries는 카카오 키워드 검색용 짧은 구절이며 최대 3개다. 식당 상호를 만들지 않는다.
type은 radius, category, partySize, parking, noise, budget, reservation, waiting, atmosphere, companion, taste, room, other 중 하나다.
이미 UI에 있는 조건과 겹쳐도 자연어에서 새로 드러난 조건만 넣어라.`,
    JSON.stringify({
      structuredInputs: {
        companion: draft.companion,
        customCompanion: draft.customCompanion,
        partySize: draft.partySize,
        location: draft.location?.label,
        category: draft.category,
        budgetPerPerson: draft.budgetPerPerson,
        radius: draft.radius,
        parking: draft.parking,
        quiet: draft.quiet,
        reservation: draft.reservation,
        avoidWaiting: draft.avoidWaiting,
      },
      freeText: draft.prompt,
    }),
  );
  const safe = parseSchema.parse(parsed) as ModelConstraintPayload;
  return constraintSetFromModel(safe);
}

export async function evaluatePlaces(input: {
  constraints: ConstraintSet;
  places: Place[];
  prompt?: string;
}) {
  const allowed = new Set(input.places.map((place) => place.kakaoId));
  const parsed = await complete(
    `${SAFETY}
각 후보의 상황 적합도만 평가한다. contextScore는 0부터 20까지다.
prefer.state와 avoid.state는 yes, partial, no, unknown 중 하나다.
reason과 tradeoff는 한국어 한두 문장이다. 입력에 없는 주차·가격·리뷰를 확인된 사실처럼 쓰지 않는다.
evaluations 배열의 placeId는 입력 후보의 kakaoId만 허용된다.`,
    JSON.stringify({
      prompt: input.prompt ?? "",
      constraints: input.constraints,
      candidates: input.places.map((place) => ({
        placeId: place.kakaoId,
        name: place.name,
        category: place.category,
        distanceMeters: place.distance ?? null,
        address: place.address,
        phone: place.phone ?? null,
      })),
    }),
  );
  const safe = evaluationSchema.parse(parsed);
  return safe.evaluations
    .filter((item) => allowed.has(item.placeId))
    .map<SoftAssessment>((item) => ({
      placeId: item.placeId,
      prefer: item.prefer ?? [],
      avoid: item.avoid ?? [],
      contextScore: Math.max(0, Math.min(20, Math.round(item.contextScore ?? 0))),
      reason: (item.reason ?? "").slice(0, 280),
      tradeoff: (item.tradeoff ?? "").slice(0, 280),
    }));
}

export async function refineConstraints(input: { constraints: ConstraintSet; prompt: string }) {
  const parsed = await complete(
    `${SAFETY}
현재 검색 세션의 조건 패치만 반환한다. 조건 전체를 다시 쓰지 않는다.
바꾸지 않는 숫자 필드는 null이다. remove 배열에는 제거할 type 문자열만 넣는다.`,
    JSON.stringify({
      current: input.constraints,
      prompt: input.prompt,
    }),
  );
  return refineSchema.parse(parsed) as RefinePatch;
}
