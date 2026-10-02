# AI Dining Decision App
## 서비스 기획서 + 개발 명세서 v1.0

작성 기준: 2026-10-01  
핵심 외부 연동: Kakao Map/Local API, OpenAI GPT API  
제품 정의: **맛집 검색 앱이 아니라, 사용자의 오늘 상황과 조건을 해석해 실제 방문 가능한 식당 3곳으로 결정을 압축하는 AI Dining Decision 서비스**

---

# 1. 서비스 개요

## 1.1 한 줄 정의

> 위치·동행·예산·음식·주차 같은 구조화 조건과 자연어 상황을 함께 입력하면, AI가 조건의 우선순위를 이해하고 실제 식당 후보를 찾아 **오늘 가장 잘 맞는 3곳**으로 압축해 추천하는 서비스.

## 1.2 해결하려는 문제

기존 맛집 탐색은 다음과 같은 문제를 가진다.

- 지도에서 식당을 너무 많이 보여줘 사용자가 다시 비교해야 한다.
- 필터는 객관 조건만 처리하고 “부모님과 간다”, “대화하기 좋아야 한다” 같은 상황 맥락을 이해하지 못한다.
- AI 챗봇형 추천은 자연어는 이해하지만 실제 장소 정보의 신뢰도와 최신성이 불명확할 수 있다.
- 여러 조건을 동시에 만족하는 곳이 없을 때 검색이 실패하거나 사용자가 직접 조건을 다시 바꿔야 한다.
- “왜 이 식당이 나에게 맞는지”, “어떤 조건은 만족하지 못하는지”가 명확하지 않다.

## 1.3 제품 원칙

1. **Search보다 Decision**
   - 수십 개를 보여주지 않고 3개로 압축한다.

2. **Prompt보다 Context**
   - 자연어만 강요하지 않고 구조화 옵션과 자연어를 함께 사용한다.

3. **Best Restaurant보다 Best Fit for Today**
   - 절대적인 맛집 순위가 아니라 오늘 상황에 대한 적합도를 판단한다.

4. **AI가 모르는 것은 모른다고 표시**
   - 확인된 정보와 추론된 정보를 구분한다.

5. **추천 이유와 Trade-off를 함께 제공**
   - 장점만 말하지 않는다.

6. **검색 실패를 협상으로 전환**
   - 조건이 충돌하면 AI가 최소 조건 완화안을 제안한다.

---

# 2. 핵심 사용자 시나리오

## Scenario A — 부모님과 저녁

사용자 입력:

- 위치: 성수
- 인원: 3명
- 동행: 가족
- 음식: 한식
- 예산: 1인 3만원
- 주차: 필수

자연어:

> 부모님 모시고 갈 거야. 너무 시끄럽지 않고 맵지 않은 메뉴가 많았으면 좋겠어.

AI 해석:

### MUST
- 성수 인근
- 3명
- 한식
- 주차 필요

### PREFER
- 조용함
- 부모님과 방문하기 편함
- 맵지 않은 메뉴

### AVOID
- 긴 웨이팅
- 지나치게 캐주얼하거나 시끄러운 공간

결과:

- Best Fit
- Safe Pick
- Wild Card

각 카드에 조건 충족 여부, 추천 이유, 아쉬운 점, 데이터 신뢰도를 표시한다.

---

## Scenario B — 조건 충돌

조건:

- 강남
- 6명
- 일식
- 룸 필수
- 주차 필수
- 1인 2만원 이하

검색 결과 0개.

AI:

> 현재 조건을 모두 만족하는 후보를 찾지 못했습니다.

대안:

- 예산 +1만원 → 후보 4곳
- 반경 +2km → 후보 7곳
- 룸 → 조용한 일반석 → 후보 9곳

사용자가 “룸은 양보할게”를 선택하면 해당 조건만 수정하고 재검색한다.

---

# 3. MVP 범위

## 3.1 MVP 핵심 기능

