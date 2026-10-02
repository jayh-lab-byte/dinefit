import { badRequest, createParsedSession, draftSchema, readBody } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const draft = await readBody(request, draftSchema);
  if (!draft) return badRequest();
  const session = await createParsedSession(draft);
  return Response.json({ ok: true, session });
}
