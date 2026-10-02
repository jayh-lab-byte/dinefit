import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { constraintsFromDraft, mergeConstraints, constraintSetFromModel } from "./constraints";
import { KAKAO_CONFIRMED_FIELDS, UNAVAILABLE_FIELDS } from "./kakao";
import { assignRoles, hardFilter, scorePlace } from "./scoring";
import { EMPTY_DRAFT, type DiningDraft, type Place } from "./domain";

function place(partial: Partial<Place> & Pick<Place, "kakaoId" | "name">): Place {
  return {
    category: "음식점 > 한식",
    address: "서울 성동구",
    lat: 37.544,
    lng: 127.055,
    distance: 400,
    phone: "02-000-0000",
    ...partial,
  };
}

const draft: DiningDraft = {
  ...EMPTY_DRAFT,
  location: { lat: 37.544, lng: 127.055, label: "성수" },
  companion: "family",
  partySize: 3,
  category: "한식",
  budgetPerPerson: 30000,
  radius: 2000,
  parking: "must",
  quiet: true,
  avoidWaiting: true,
  prompt: "부모님 모시고 갈 거야. 너무 시끄럽지 않았으면 좋겠어.",
};

describe("카카오 필드 계약", () => {
  it("주차와 가격은 확인 필드에 없다", () => {
    for (const field of ["parking", "price", "menu", "rating", "review", "waiting", "noise"]) {
      assert.equal(KAKAO_CONFIRMED_FIELDS.includes(field as never), false);
      assert.equal(UNAVAILABLE_FIELDS.includes(field as never), true);
    }
  });
});

describe("조건과 필터", () => {
  it("구조화 입력만으로 Must를 만든다", () => {
    const set = constraintsFromDraft(draft);
    assert.ok(set.must.some((item) => item.type === "parking"));
    assert.ok(set.must.some((item) => item.type === "category" && item.value === "한식"));
    assert.ok(set.prefer.some((item) => item.type === "noise"));
    assert.ok(set.avoid.some((item) => item.type === "waiting"));
  });

  it("모델이 넣은 허용되지 않은 타입과 상호 후보는 버린다", () => {
    const extra = constraintSetFromModel({
      must: [{ type: "placeName", value: "없는식당", label: "없는식당" }],
      prefer: [{ type: "noise", value: "quiet", label: "조용함" }],
      searchQueries: ["성수 한식", "성수 가족 식사"],
    });
    const merged = mergeConstraints(constraintsFromDraft(draft), extra);
    assert.equal(merged.must.some((item) => item.type === "placeName"), false);
    assert.ok(merged.searchQueries.includes("성수 한식"));
  });

  it("반경 밖과 카테고리 불일치는 제거하고 주차 미확인은 남긴다", () => {
    const set = constraintsFromDraft(draft);
    const kept = hardFilter(
      [
        place({ kakaoId: "1", name: "가까운한식", distance: 500 }),
        place({ kakaoId: "2", name: "먼한식", distance: 3500 }),
        place({ kakaoId: "3", name: "초밥집", category: "음식점 > 일식 > 초밥", distance: 300 }),
      ],
      set,
      2000,
    );
    assert.deepEqual(kept.map((item) => item.kakaoId), ["1"]);
  });
});

describe("점수와 역할", () => {
  it("점수는 서버가 계산하고 주차는 UNKNOWN이다", () => {
    const set = constraintsFromDraft(draft);
    const sample = place({ kakaoId: "1", name: "소담" });
    const scored = scorePlace({
      place: sample,
      constraints: set,
      radius: 2000,
      allPlaces: [sample],
    });
    const parking = scored.evidence.find((item) => item.field === "parking");
    assert.equal(parking?.confidence, "UNKNOWN");
    assert.equal(scored.score, scorePlace({
      place: sample,
      constraints: set,
      radius: 2000,
      allPlaces: [sample],
    }).score);
    assert.ok(scored.score >= 0 && scored.score <= 100);
    assert.match(scored.tradeoff, /이 조건은 현재 확인할 수 없습니다/);
  });

  it("후보가 하나면 역할을 지어내지 않는다", () => {
    const set = constraintsFromDraft(draft);
    const sample = place({ kakaoId: "1", name: "소담" });
    const roles = assignRoles([sample], set, 2000, []);
    assert.equal(roles.length, 1);
    assert.equal(roles[0]?.role, "BEST_FIT");
  });

  it("목록 밖 장소 평가는 역할에 들어가지 않는다", () => {
    const set = constraintsFromDraft(draft);
    const first = place({ kakaoId: "1", name: "소담", distance: 200 });
    const second = place({ kakaoId: "2", name: "온온가", distance: 800 });
    const third = place({ kakaoId: "3", name: "기와담", distance: 1200, phone: undefined });
    const roles = assignRoles(
      [first, second, third],
      set,
      2000,
      [
        {
          placeId: "999",
          prefer: [],
          avoid: [],
          contextScore: 20,
          reason: "없는식당이 더 좋습니다.",
          tradeoff: "",
        },
        {
          placeId: "2",
          prefer: [{ type: "noise", state: "yes" }],
          avoid: [],
          contextScore: 5,
          reason: "거리가 확인된 후보입니다.",
          tradeoff: "주차는 확인할 수 없습니다.",
        },
      ],
      true,
    );
    assert.equal(roles.some((item) => item.place.kakaoId === "999"), false);
    assert.equal(roles.some((item) => item.reason.includes("없는식당")), false);
    assert.deepEqual(
      roles.map((item) => item.role),
      ["BEST_FIT", "SAFE_PICK", "WILD_CARD"],
    );
  });
});
