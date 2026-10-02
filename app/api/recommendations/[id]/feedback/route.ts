import { badRequest, feedbackSchema, readBody } from "@/lib/api-helpers";
import { addFeedback, getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await readBody(request, feedbackSchema);
  if (!body) return badRequest();
  const session = getSession(body.sessionId);
  const known = session?.recommendations.some((item) => item.id === id);
  if (!session || !known) {
    return Response.json({ ok: false, error: "추천 세션을 찾지 못했습니다." }, { status: 404 });
  }
  const saved = addFeedback(body.sessionId, {
    placeId: id,
    rating: body.rating,
    reasons: body.reasons,
    createdAt: new Date().toISOString(),
  });
  return Response.json({ ok: true, session: saved });
}