| No. | 기능 | 설명 | 우선순위 |
|---|---|---|---|
| 1 | 위치 설정 | GPS 현재 위치 기본 + 다른 지역 직접 변경 | P0 |
| 2 | 상황 설정 | 동행 유형, 인원, 음식, 예산, 거리, 핵심 조건 | P0 |
| 3 | 자연어 입력 | 사용자가 원하는 상황을 말하듯 추가 입력 | P0 |
| 4 | AI 조건 해석 | GPT가 Must / Prefer / Avoid 구조로 변환 | P0 |
| 5 | 조건 확인 | AI가 이해한 내용을 사용자가 수정 | P0 |
| 6 | 실제 장소 검색 | Kakao API를 통해 실제 식당 후보 수집 | P0 |
| 7 | AI 추천 3곳 | Best Fit / Safe Pick / Wild Card | P0 |
| 8 | 추천 근거 | 조건 충족, 추천 이유, Trade-off, 정보 신뢰도 | P0 |
| 9 | 재탐색/조건 협상 | 더 가까이, 더 저렴하게, 조건 완화 등 | P0 |
| 10 | 지도 | 추천 3곳과 현재/검색 위치를 Kakao Map에 표시 | P0 |
| 11 | 기본 행동 | 길찾기, 전화, 카카오맵 상세 보기, 저장 | P0 |
| 12 | 추천 피드백 | 딱 맞음/괜찮음/애매함/별로 + 이유 | P1 |

## 3.2 MVP에서 제외

- 자체 리뷰 작성
- SNS 피드
- 팔로우/팔로워
- 숏폼 콘텐츠
- 자체 예약 시스템
- 실시간 웨이팅 시스템
- 그룹 초대/투표
- AI 여행 일정 생성
- 자체 결제
- 포인트/레벨 시스템
- 완전한 장기 취향 프로필(Dining DNA)
- 식사 후 카페/바/산책 코스 자동 생성

위 기능은 핵심 추천 경험 검증 이후 확장한다.

---

# 4. 입력 설계

## 4.1 기본 구조

사용자가 모든 것을 프롬프트로 작성하게 하지 않는다.

### Step 1. 누구와?

- 혼자
- 연인
- 친구
- 가족
- 동료
- 비즈니스
- 직접 입력

### Step 2. 어디에서?

- 현재 위치
- 지역/역/장소 검색
- 지도에서 위치 변경

### Step 3. 기본 조건

- 인원
- 음식 카테고리
- 예산
- 탐색 반경
- 주차
- 조용함
- 예약 선호
- 웨이팅 선호

### Step 4. 자연어

Placeholder:

> “부모님이랑 갈 거야. 차 가져가고 너무 시끄럽지 않았으면 좋겠어.”

### Step 5. GPT 조건 정리

사용자의 선택값 + 자연어를 병합하여 다음 구조로 변환한다.

- MUST
- PREFER
- AVOID

사용자는 추천 시작 전 이 결과를 수정할 수 있다.

---

# 5. 조건 모델

## 5.1 Constraint Type

### MUST
반드시 만족해야 하는 조건.

예:
- 위치 반경
- 음식 카테고리
- 현재 영업
- 주차 필수

MUST 위반 후보는 원칙적으로 추천 대상에서 제거한다.

### PREFER
가능하면 만족해야 하는 조건.

예:
- 조용함
- 분위기
- 가성비
- 데이트 적합성

추천 점수에 반영한다.

### AVOID
피하고 싶은 조건.

예:
- 긴 웨이팅
- 시끄러운 매장
- 특정 음식
- 지나치게 높은 가격

해당 가능성이 높으면 감점한다.

---

# 6. 추천 결과 설계

## 6.1 최종 3개 역할

### 1. BEST FIT
오늘 설정한 조건을 가장 균형 있게 만족하는 후보.

### 2. SAFE PICK
정보 신뢰도가 비교적 높고 실패 가능성이 낮은 안정적 후보.

### 3. WILD CARD
일부 조건은 덜 맞지만 다른 매력이 큰 후보.

> 단순한 1위/2위/3위 순위가 아니라 서로 다른 선택 이유를 제공한다.

---

## 6.2 추천 카드 정보

각 카드에는 다음 정보를 표시한다.

