"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CompareModal } from "@/components/CompareModal";
import { Header } from "@/components/Header";
import { MapCanvas } from "@/components/MapCanvas";
import { RecommendationCard } from "@/components/RecommendationCard";
import { loadClientSession, saveClientSession } from "@/lib/client-store";
import { formatRadius, type SearchSession } from "@/lib/domain";

const QUICK = [
  { kind: "closer", label: "더 가까운 곳" },
  { kind: "cheaper", label: "더 저렴하게" },
  { kind: "quieter", label: "더 조용하게" },
  { kind: "other_food", label: "다른 음식" },
  { kind: "other_mood", label: "다른 분위기" },
] as const;

export default function ResultsPage() {
  const router = useRouter();
  const [session, setSession] = useState<SearchSession | null>(null);
  const [selectedId, setSelectedId] = useState<string>();
  const [shift, setShift] = useState<{ lat: number; lng: number } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [compare, setCompare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const current = loadClientSession();
    if (!current) {
      router.replace("/");
      return;
    }
    if (current.recommendations.length === 0) {
      router.replace(current.relaxation.length > 0 ? "/negotiate" : "/");
      return;
    }
    setSession(current);
    setSelectedId(current.recommendations[0]?.id);
  }, [router]);

  async function rerun(body: object) {
    if (!session) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/search-session/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok || !data.ok) {
      setError(data.error ?? "장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    saveClientSession(data.session);
    if (data.destination === "negotiate") {
      router.push("/negotiate");
      return;
    }
    setSession(data.session);
    setSelectedId(data.session.recommendations[0]?.id);
    setShift(null);
    setPrompt("");
  }

  if (!session) return null;

  return (
    <>
      <Header back />
      <main className="page wide">
        <header className="hero">
          <p className="kicker">04 / Decision</p>
          <h1>오늘의 3곳</h1>
          <p className="lede">
            {session.location.label} · 반경 {formatRadius(session.radius)} · 적합도는 서버가 계산했습니다.
          </p>
          {typeof session.searchedCount === "number" && typeof session.passedCount === "number" ? (
            <p className="meta">
              실제 장소 {session.searchedCount}곳 중 조건 통과 {session.passedCount}곳에서 골랐어요.
            </p>
          ) : null}
          <p className="fine">Kakao 장소 데이터</p>
        </header>
        {session.notice ? <p className="banner">{session.notice}</p> : null}
        {error ? <p className="error">{error}</p> : null}
        <div className="results-layout">
          <div className="map-wrap">
            <MapCanvas
              center={session.location}
              radius={session.radius}
              selectedId={selectedId}
              markers={session.recommendations.map((item, index) => ({
                id: item.id,
                place: item.place,
                label: String(index + 1),
              }))}
              onSelect={setSelectedId}
              onShift={setShift}
            />
            {shift ? (
              <button
                className="btn map-search"
                type="button"
                disabled={busy}
                onClick={() =>
                  rerun({ op: "move", lat: shift.lat, lng: shift.lng, label: "지도에서 고른 위치" })
                }
              >
                이 지역에서 다시 찾기
              </button>
            ) : null}
          </div>
          <div>
            <button className="compare-open" type="button" data-testid="compare-open" onClick={() => setCompare(true)}>
              {session.recommendations.length}곳 한눈에 비교하기
            </button>
            {session.recommendations.map((item, index) => (
              <RecommendationCard
                key={item.id}
                item={item}
                index={index}
                selected={item.id === selectedId}
                budgetPerPerson={session.budgetPerPerson}
                onSelect={() => setSelectedId(item.id)}
              />
            ))}
            <section className="sheet">
              <div className="sheet-head">
                <p className="kicker">Refine</p>
              </div>
              <div className="sheet-body">
                <div className="row">
                  {QUICK.map((item) => (
                    <button
                      className="chip"
                      key={item.kind}
                      type="button"
                      disabled={busy}
                      onClick={() => rerun({ op: "quick", kind: item.kind })}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button className="chip" type="button" onClick={() => router.push("/review")}>
                    조건 수정
                  </button>
                </div>
                <label className="field" style={{ marginTop: "1rem" }}>
                  <span>한 줄로 바꾸기</span>
                  <input
                    value={prompt}
                    placeholder="이 셋보다 조금 더 캐주얼한 곳으로"
                    onChange={(event) => setPrompt(event.target.value)}
                  />
                </label>
                <button
                  className="btn"
                  style={{ marginTop: "1rem" }}
                  type="button"
                  disabled={busy || !prompt.trim()}
                  onClick={() => rerun({ op: "prompt", prompt: prompt.trim() })}
                >
                  {busy ? "다시 찾는 중" : "이 말로 다시 찾기"}
                </button>
              </div>
            </section>
          </div>
        </div>
        {compare ? (
          <CompareModal
            items={session.recommendations}
            budgetPerPerson={session.budgetPerPerson}
            partySize={session.partySize}
            onClose={() => setCompare(false)}
          />
        ) : null}
      </main>
    </>
  );
}
