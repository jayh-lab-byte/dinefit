"use client";

import { useEffect, useRef } from "react";
import type { Place } from "@/lib/domain";
import { formatDistance, formatRadius } from "@/lib/domain";

type Marker = { id: string; place: Place; label: string };

type KakaoLatLng = { getLat: () => number; getLng: () => number };
type KakaoMap = { getCenter: () => KakaoLatLng };

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: object) => KakaoMap;
        LatLng: new (lat: number, lng: number) => object;
        Circle: new (options: object) => { setMap: (map: KakaoMap) => void };
        CustomOverlay: new (options: object) => { setMap: (map: KakaoMap) => void };
        event: {
          addListener: (target: object, type: string, handler: () => void) => void;
        };
      };
    };
  }
}

const EMPTY_MARKERS: Marker[] = [];

function mapLevel(radius: number) {
  if (radius <= 500) return 4;
  if (radius <= 1000) return 5;
  if (radius <= 2000) return 6;
  if (radius <= 4000) return 7;
  return 8;
}

function movedFar(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a)) > 200;
}

export function MapCanvas({
  center,
  radius,
  markers,
  selectedId,
  onSelect,
  onShift,
}: {
  center: { lat: number; lng: number; label: string };
  radius: number;
  markers?: Marker[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onShift?: (next: { lat: number; lng: number }) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const pins = markers ?? EMPTY_MARKERS;
  const onSelectRef = useRef(onSelect);
  const onShiftRef = useRef(onShift);
  onSelectRef.current = onSelect;
  onShiftRef.current = onShift;
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

  useEffect(() => {
    if (!key || !holder.current) return;
    let cancelled = false;
    const container = holder.current;

    const draw = () => {
      if (cancelled || !window.kakao) return;
      const maps = window.kakao.maps;
      const kakaoCenter = new maps.LatLng(center.lat, center.lng);
      const map = new maps.Map(container, { center: kakaoCenter, level: mapLevel(radius) });
      new maps.Circle({
        center: kakaoCenter,
        radius,
        strokeWeight: 1,
        strokeColor: "#111111",
        strokeOpacity: 1,
        fillColor: "#111111",
        fillOpacity: 0.04,
      }).setMap(map);
      pins.forEach((marker, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = marker.id === selectedId ? "pin is-on" : "pin";
        button.textContent = String(index + 1);
        button.addEventListener("click", () => onSelectRef.current?.(marker.id));
        new maps.CustomOverlay({
          position: new maps.LatLng(marker.place.lat, marker.place.lng),
          content: button,
          yAnchor: 1,
          xAnchor: 0.5,
        }).setMap(map);
      });
      if (onShiftRef.current) {
        maps.event.addListener(map, "dragend", () => {
          const next = map.getCenter();
          const shifted = { lat: next.getLat(), lng: next.getLng() };
          if (movedFar(center, shifted)) onShiftRef.current?.(shifted);
        });
      }
    };

    if (window.kakao?.maps) {
      window.kakao.maps.load(draw);
      return () => {
        cancelled = true;
      };
    }
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao?.maps.load(draw);
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [center, key, pins, radius, selectedId]);

  if (!key) {
    return (
      <div className="map-fallback" data-testid="map-fallback">
        <p className="kicker">Map</p>
        <p className="sheet-title" style={{ marginTop: "0.6rem" }}>
          {center.label}
        </p>
        <p className="meta">반경 {formatRadius(radius)} · 카카오맵 키를 넣으면 이 영역에 지도가 표시됩니다.</p>
        <div className="place-list">
          {pins.map((marker, index) => (
            <button
              className={marker.id === selectedId ? "place-row is-on" : "place-row"}
              key={marker.id}
              type="button"
              onClick={() => onSelect(marker.id)}
            >
              <span className="num">{index + 1}</span>
              <span>
                <strong>{marker.place.name}</strong>
                <span className="meta">{marker.place.category}</span>
              </span>
              <em>{formatDistance(marker.place.distance)}</em>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return <div className="map-canvas" data-testid="kakao-map" ref={holder} />;
}