- 식당명
- 카테고리
- 현재/기준 위치로부터 거리
- 주소
- 전화번호
- 예상 적합도
- 조건 충족 개수
- 추천 이유
- 아쉬운 점(Trade-off)
- 정보 신뢰도
- 길찾기
- 전화
- 카카오맵 상세 보기
- 저장

예시:

### BEST FIT · 92%

**OO식당**

추천 이유  
> 주차·거리·가족 식사 조건을 가장 균형 있게 만족합니다.

아쉬운 점  
> 조용함은 이용자 리뷰 등 별도 근거가 없어 추정 수준입니다.

조건:

- 거리: 확인됨
- 카테고리: 확인됨
- 전화번호: 확인됨
- 주차: 미확인
- 조용함: 추정
- 부모님 식사 적합성: 추론

---

# 7. 정보 신뢰도 모델

AI가 식당 속성을 사실처럼 생성하지 않도록 모든 속성에 provenance를 둔다.

| 상태 | 의미 | 예 |
|---|---|---|
| CONFIRMED | API 또는 명시적 원천 데이터로 확인됨 | 이름, 주소, 좌표, 거리, 전화번호, 카테고리 |
| LIKELY | 확보한 근거 텍스트에서 가능성이 높음 | 조용함, 분위기 |
| INFERRED | 상황·카테고리 등에 따른 AI 추론 | 부모님과 방문 적합 |
| UNKNOWN | 데이터 없음 | 주차, 실시간 웨이팅 등 |

### 원칙

- UNKNOWN은 GPT가 임의로 채우지 않는다.
- MUST 조건인데 UNKNOWN인 경우 “충족”으로 처리하지 않는다.
- 사용자가 “주차 필수”를 선택했으나 확인 가능한 데이터 소스가 없다면:
  - “주차 여부 확인 필요”로 표시하거나
  - 주차 정보를 검증 가능한 외부 데이터가 추가될 때까지 해당 조건을 `검증 불가` 상태로 처리한다.

---

# 8. 적합도 점수

## 8.1 원칙

GPT가 임의로 “94%”를 생성하지 않는다.

점수는 앱 로직에서 계산하고 GPT는 설명을 담당한다.

## 8.2 기본 계산 예시

```text
FinalScore =
  hardConstraintScore
  + locationScore
  + categoryScore
  + preferenceScore
  + contextScore
  + confidenceScore
  - avoidPenalty
```

예시 가중치:

| 항목 | 가중치 |
|---|---:|
| MUST 만족 | Gate |
| 거리 | 20 |
| 음식/카테고리 | 20 |
| PREFER 충족 | 25 |
| 상황 적합성 | 20 |
| 정보 신뢰도 | 15 |
| AVOID 해당 | -10 ~ -30 |

### MUST Gate

- 명확히 불충족 → 후보 제거
- 미확인 → 신뢰도 감점 또는 사용자에게 표시
- 충족 → 정상 진행

실제 가중치는 사용자 테스트 후 조정한다.

---

# 9. 조건 충돌 및 협상

추천 후보가 없거나 너무 적을 때 검색 실패 화면을 보여주지 않는다.

## 9.1 Relaxation Engine

각 조건을 하나씩 완화하여 후보 증가량을 계산한다.

예:

```json
[
  {
    "change": "radius",
    "from": "1km",
    "to": "2km",
    "candidateGain": 7
  },
  {
    "change": "budget",
    "from": "20000",
    "to": "30000",
    "candidateGain": 4
  }
]
```

UI:

> 조건을 모두 만족하는 곳이 없어요.  
> 한 가지만 바꾸면 선택지가 생깁니다.

- 반경 +1km → 7곳
- 예산 +1만원 → 4곳
- 주차 “필수” → “선호” → 6곳

선택 후 기존 세션을 유지한 채 재검색한다.

---

# 10. 지도 UX

## 10.1 추천 결과 화면

상단:
- Kakao Map
- 검색 기준 위치
- 추천 3개 마커
- 검색 반경

하단:
- Best Fit
- Safe Pick
- Wild Card 카드

## 10.2 상호작용

