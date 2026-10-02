"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { loadClientSession, saveClientSession } from "@/lib/client-store";
import { syncSessionFields } from "@/lib/constraints";

const STEPS = ["요청 이해 중", "실제 장소 찾는 중", "조건 비교 중", "3곳으로 좁히는 중"];

export default function SearchingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const current = loadClientSession();
    if (!current) {
      router.replace("/");
      return;
    }
    const session = syncSessionFields(current);
    const timer = window.setInterval(() => {
      setStep((value) => Math.min(value + 1, 2));
    }, 700);
    let cancelled = false;

    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id,
        location: session.location,
        radius: session.radius,
        companion: session.companion,
        partySize: session.partySize,
        category: session.category,
        budgetPerPerson: session.budgetPerPerson,
        prompt: session.prompt,
        constraints: session.constraints,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok || !data.ok) {
          setError(data.error ?? "장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
          return;
        }
        saveClientSession(data.session);
        setStep(3);
        router.replace(data.destination === "negotiate" ? "/negotiate" : "/results");
      })
      .catch(() => {
        if (!cancelled) setError("장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      });

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [router]);

  return (
    <>
      <Header back />
      <main className="page">
        <header className="hero">
          <p className="kicker">03 / Searching</p>
          <h1>오늘 조건을 좁히는 중</h1>
        </header>
        {error ? (
          <>
            <p className="error" data-testid="search-error">
              {error}
            </p>
            <button className="btn" type="button" onClick={() => router.push("/")}>
              처음으로
            </button>
          </>
        ) : (
          <ol className="steps">
            {STEPS.map((label, index) => (
              <li className={index <= step ? "is-on" : ""} key={label}>
                <span className="num">{index + 1}</span>
                <strong>{label}</strong>
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}
