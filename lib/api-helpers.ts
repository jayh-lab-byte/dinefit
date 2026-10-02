import { z } from "zod";
import { constraintsFromDraft, sanitizeConstraintSet } from "@/lib/constraints";
import type { DiningDraft, SearchSession } from "@/lib/domain";
import { parseDraft } from "@/lib/recommend";
import { saveSession } from "@/lib/session";

export const locationSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  label: z.string().trim().min(1).max(80),
});

const constraintSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  priority: z.enum(["MUST", "PREFER", "AVOID"]),
  source: z.enum(["UI", "USER_TEXT", "AI_INFERRED"]).optional(),
  label: z.string(),
});

export const constraintSetSchema = z.object({
  must: z.array(constraintSchema),
  prefer: z.array(constraintSchema),
  avoid: z.array(constraintSchema),
  searchQueries: z.array(z.string()),
});

export const draftSchema = z.object({
  location: locationSchema,
  companion: z.string().max(40),
  customCompanion: z.string().max(40),
  partySize: z.number().int().min(1).max(20),
  category: z.string().max(20),
  budgetPerPerson: z.number().int().min(0).max(500000).nullable(),
  radius: z.number().int().min(100).max(20000),
  parking: z.enum(["must", "prefer", "off"]),
  quiet: z.boolean(),
  reservation: z.boolean(),
  avoidWaiting: z.boolean(),
  prompt: z.string().max(500),
});

export const recommendSchema = z.object({
  sessionId: z.string().min(1).optional(),
  location: locationSchema,
  radius: z.number().int().min(100).max(20000),
  companion: z.string().max(40).optional(),
  partySize: z.number().int().min(1).max(20).optional(),
  category: z.string().max(20).optional(),
  budgetPerPerson: z.number().int().min(0).max(500000).nullable().optional(),
  prompt: z.string().max(500).optional(),
  constraints: constraintSetSchema,
});

export const patchSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("prompt"), prompt: z.string().trim().min(1).max(500) }),
  z.object({
    op: z.literal("quick"),
    kind: z.enum(["closer", "cheaper", "quieter", "other_food", "other_mood"]),
  }),
  z.object({ op: z.literal("relax"), change: z.enum(["radius", "category"]) }),
  z.object({
    op: z.literal("move"),
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
    label: z.string().trim().min(1).max(80),
  }),
]);

export const feedbackSchema = z.object({
  sessionId: z.string().min(1),
  rating: z.enum(["great", "ok", "unsure", "bad"]),
  reasons: z.array(z.string().max(40)).max(6),
});

export async function readBody<T>(request: Request, schema: z.ZodType<T>) {
  try {
    return schema.parse(await request.json()) as T;
  } catch {
    return null;
  }
}

export function badRequest() {
  return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
}

export async function createParsedSession(draft: DiningDraft) {
  const base = constraintsFromDraft(draft);
  const parsed = await parseDraft(draft, base);
  const timestamp = new Date().toISOString();
  const session: SearchSession = {
    id: crypto.randomUUID(),
    location: draft.location!,
    companion: draft.companion,
    partySize: draft.partySize,
    radius: draft.radius,
    category: draft.category === "상관없음" ? undefined : draft.category,
    budgetPerPerson: draft.budgetPerPerson ?? undefined,
    prompt: draft.prompt,
    constraints: parsed.constraints,
    recommendations: [],
    relaxation: [],
    notice: parsed.notice,
    feedback: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return saveSession(session);
}

export function cleanConstraints(input: {
  must: { type: string; value: string | number | boolean; label: string; source?: "UI" | "USER_TEXT" | "AI_INFERRED" }[];
  prefer: { type: string; value: string | number | boolean; label: string; source?: "UI" | "USER_TEXT" | "AI_INFERRED" }[];
  avoid: { type: string; value: string | number | boolean; label: string; source?: "UI" | "USER_TEXT" | "AI_INFERRED" }[];
  searchQueries: string[];
}) {
  return sanitizeConstraintSet(input);
}