- 카드 클릭 → 지도 해당 마커 focus
- 마커 클릭 → 해당 카드 focus
- 지도 이동 → “이 지역에서 다시 찾기”
- 지역 변경 → 검색 중심 좌표 및 후보 갱신
- 길찾기 → 카카오맵 연결

---

# 11. 재탐색 UX

추천 결과 하단에 Quick Refinement 제공.

- 더 가까운 곳
- 더 저렴하게
- 더 조용하게
- 다른 음식
- 다른 분위기
- 조건 수정

추가 자연어:

> “이 셋보다 조금 더 캐주얼한 곳으로 찾아줘.”

GPT는 전체 조건을 다시 생성하지 않고 현재 검색 세션의 constraint patch만 반환한다.

예:

```json
{
  "operation": "update",
  "constraints": {
    "prefer": {
      "atmosphere": "casual"
    }
  }
}
```

---

# 12. 화면 구조

## Screen 01 — Home

- 현재 위치
- 동행 선택
- 자연어 입력
- 빠른 조건
- “AI에게 찾아달라고 하기”

## Screen 02 — Condition Review

타이틀:

> 이렇게 찾을게요.

섹션:
- MUST
- PREFER
- AVOID

액션:
- 조건 수정
- 조건 추가
- 추천 시작

## Screen 03 — Searching

진행 상태:

1. 요청 이해 중
2. 실제 장소 찾는 중
3. 조건 비교 중
4. 3곳으로 좁히는 중

## Screen 04 — Results

- 지도
- 검색 지역/반경
- Best Fit
- Safe Pick
- Wild Card
- Quick Refinement

## Screen 05 — Restaurant Detail

- 기본 정보
- 조건별 적합도
- 추천 이유
- Trade-off
- 데이터 신뢰도
- 길찾기
- 전화
- 카카오맵 상세
- 저장

## Screen 06 — No Exact Match

- 충돌 조건
- 완화 가능한 조건
- 조건 변경 시 예상 후보 수
- 재검색

---

# 13. 기술 아키텍처

```text
[Web / Mobile Web Client]
        │
        ├── Browser Geolocation
        │
        ├── Kakao Map SDK
        │
        ▼
[Backend API]
        │
        ├── Session / Constraint Manager
        ├── Recommendation Engine
        ├── Scoring Engine
        ├── Data Confidence Engine
        │
        ├──────────────► Kakao Local / Map API
        │
        └──────────────► OpenAI GPT API
```

### 핵심 원칙

**Kakao**
= 실제 장소 retrieval / 지도 / 좌표 / 기본 정보

**GPT**
= 사용자 의도 해석 / soft preference reasoning / 설명 생성 / 조건 수정 해석

**Backend Logic**
= 후보 필터링 / 점수 계산 / 데이터 신뢰도 / 세션 상태 관리

---

# 14. Kakao API 사용 범위

Kakao 공식 API 기준으로 장소 검색은 키워드 및 카테고리 검색을 사용할 수 있으며 위치 좌표, 반경, 정렬, 페이징을 조합할 수 있다.

## 14.1 예상 사용

### 장소 키워드 검색

```http
GET /v2/local/search/keyword.json
```

용도:
- “성수 한식”
- “강남 일식”
- 사용자 자연어를 GPT가 검색 키워드로 변환한 결과

### 카테고리 검색

```http
GET /v2/local/search/category.json
```

음식점 카테고리 후보 수집.

### 주요 응답 활용

- id
- place_name
- category_name
- category_group_code
- phone
- address_name
- road_address_name
- x
- y
- place_url
- distance

### 지도

Kakao Map SDK 또는 제공 가능한 Kakao 지도 API를 사용해:
- 지도 표시
- 마커
- 좌표
- 중심 이동
- 검색 반경 시각화

### 향후

도보 경로 API를 활용하면 식당 → 카페와 같은 확장 플로우에서 실제 이동 경로/거리를 계산할 수 있다.

---

# 15. OpenAI GPT 사용 범위

> 특정 모델 ID는 코드에 하드코딩하지 않고 환경변수로 관리한다.

