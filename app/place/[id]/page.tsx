"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { CONFIDENCE_LABEL } from "@/components/RecommendationCard";
import { loadClientSession, saveClientSession, toggleSaved } from "@/lib/client-store";
import { formatDistance, ROLE_COPY, type Recommendation, type SearchSession } from "@/lib/domain";

const RATINGS = [
  { id: "great", label: "딱 맞음" },
  { id: "ok", label: "괜찮음" },
  { id: "unsure", label: "애매함" },
  { id: "bad", label: "별로" },
] as const;

const REASONS = ["조용함", "거리", "주차", "가격", "분위기", "메뉴"];

export default function PlacePage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<SearchSession | null>(null);
  const [item, setItem] = useState<Recommendation | null>(null);
  const [saved, setSaved] = useState(false);
  const [rating, setRating] = useState<(typeof RATINGS)[number]["id"] | "">("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const current = loadClientSession();
    setSession(current);
    const found = current?.recommendations.find((recommendation) => recommendation.id === params.id) ?? null;
    setItem(found);
    if (!found) return;
    const raw = localStorage.getItem("mwo-saved");
    if (!raw) return;
    try {
      const places = JSON.parse(raw) as { kakaoId: string }[];
      setSaved(places.some((place) => place.kakaoId === found.place.kakaoId));
    } catch {
      setSaved(false);
    }
  }, [params.id]);

  async function sendFeedback() {
    if (!session || !item || !rating) return;
    const response = await fetch(`/api/recommendations/${item.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, rating, reasons }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "피드백을 저장하지 못했습니다.");
      return;
    }
    saveClientSession(data.session);
    setMessage("피드백을 남겼습니다.");
  }

  if (!item) {
    return (
      <>
        <Header back />
        <main className="page">
          <p>이 추천을 찾지 못했습니다.</p>
          <Link className="icon-btn" href="/results" aria-label="결과로">
            <Icon name="back" />
          </Link>
        </main>
      </>
    );
  }

  const directions = `https://map.kakao.com/link/to/${encodeURIComponent(item.place.name)},${item.place.lat},${item.place.lng}`;
  const bars = [
    ["거리", item.breakdown.location, 20],
    ["카테고리", item.breakdown.category, 20],
    ["선호", item.breakdown.prefer, 25],
    ["상황", item.breakdown.context, 20],
    ["신뢰도", item.breakdown.confidence, 15],
  ] as const;

  return (
    <>
      <Header back />
      <main className="page">
        <header className="hero">
          <p className="kicker">05 / Place</p>
          <p className="role">{ROLE_COPY[item.role].en}</p>
          <h1>{item.place.name}</h1>
          <p className="lede">
            {item.place.category || "음식점"} · {formatDistance(item.place.distance)} · 조건 {item.matchedCount}/{item.totalCount} 확인
          </p>
          <p className="meta">{item.place.roadAddress || item.place.address}</p>
        </header>
        <div className="note-block">
          <strong>추천 이유</strong>
          <p>{item.reason}</p>
        </div>
        <div className="note-block">
          <strong>아쉬운 점</strong>
          <p>{item.tradeoff}</p>
        </div>
        <section className="sheet" style={{ marginTop: "1.25rem" }}>
          <div className="sheet-body">
            <div className="mast">
              <div>
                <p className="kicker">적합도</p>
                <p className="meta">서버가 계산했습니다.</p>
              </div>
              <p className="mast-score">
                {item.score}
                <small>점</small>
              </p>
            </div>
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
          </div>
        </section>
        <section className="sheet">
          <div className="sheet-head">
            <p className="kicker">Evidence</p>
          </div>
          <div className="sheet-body">
            {item.evidence.map((evidence) => (
              <div className="rule" key={`${evidence.field}-${evidence.label}`}>
                <span className="rule-label">{evidence.label}</span>
                <span>
                  {CONFIDENCE_LABEL[evidence.confidence]}
                  <span className="meta"> · {evidence.source}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
        <div className="split-actions">
          <a className="icon-btn" href={directions} target="_blank" rel="noreferrer" aria-label="길찾기">
            <Icon name="route" />
          </a>
          {item.place.phone ? (
            <a className="icon-btn" href={`tel:${item.place.phone}`} aria-label="전화">
              <Icon name="phone" />
            </a>
          ) : (
            <span className="meta" style={{ display: "grid", placeItems: "center" }}>전화 미확인</span>
          )}
          {item.place.kakaoPlaceUrl ? (
            <a className="icon-btn" href={item.place.kakaoPlaceUrl} target="_blank" rel="noreferrer" aria-label="카카오맵">
              <Icon name="map" />
            </a>
          ) : null}
          <button
            className={saved ? "icon-btn is-on" : "icon-btn"}
            type="button"
            aria-label={saved ? "저장됨" : "저장"}
            onClick={() => setSaved(toggleSaved(item.place))}
          >
            <Icon name={saved ? "bookmark-fill" : "bookmark"} />
          </button>
        </div>
        <section className="sheet" style={{ marginTop: "1.5rem" }}>
          <div className="sheet-head">
            <p className="kicker">Feedback</p>
          </div>
          <div className="sheet-body">
            <div className="row">
              {RATINGS.map((choice) => (
                <button
                  className={rating === choice.id ? "choice is-on" : "choice"}
                  key={choice.id}
                  type="button"
                  onClick={() => setRating(choice.id)}
                >
                  {choice.label}
                </button>
              ))}
            </div>
            <div className="row" style={{ marginTop: "0.75rem" }}>
              {REASONS.map((reason) => (
                <button
                  className={reasons.includes(reason) ? "chip is-on" : "chip"}
                  key={reason}
                  type="button"
                  onClick={() =>
                    setReasons((current) =>
                      current.includes(reason) ? current.filter((entry) => entry !== reason) : [...current, reason],
                    )
                  }
                >
                  {reason}
                </button>
              ))}
            </div>
            <button className="btn" style={{ marginTop: "1rem" }} type="button" disabled={!rating} onClick={sendFeedback}>
              피드백 남기기
            </button>
            {message ? <p className="banner">{message}</p> : null}
          </div>
        </section>
      </main>
    </>
  );
}
