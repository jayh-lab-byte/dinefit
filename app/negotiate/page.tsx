"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { loadClientSession, saveClientSession } from "@/lib/client-store";
import type { SearchSession } from "@/lib/domain";

export default function NegotiatePage() {
  const router = useRouter();
  const [session, setSession] = useState<SearchSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const current = loadClientSession();
    if (!current) router.replace("/");
    else setSession(current);
  }, [router]);

  async function choose(change: "radius" | "category") {
    if (!session) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/search-session/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "relax", change }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok || !data.ok) {
      setError(data.error ?? "장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    saveClientSession(data.session);
    if (data.destination === "results") {
      router.push("/results");
      return;
    }
    setSession(data.session);
  }

  if (!session) return null;

  return (
    <>
      <Header back />
      <main className="page">
        <header className="hero">
          <p className="kicker">06 / Negotiate</p>
          <h1>한 가지만 바꾸면 선택지가 생깁니다.</h1>
          <p className="lede">조건을 모두 만족하는 곳이 없어요.</p>
        </header>
        {error ? <p className="error">{error}</p> : null}
        {session.relaxation.length === 0 ? (
          <p className="banner">
            반경을 넓히거나 음식 조건을 풀어도, 지금 데이터로는 후보가 늘지 않습니다. 지역을 바꿔
            주세요.
          </p>
        ) : (
          <div>
            {session.relaxation.map((option) => (
              <button
                className="option"
                key={option.id}
                type="button"
                disabled={busy}
                data-testid={`relax-${option.change}`}
                onClick={() => choose(option.change)}
              >
                <span>{option.label}</span>
                <em>후보 {option.candidateCount}곳</em>
              </button>
            ))}
          </div>
        )}
        <div className="dock">
          <button className="btn" type="button" onClick={() => router.push("/")}>
            조건으로 돌아가기
          </button>
        </div>
      </main>
    </>
  );
}
