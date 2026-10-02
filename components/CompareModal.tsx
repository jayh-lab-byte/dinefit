"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { formatDistance, formatWon, type Evidence, type Recommendation } from "@/lib/domain";

const SKIP = new Set(["distance", "category", "phone", "address", "radius", "budget", "partySize"]);

function cellText(evidence?: Evidence) {
  if (!evidence) return "확인되지 않음";
  if (evidence.confidence === "CONFIRMED" || evidence.confidence === "LIKELY") return evidence.value;
  if (evidence.confidence === "INFERRED") return `추정 · ${evidence.value}`;
  return "확인 필요";
}

function josa(text: string, withBatchim: string, withoutBatchim: string) {
  const code = text.charCodeAt(text.length - 1);
  const batchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return `${text}${batchim ? withBatchim : withoutBatchim}`;
}

function compareSummary(items: Recommendation[]) {
  const ranked = [...items].sort((a, b) => b.score - a.score || (a.place.distance ?? 99999) - (b.place.distance ?? 99999));
  const top = ranked[0];
  const closest = [...items].sort((a, b) => (a.place.distance ?? 99999) - (b.place.distance ?? 99999))[0];
  const unknown = new Set<string>();
  for (const item of items) {
    for (const evidence of item.evidence) {
      if (evidence.confidence === "UNKNOWN" && !SKIP.has(evidence.field)) unknown.add(evidence.label);
    }
  }
  const lines = [`${josa(top.place.name, "이", "가")} 조건 점수 ${top.score}점으로 가장 높습니다.`];
  if (closest && closest.id !== top.id && closest.place.distance != null) {
    lines.push(`${josa(closest.place.name, "이", "가")} ${formatDistance(closest.place.distance)}로 가장 가깝습니다.`);
  }
  if (unknown.size > 0) {
    lines.push(`${josa([...unknown].slice(0, 4).join(", "), "은", "는")} 카카오 데이터로 확인되지 않았습니다.`);
  }
  lines.push("메뉴 가격과 영업시간은 확인되지 않았으니, 방문 전 카카오맵에서 확인해 주세요.");
  return lines.join(" ");
}

export function CompareModal({
  items,
  budgetPerPerson,
  partySize,
  onClose,
}: {
  items: Recommendation[];
  budgetPerPerson?: number;
  partySize?: number;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const extraLabels = [...new Set(items.flatMap((item) => item.evidence.filter((entry) => !SKIP.has(entry.field)).map((entry) => entry.label)))];
  const ceiling = budgetPerPerson && partySize ? budgetPerPerson * partySize : undefined;

  return createPortal(
    <div className="modal-back" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        data-testid="compare-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="compare-title">후보 {items.length}곳 한눈에 비교</h2>
          <button className="icon-btn" type="button" aria-label="닫기" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="compare-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th />
                {items.map((item, index) => (
                  <th key={item.id}>
                    {index + 1}. {item.place.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>거리</th>
                {items.map((item) => (
                  <td key={item.id}>{formatDistance(item.place.distance)}</td>
                ))}
              </tr>
              <tr>
                <th>카테고리</th>
                {items.map((item) => (
                  <td key={item.id}>{item.place.category || "확인되지 않음"}</td>
                ))}
              </tr>
              <tr>
                <th>조건 점수</th>
                {items.map((item) => (
                  <td key={item.id}>
                    <strong>{item.score}점</strong>
                    <span className="fine">서버 점수</span>
                  </td>
                ))}
              </tr>
              <tr>
                <th>전화번호</th>
                {items.map((item) => (
                  <td key={item.id}>{item.place.phone || "확인되지 않음"}</td>
                ))}
              </tr>
              {budgetPerPerson ? (
                <tr>
                  <th>요청한 1인 예산</th>
                  {items.map((item) => (
                    <td key={item.id}>
                      {formatWon(budgetPerPerson)}
                      <span className="fine">메뉴 가격은 확인되지 않음</span>
                    </td>
                  ))}
                </tr>
              ) : null}
              {ceiling ? (
                <tr>
                  <th>{partySize}명 요청 상한</th>
                  {items.map((item) => (
                    <td key={item.id}>
                      {ceiling.toLocaleString("ko-KR")}원
                      <span className="fine">요청 조건 · 실제 가격 아님</span>
                    </td>
                  ))}
                </tr>
              ) : null}
              {extraLabels.map((label) => (
                <tr key={label}>
                  <th>{label}</th>
                  {items.map((item) => {
                    const evidence = item.evidence.find((entry) => entry.label === label);
                    return (
                      <td key={item.id} className={evidence?.confidence === "CONFIRMED" ? undefined : "is-muted"}>
                        {cellText(evidence)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <th>메뉴 가격</th>
                {items.map((item) => (
                  <td key={item.id} className="is-muted">
                    확인되지 않음
                  </td>
                ))}
              </tr>
              <tr>
                <th>영업시간</th>
                {items.map((item) => (
                  <td key={item.id} className="is-muted">
                    확인되지 않음
                  </td>
                ))}
              </tr>
              <tr>
                <th>추천 이유</th>
                {items.map((item) => (
                  <td key={item.id}>{item.reason}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="compare-summary">
          <strong>비교 요약</strong>
          <p>{compareSummary(items)}</p>
        </div>
        <p className="fine">
          거리는 카카오 검색 기준입니다. 확인 필요·추정은 카카오 데이터로 확정할 수 없습니다. 방문 전 카카오맵에서 확인해 주세요.
        </p>
      </div>
    </div>,
    document.body,
  );
}