```env
OPENAI_MODEL=<model-id>
```

## 15.1 GPT Task A — Constraint Parsing

입력:

```json
{
  "structuredInputs": {
    "companion": "parents",
    "partySize": 3,
    "location": "성수",
    "budgetPerPerson": 30000
  },
  "freeText": "차 가져가고 너무 시끄럽지 않았으면 좋겠어."
}
```

출력:

```json
{
  "must": [
    {
      "type": "parking",
      "value": true,
      "source": "user_text"
    }
  ],
  "prefer": [
    {
      "type": "noise",
      "value": "quiet",
      "source": "user_text"
    }
  ],
  "avoid": [],
  "searchQueries": [
    "성수 한식",
    "성수 가족 식사"
  ]
}
```

출력은 가능한 한 JSON Schema 기반 Structured Output으로 제한한다.

## 15.2 GPT Task B — Soft Preference Evaluation

GPT에 모든 인터넷 지식을 믿고 평가시키지 않는다.

입력으로 제공된 후보 데이터와 확보된 근거만 이용해:

- 상황 적합성
- PREFER 조건
- AVOID 조건

평가 결과를 구조화된 JSON으로 반환한다.

## 15.3 GPT Task C — Explanation

Scoring Engine 결과를 바탕으로:

- 추천 이유
- Trade-off
- 한 줄 설명

을 생성한다.

## 15.4 GPT Task D — Refinement Parsing

> “주차는 포기하고 더 가까운 곳”

→

```json
{
  "removeMust": ["parking"],
  "addPrefer": ["parking"],
  "update": {
    "distancePriority": "high"
  }
}
```

---

# 16. GPT 안전 규칙 / Hallucination 방지

System instruction의 핵심:

```text
1. 제공되지 않은 장소 정보는 사실로 생성하지 않는다.
2. UNKNOWN 데이터를 CONFIRMED로 표현하지 않는다.
3. 장소 이름을 새로 만들어내지 않는다.
4. 추천 후보는 서버가 제공한 candidate list 안에서만 선택한다.
5. 조건 충족 여부는 evidence 필드를 기준으로 판단한다.
6. 불확실할 경우 UNKNOWN 또는 INFERRED를 반환한다.
```

---

# 17. Backend API 설계 예시

## POST /api/constraints/parse

사용자 입력 → GPT 구조화.

Request:

```json
{
  "location": {
    "lat": 37.544,
    "lng": 127.055,
    "label": "성수"
  },
  "partySize": 2,
  "companion": "date",
  "filters": {},
  "prompt": "조용하고 주차되면 좋겠어."
}
```

Response:

```json
{
  "must": [],
  "prefer": [],
  "avoid": [],
  "searchQueries": []
}
```

---

## POST /api/recommendations

Request:

```json
{
  "sessionId": "...",
  "constraints": {},
  "location": {},
  "radius": 2000
}
```

처리:

1. Kakao 후보 검색
2. 중복 제거
3. MUST filter
4. soft evaluation
5. scoring
6. 3개 role assignment
7. 설명 생성

Response:

```json
{
  "recommendations": [
    {
      "role": "BEST_FIT",
      "place": {},
      "score": 92,
      "reason": "...",
      "tradeoff": "...",
      "constraints": [],
      "confidence": {}
    }
  ]
}
```

---

## PATCH /api/search-session/:id

조건 일부 수정.

```json
{
  "prompt": "좀 더 저렴한 곳"
}
```

---

## POST /api/recommendations/:id/feedback

```json
{
  "rating": "great",
  "reasons": [
    "quiet",
    "good_parking"
  ]
}
```

---

# 18. 데이터 모델

## SearchSession

```ts
type SearchSession = {
  id: string;
  location: GeoLocation;
  companion?: CompanionType;
  partySize?: number;
  radius: number;
  constraints: ConstraintSet;
  createdAt: string;
  updatedAt: string;
};
```

## Constraint

```ts
type Constraint = {
  id: string;
  type: string;
  value: unknown;
  priority: "MUST" | "PREFER" | "AVOID";
  source: "UI" | "USER_TEXT" | "AI_INFERRED";
};
```

