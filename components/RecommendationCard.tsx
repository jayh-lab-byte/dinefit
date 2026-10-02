"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { toggleSaved } from "@/lib/client-store";
import { formatDistance, formatWon, ROLE_COPY, type Recommendation } from "@/lib/domain";

const CONFIDENCE_LABEL = {
  CONFIRMED: "확인됨",
  LIKELY: "가능성 높음",
  INFERRED: "추정",
  UNKNOWN: "미확인",
} as const;

export function RecommendationCard({
  item,
  index,
  selected,
  budgetPerPerson,
  onSelect,
}: {
  item: Recommendation;
  index: number;
  selected?: boolean;
  budgetPerPerson?: number;
  onSelect?: () => void;
}) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem("mwo-saved");
    if (!raw) return;
    try {
      const places = JSON.parse(raw) as { kakaoId: string }[];
      setSaved(places.some((place) => place.kakaoId === item.place.kakaoId));
    } catch {
      setSaved(false);
    }
  }, [item.place.kakaoId]);

  const directions = `https://map.kakao.com/link/to/${encodeURIComponent(item.place.name)},${item.place.lat},${item.place.lng}`;
  const seen = new Set<string>();
  const listed = item.evidence.filter((evidence) => {
    if (evidence.field === "phone" || evidence.field === "address" || evidence.field === "radius") return false;
    if (seen.has(evidence.field)) return false;
    seen.add(evidence.field);
    return true;
  });
  const checks = listed.filter((evidence) => evidence.confidence === "CONFIRMED" || evidence.confidence === "LIKELY");
  const warns = listed.filter((evidence) => evidence.confidence === "UNKNOWN" || evidence.confidence === "INFERRED");
  const bars = [
    ["거리", item.breakdown.location, 20],
    ["카테고리", item.breakdown.category, 20],
    ["선호", item.breakdown.prefer, 25],
    ["상황", item.breakdown.context, 20],
    ["신뢰도", item.breakdown.confidence, 15],
  ] as const;

  return (
    <article className={selected ? "card is-on" : "card"} data-testid={`card-${item.role}`} onClick={onSelect}>
      <div className="card-head">
        <span className="card-id">
          <span className="num">{index + 1}</span>
          <span className="role">{ROLE_COPY[item.role].en}</span>
        </span>
        <span className="score">적합도 {item.score}</span>
      </div>
      <div className="card-body">
        <p className="meta">{item.place.category || "음식점"} · {formatDistance(item.place.distance)}</p>
        <h3>{item.place.name}</h3>
        <p className="meta">{item.place.roadAddress || item.place.address}</p>
        <p className="meta">{ROLE_COPY[item.role].ko}</p>
        {budgetPerPerson ? (
          <p className="fine">
            요청한 예산 {formatWon(budgetPerPerson)}. 실제 메뉴 가격은 확인되지 않았어요.
          </p>
        ) : (
          <p className="fine">메뉴 가격은 확인되지 않았어요.</p>
        )}
        <div className="note-block">
          <strong>추천 이유</strong>
          <p>{item.reason}</p>
        </div>
        <div className="note-block">
          <strong>아쉬운 점</strong>
          <p>{item.tradeoff}</p>
        </div>
        <ul className="check-list">
          {checks.map((evidence) => (
            <li className="ok" key={`${evidence.field}-${evidence.label}`}>
              {evidence.label} {evidence.value}
            </li>
          ))}
          {warns.map((evidence) => (
            <li className="warn" key={`${evidence.field}-${evidence.label}`}>
              {evidence.label} {evidence.confidence === "INFERRED" ? "추정" : "확인 필요"}
            </li>
          ))}
        </ul>
        <details className="score-fold" onClick={(event) => event.stopPropagation()}>
          <summary>점수 근거와 확인할 점</summary>
          {bars.map(([label, value, max]) => (
            <div className="bar" key={label}>
              <span>{label}</span>
              <i>
                <b style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
              </i>
              <span>
                {value}/{max}
              </span>
            </div>
          ))}
          <p className="fine">점수는 서버가 계산했습니다. 추정과 미확인은 사실로 쓰지 않습니다.</p>
        </details>
        <div className="card-actions">
          <Link className="icon-btn" href={`/place/${item.id}`} aria-label="상세" onClick={(event) => event.stopPropagation()}>
            <Icon name="detail" />
          </Link>
          <a className="icon-btn" href={directions} target="_blank" rel="noreferrer" aria-label="길찾기" onClick={(event) => event.stopPropagation()}>
            <Icon name="route" />
          </a>
          {item.place.phone ? (
            <a className="icon-btn" href={`tel:${item.place.phone}`} aria-label="전화" onClick={(event) => event.stopPropagation()}>
              <Icon name="phone" />
            </a>
          ) : null}
          {item.place.kakaoPlaceUrl ? (
            <a className="icon-btn" href={item.place.kakaoPlaceUrl} target="_blank" rel="noreferrer" aria-label="카카오맵" onClick={(event) => event.stopPropagation()}>
              <Icon name="map" />
            </a>
          ) : null}
          <button
            className={saved ? "icon-btn is-on" : "icon-btn"}
            type="button"
            aria-label={saved ? "저장됨" : "저장"}
            onClick={(event) => {
              event.stopPropagation();
              setSaved(toggleSaved(item.place));
            }}
          >
            <Icon name={saved ? "bookmark-fill" : "bookmark"} />
          </button>
        </div>
      </div>
    </article>
  );
}

export { CONFIDENCE_LABEL };
