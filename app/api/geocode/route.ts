import { geocodeLabel } from "@/lib/kakao";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 1 || query.length > 80) {
    return Response.json({ error: "지역 이름을 입력해 주세요." }, { status: 400 });
  }
  try {
    const location = await geocodeLabel(query);
    if (!location) {
      return Response.json({ error: "해당 지역을 찾지 못했습니다." }, { status: 404 });
    }
    return Response.json({ location });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
    return Response.json({ error: message }, { status: 502 });
  }
}