## Place

```ts
type Place = {
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
```

## Evidence

```ts
type Evidence = {
  field: string;
  value: unknown;
  confidence:
    | "CONFIRMED"
    | "LIKELY"
    | "INFERRED"
    | "UNKNOWN";
  source?: string;
};
```

## Recommendation

```ts
type Recommendation = {
  placeId: string;
  role: "BEST_FIT" | "SAFE_PICK" | "WILD_CARD";
  score: number;
  reason: string;
  tradeoff?: string;
  evidence: Evidence[];
};
```

---

# 19. 후보 검색 전략

Kakao API 한 번의 query 결과만 사용하지 않는다.

예:

사용자:
- 성수
- 가족
- 한식

검색 query 후보:

1. 성수 한식
2. 성수 가족 식사
3. 성수 한정식

결과를 합친 뒤 Kakao place id로 중복 제거.

이후:

- 반경
- 카테고리
- 거리

등 객관 조건으로 1차 필터링한다.

GPT는 후보 생성기가 아니라 **후보 해석기/평가기**로 사용한다.

---

# 20. 성능 및 비용 최적화

## 20.1 GPT 호출 최소화

권장 플로우:

### GPT Call 1
사용자 prompt → Constraint JSON

### Kakao
후보 검색

### Backend
Hard filter + 기본 scoring

### GPT Call 2
상위 후보 N개만 soft evaluation + 설명

즉 식당 한 곳마다 GPT를 별도 호출하지 않는다.

## 20.2 캐싱

캐시 대상:

- 동일 Kakao place 기본 정보
- 지역별 카테고리 검색 결과
- 동일 검색 query
- AI 평가 가능한 정적 metadata

## 20.3 Model Config

환경변수:

```env
OPENAI_MODEL=
OPENAI_API_KEY=
KAKAO_REST_API_KEY=
KAKAO_JS_KEY=
```

개발/운영 환경을 분리한다.

---

# 21. 에러 처리

## GPS 거부

> 현재 위치 사용이 꺼져 있습니다.

- 지역 직접 입력
- 최근 검색 위치 사용

## Kakao API 실패

> 장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.

GPT가 임의 장소를 대신 생성해서는 안 된다.

## GPT 실패

기본 구조화 필터만으로 Kakao 검색 가능.

> AI 조건 분석에 실패해 선택하신 기본 조건으로 검색했습니다.

## 후보 0개

No Result가 아니라 Relaxation Flow 실행.

## 데이터 부족

> 이 조건은 현재 확인할 수 없습니다.

UNKNOWN 표시.

---

# 22. 개인정보 / 보안

- Kakao REST API Key와 OpenAI API Key를 Client에 노출하지 않는다.
- 외부 API 호출은 Backend를 통해 수행한다.
- 정확한 GPS 위치를 장기 저장하지 않는 것을 기본 정책으로 한다.
- 검색 세션은 필요 최소 기간만 저장한다.
- 사용자 자유 입력에서 불필요한 개인정보를 GPT에 전달하지 않는다.
- 로그에는 API Key, 인증 토큰, 민감한 위치 이력을 기록하지 않는다.

---

# 23. 성공 지표

초기에는 MAU보다 추천 품질을 본다.

## Primary Metrics

### Recommendation Acceptance Rate
추천 3개 중 하나를 상세 보기/길찾기/전화한 비율.

### Decision Completion Rate
추천 후 실제 행동까지 이어진 검색 세션 비율.

### Search Reformulation Rate
추천 직후 조건을 다시 수정한 비율.

높다고 무조건 나쁜 것은 아니므로 수정 이유와 함께 분석한다.

### No-result Recovery Rate
조건 협상 후 실제 추천으로 전환된 비율.

### Feedback Match Rate
“딱 맞음 / 괜찮음” 비율.

---

# 24. 개발 단계

## Phase 1 — Foundation

- Kakao Map 연결
- GPS
- 위치 검색
- Kakao 장소 검색
- 지도 마커
- 기본 장소 카드

## Phase 2 — AI Input

