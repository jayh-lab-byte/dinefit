import { badRequest, cleanConstraints, readBody, recommendSchema } from "@/lib/api-helpers";
import { runRecommendation } from "@/lib/recommend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readBody(request, recommendSchema);
  if (!body) return badRequest();
  const result = await runRecommendation({
    ...body,
    category: body.category,
    budgetPerPerson: body.budgetPerPerson ?? undefined,
    constraints: cleanConstraints(body.constraints),
  });
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: 502 });
  return Response.json({ ok: true, destination: result.destination, session: result.session });
}
