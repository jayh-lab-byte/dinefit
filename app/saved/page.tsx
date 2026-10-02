"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { loadSaved, toggleSaved } from "@/lib/client-store";
import { formatDistance, type Place } from "@/lib/domain";

export default function SavedPage() {
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    setPlaces(loadSaved());
  }, []);

  return (
    <>
      <Header back />
      <main className="page">
        <header className="hero">
          <p className="kicker">07 / Saved</p>
          <h1>보관한 곳</h1>
          <p className="lede">{places.length === 0 ? "아직 저장한 식당이 없습니다." : `${places.length}곳`}</p>
        </header>
        <div className="place-list">
          {places.map((place, index) => (
            <article className="saved-row" key={place.kakaoId}>
              <span className="num">{index + 1}</span>
              <span>
                <strong>{place.name}</strong>
                <span className="meta">
                  {place.category} · {place.roadAddress || place.address}
                </span>
              </span>
              <span>
                <em>{formatDistance(place.distance)}</em>
                <span className="row" style={{ justifyContent: "flex-end", marginTop: "0.25rem" }}>
                  {place.kakaoPlaceUrl ? (
                    <a className="icon-btn" href={place.kakaoPlaceUrl} target="_blank" rel="noreferrer" aria-label="지도">
                      <Icon name="map" />
                    </a>
                  ) : null}
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label="빼기"
                    onClick={() => {
                      toggleSaved(place);
                      setPlaces(loadSaved());
                    }}
                  >
                    <Icon name="trash" />
                  </button>
                </span>
              </span>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