- 옵션 입력
- 자연어 입력
- GPT Constraint Parsing
- Condition Review

## Phase 3 — Recommendation

- Candidate Retrieval
- Hard Filtering
- Scoring Engine
- Soft Evaluation
- 3 Recommendation Roles

## Phase 4 — Trust UX

- 추천 이유
- Trade-off
- Confirmed/Likely/Inferred/Unknown
- 조건 충돌

## Phase 5 — Refinement

- Quick Refinement
- 자연어 수정
- Relaxation Engine
- 재검색

## Phase 6 — Feedback

- 저장
- 추천 만족도
- 피드백 데이터 축적

---

# 25. MVP 완료 기준

다음 플로우가 실제 데이터로 끊기지 않고 동작하면 MVP 완료로 본다.

```text
앱 진입
↓
GPS 또는 지역 선택
↓
동행 + 인원 + 음식 + 예산 + 조건 설정
↓
자연어 추가
↓
GPT가 Must / Prefer / Avoid 구조화
↓
사용자 확인
↓
Kakao에서 실제 장소 검색
↓
Backend scoring
↓
GPT soft evaluation
↓
최종 3곳
↓
지도 + 추천 카드
↓
추천 이유 + Trade-off + 신뢰도
↓
길찾기 / 전화 / 카카오 상세
↓
조건 수정 및 재추천
```

---

# 26. 핵심 제품 차별점

경쟁 서비스와 가장 명확하게 구분해야 할 포인트는 다음 네 가지다.

### 1. Structured + Conversational

필터만도, 채팅만도 아니다.

> **조건 선택 + 자연어**

### 2. Must / Prefer / Avoid

사용자의 조건이 모두 같은 중요도가 아니라는 것을 AI가 이해한다.

### 3. Explain + Trade-off + Confidence

좋은 점만 보여주는 AI 추천이 아니다.

> 왜 추천했는지  
> 무엇이 부족한지  
> 그 정보가 얼마나 확실한지

를 함께 보여준다.

### 4. Constraint Negotiation

조건을 만족하는 장소가 없으면 끝나는 것이 아니라:

> 무엇을 가장 적게 양보하면 좋은 선택지가 생기는지

AI가 제안한다.

---

# 27. 한 줄 포지셔닝

> **맛집을 검색하는 대신, 오늘의 조건에 맞는 곳을 결정해주는 AI.**

또는

> **Best restaurant가 아니라, Best fit for today.**

---

# 28. 향후 확장

MVP 검증 후 다음 순서로 확장하는 것이 적절하다.

1. 장기 취향 학습 / Dining DNA
2. 상황별 취향 프로필
3. 그룹 링크 초대 및 조건 취합
4. 식당 이후 카페·바·산책 연결
5. 식당 → 다음 장소 도보 동선 최적화
6. 예약 데이터 연동
7. 웨이팅 데이터 연동
8. “그냥 정해줘” 1-click Decision

---

# 29. 개발 시 가장 먼저 검증할 기술 리스크

1. Kakao API로 확보 가능한 restaurant field 범위
2. 주차/가격/분위기/웨이팅 데이터의 실제 확보 가능성
3. GPT가 후보 리스트 밖의 장소를 생성하지 못하도록 하는 schema/prompt 구조
4. Kakao 검색 query 여러 개를 병합했을 때 중복 및 품질
5. GPT 호출 횟수 대비 응답 속도
6. 추천 적합도 점수와 사용자 체감의 상관관계
7. GPS 미허용 사용자 플로우
8. 검색 실패 시 Relaxation Engine 계산 비용

---

# 30. 최종 개발 원칙

> **Kakao는 사실을 찾고, GPT는 의도를 이해하며, 추천 점수는 앱이 계산한다.**

이 원칙이 깨지면 AI가 그럴듯한 장소 정보를 생성하거나 94% 같은 의미 없는 점수를 만들 가능성이 높아진다.

따라서:

```text
Kakao = Retrieval
GPT = Understanding + Reasoning + Explanation
Backend = Truth Rules + Filtering + Scoring
UI = Decision Support
```

로 역할을 명확히 분리한다.
