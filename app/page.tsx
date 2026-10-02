"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { MapCanvas } from "@/components/MapCanvas";
import { saveClientSession, saveDraft, loadDraft } from "@/lib/client-store";
import {
  BUDGETS,
  COMPANIONS,
  EMPTY_DRAFT,
  FOOD_CATEGORIES,
  RADII,
  type DiningDraft,
  type GeoLocation,
} from "@/lib/domain";

const SEONGSU_STATION: GeoLocation = {
  lat: 37.5445888153751,
  lng: 127.056066999327,
  label: "성수역",
};

export default function HomePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<DiningDraft>(EMPTY_DRAFT);
  const [region, setRegion] = useState("");
  const [error, setError] = useState("");
  const [geoNote, setGeoNote] = useState("");
  const [busy, setBusy] = useState<null | "region" | "submit">(null);
  const [mapCenter, setMapCenter] = useState<GeoLocation>(SEONGSU_STATION);

  useEffect(() => {
    const saved = loadDraft();
    const stillOldDefault =
      saved.partySize === 2 &&
      saved.budgetPerPerson == null &&
      saved.radius === 2000 &&
      saved.category === "상관없음";
    const next = stillOldDefault
      ? { ...saved, budgetPerPerson: 30000, radius: 1000, category: "한식" as const }
      : saved;
    setDraft(next);
    if (saved.location) {
      setMapCenter(saved.location);
      return;
    }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: "현재 위치",
        };
        setMapCenter(location);
        setDraft((current) => (current.location ? current : { ...current, location }));
      },
      () => setMapCenter(SEONGSU_STATION),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  function patch(partial: Partial<DiningDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function useCurrentLocation() {
    setGeoNote("");
    setError("");
    if (!navigator.geolocation) {
      setGeoNote("현재 위치 사용이 꺼져 있습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: "현재 위치",
        };
        setMapCenter(location);
        patch({ location });
      },
      () => setGeoNote("현재 위치 사용이 꺼져 있습니다."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  async function searchRegion() {
    setError("");
    const query = region.trim();
    if (!query) {
      const location = draft.location ?? mapCenter;
      setMapCenter(location);
      patch({ location });
      return;
    }
    setBusy("region");
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    setBusy(null);
    if (!response.ok) {
      setError(data.error ?? "장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setMapCenter(data.location);
    patch({ location: data.location });
  }

  async function submit() {
    setError("");
    if (!draft.location) {
      setError("위치를 먼저 정해주세요.");
      return;
    }
    if (!draft.companion) {
      setError("누구와 가는지 골라 주세요.");
      return;
    }
    if (draft.companion === "custom" && !draft.customCompanion.trim()) {
      setError("동행을 입력해 주세요.");
      return;
    }
    setBusy("submit");
    saveDraft(draft);
    const response = await fetch("/api/constraints/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await response.json();
    setBusy(null);
    if (!response.ok) {
      setError(data.error ?? "조건을 정리하지 못했습니다.");
      return;
    }
    saveClientSession(data.session);
    router.push("/review");
  }

  return (
    <>
      <Header />
      <main className="page wide home-split">
        <div className="home-form">
        {geoNote ? <p className="banner">{geoNote} 지역을 직접 입력해 주세요.</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <section className="block">
          <div className="block-head">
            <p className="sheet-title"><span className="num">1</span>위치가 어디인가요?</p>
          </div>
          <div className="origin">
            <div>
              <div className="origin-input">
                <button className="icon-btn" type="button" data-testid="use-location" aria-label="현재 위치" onClick={useCurrentLocation}>
                  <Icon name="locate" />
                </button>
                <input
                  data-testid="region-input"
                  value={region}
                  aria-label="출발 위치"
                  placeholder="성수, 강남역"
                  onChange={(event) => setRegion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchRegion();
                  }}
                />
                <button className="icon-btn" type="button" aria-label="검색" disabled={busy !== null} onClick={searchRegion}>
                  <Icon name="search" />
                </button>
              </div>
            </div>
            <img className="origin-character" src="/main.png" alt="" />
          </div>
        </section>

        <section className="block">
          <div className="block-head">
            <p className="sheet-title"><span className="num">2</span>누구와 가나요?</p>
          </div>
          <div className="tiles">
            {COMPANIONS.map((item) => (
              <button
                className={draft.companion === item.id ? "tile is-on" : "tile"}
                key={item.id}
                type="button"
                data-testid={`companion-${item.id}`}
                onClick={() => patch({ companion: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>
          {draft.companion === "custom" ? (
            <div className="sheet" style={{ marginTop: "0.75rem" }}>
              <div className="sheet-body">
                <label className="field">
                  <span>직접 입력</span>
                  <input
                    value={draft.customCompanion}
                    onChange={(event) => patch({ customCompanion: event.target.value })}
                  />
                </label>
              </div>
            </div>
          ) : null}
        </section>

        <section className="block">
          <div className="block-head">
            <p className="sheet-title"><span className="num">3</span>인원 및 핵심 조건</p>
          </div>
          <div className="sheet">
            <div className="sheet-body">
              <div className="mini-grid">
                <div className="mini">
                  <span>인원</span>
                  <div className="stepper">
                    <button type="button" aria-label="인원 줄이기" onClick={() => patch({ partySize: Math.max(1, draft.partySize - 1) })}>
                      -
                    </button>
                    <strong>{draft.partySize}명</strong>
                    <button type="button" aria-label="인원 늘리기" onClick={() => patch({ partySize: Math.min(12, draft.partySize + 1) })}>
                      +
                    </button>
                  </div>
                </div>
                <label className="mini">
                  <span>예산</span>
                  <select
                    className="mini-select"
                    aria-label="1인 예산"
                    value={draft.budgetPerPerson ?? ""}
                    onChange={(event) =>
                      patch({ budgetPerPerson: event.target.value ? Number(event.target.value) : null })
                    }
                  >
                    {BUDGETS.map((item) => (
                      <option key={item.label} value={item.value ?? ""}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mini">
                  <span>반경</span>
                  <select
                    className="mini-select"
                    aria-label="반경"
                    value={draft.radius}
                    onChange={(event) => patch({ radius: Number(event.target.value) })}
                  >
                    {RADII.map((item) => (
                      <option key={item} value={item}>
                        {item >= 1000 ? `${item / 1000}km` : `${item}m`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mini">
                  <span>음식</span>
                  <select className="mini-select" aria-label="음식" value={draft.category} onChange={(event) => patch({ category: event.target.value })}>
                    {FOOD_CATEGORIES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="pref-label">선호 태그</p>
              <div className="row">
                <button
                  className={draft.parking === "must" ? "chip is-on" : "chip"}
                  type="button"
                  onClick={() => patch({ parking: draft.parking === "must" ? "off" : "must" })}
                >
                  주차 필수
                </button>
                <button className={draft.quiet ? "chip is-on" : "chip"} type="button" onClick={() => patch({ quiet: !draft.quiet })}>
                  조용한 곳
                </button>
                <button
                  className={draft.reservation ? "chip is-on" : "chip"}
                  type="button"
                  onClick={() => patch({ reservation: !draft.reservation })}
                >
                  예약 선호
                </button>
                <button
                  className={draft.avoidWaiting ? "chip is-on" : "chip"}
                  type="button"
                  onClick={() => patch({ avoidWaiting: !draft.avoidWaiting })}
                >
                  긴 웨이팅은 피하기
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="block">
          <div className="block-head">
            <p className="sheet-title"><span className="num">4</span>더 원하는 조건이 있나요?</p>
          </div>
          <textarea
            className="naked note"
            data-testid="prompt"
            aria-label="더 원하는 조건"
            value={draft.prompt}
            placeholder="애인이랑 갈 거야. 차 가져가고 너무 시끄럽지 않았으면 좋겠어."
            onChange={(event) => patch({ prompt: event.target.value })}
          />
        </section>

        <div className="dock">
          <button className="btn" data-testid="find" type="button" disabled={busy !== null} onClick={submit}>
            {busy === "submit" ? "조건을 정리하는 중" : "오늘 갈 곳 3곳 고르기"}
          </button>
        </div>
        </div>
        <aside className="map-wrap home-map" aria-label="출발 위치 지도">
          <MapCanvas center={mapCenter} radius={draft.radius} />
        </aside>
      </main>
    </>
  );
}
