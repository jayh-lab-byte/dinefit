import { badRequest, patchSchema, readBody } from "@/lib/api-helpers";
import { applyPrompt } from "@/lib/recommend";
import { applyMove, applyQuick, applyRelaxation } from "@/lib/refine-actions";
import { runRecommendation } from "@/lib/recommend";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) {
    return Response.json(
      { ok: false, error: "검색 세션이 만료되었습니다. 처음부터 다시 찾아 주세요." },
      { status: 404 },
    );
  }
  const patch = await readBody(request, patchSchema);
  if (!patch) return badRequest();

  const result =
    patch.op === "prompt"
      ? await applyPrompt(session, patch.prompt)
      : await runRecommendation(
          patch.op === "quick"
            ? applyQuick(session, patch.kind)
            : patch.op === "relax"
              ? applyRelaxation(session, patch.change)
              : applyMove(session, { lat: patch.lat, lng: patch.lng, label: patch.label }),
        );

  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: 502 });
  return Response.json({ ok: true, destination: result.destination, session: result.session });
}
