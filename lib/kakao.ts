import type { Place } from "./domain";

/**
 * Kakao Local 키워드/카테고리 검색 document에서 사실로 쓸 수 있는 필드.
 * 주차, 가격, 메뉴, 별점, 리뷰, 웨이팅, 룸, 영업 여부, 소음은 이 응답에 없다.
 */
export const KAKAO_CONFIRMED_FIELDS = [
  "name",
  "category",
  "phone",
  "address",
  "roadAddress",
  "lat",
  "lng",
  "distance",
  "kakaoPlaceUrl",
] as const;

export const UNAVAILABLE_FIELDS = [
  "parking",
  "price",
  "menu",
  "rating",
  "review",
  "waiting",
  "room",
  "openNow",
  "noise",
] as const;

type KakaoDocument = {
  id?: string;
  place_name?: string;
  category_name?: string;
  category_group_code?: string;
  phone?: string;
  address_name?: string;
  road_address_name?: string;
  x?: string;
  y?: string;
  place_url?: string;
  distance?: string;
};

function toPlace(doc: KakaoDocument): Place | null {
  if (!doc.id || !doc.place_name || !doc.y || !doc.x) return null;
  const lat = Number(doc.y);
  const lng = Number(doc.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const distance = doc.distance ? Number(doc.distance) : undefined;
  return {
    kakaoId: doc.id,
    name: doc.place_name,
    category: doc.category_name ?? "",
    phone: doc.phone || undefined,
    address: doc.address_name ?? "",
    roadAddress: doc.road_address_name || undefined,
    lat,
    lng,
    distance: Number.isFinite(distance) ? distance : undefined,
    kakaoPlaceUrl: doc.place_url || undefined,
  };
}

async function kakaoGet(path: string, params: Record<string, string | number | undefined>) {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    throw new Error("장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
  }
  const url = new URL(`https://dapi.kakao.com${path}`);
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(name, String(value));
  }
  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
  }
  return response.json() as Promise<{ documents?: KakaoDocument[] }>;
}

export async function searchPlaces(input: {
  query?: string;
  categoryGroupCode: string;
  lat: number;
  lng: number;
  radius: number;
}) {
  const radius = Math.max(1, Math.min(20000, Math.round(input.radius)));
  const data = input.query
    ? await kakaoGet("/v2/local/search/keyword.json", {
        query: input.query,
        category_group_code: input.categoryGroupCode,
        x: input.lng,
        y: input.lat,
        radius,
        size: 15,
        page: 1,
        sort: "distance",
      })
    : await kakaoGet("/v2/local/search/category.json", {
        category_group_code: input.categoryGroupCode,
        x: input.lng,
        y: input.lat,
        radius,
        size: 15,
        page: 1,
        sort: "distance",
      });
  return (data.documents ?? []).map(toPlace).filter((place): place is Place => Boolean(place));
}

export async function searchQueries(input: {
  queries: string[];
  categoryGroupCode: string;
  lat: number;
  lng: number;
  radius: number;
}) {
  const queries = input.queries.length > 0 ? input.queries : [""];
  const batches = await Promise.all(
    queries.map((query) =>
      searchPlaces({
        query: query || undefined,
        categoryGroupCode: input.categoryGroupCode,
        lat: input.lat,
        lng: input.lng,
        radius: input.radius,
      }),
    ),
  );
  const byId = new Map<string, Place>();
  for (const place of batches.flat()) {
    if (!byId.has(place.kakaoId)) byId.set(place.kakaoId, place);
  }
  return [...byId.values()];
}

export async function geocodeLabel(query: string) {
  const data = await kakaoGet("/v2/local/search/keyword.json", {
    query,
    size: 1,
    page: 1,
  });
  const place = (data.documents ?? []).map(toPlace).find(Boolean);
  if (!place) return null;
  return { lat: place.lat, lng: place.lng, label: query.trim() };
}
