"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { loadClientSession, saveClientSession } from "@/lib/client-store";
import { syncSessionFields } from "@/lib/constraints";
import { formatRadius, type Constraint, type Priority, type SearchSession } from "@/lib/domain";

const BUCKET: Record<Priority, "must" | "prefer" | "avoid"> = {
  MUST: "must",
  PREFER: "prefer",
  AVOID: "avoid",
};

const TITLE: Record<Priority, string> = {
  MUST: "Must",
  PREFER: "Prefer",
  AVOID: "Avoid",
};

export default function ReviewPage() {
  const router = useRouter();
  const [session, setSession] = useState<SearchSession | null>(null);
  const [added, setAdded] = useState("");

  useEffect(() => {
    const current = loadClientSession();
    if (!current) router.replace("/");
    else setSession(current);
  }, [router]);

  function update(next: SearchSession) {
    setSession(next);
    saveClientSession(next);
  }

  function remove(item: Constraint) {
    if (!session) return;
    const key = BUCKET[item.priority];
    update({
      ...session,
      constraints: {
        ...session.constraints,
        [key]: session.constraints[key].filter((current) => current.id !== item.id),
      },
    });
  }

  function move(item: Constraint, priority: Priority) {
    if (!session || item.priority === priority) return;
    const from = BUCKET[item.priority];
    const to = BUCKET[priority];
    const nextItem = { ...item, priority, id: `${priority}:${item.type}:${String(item.value)}` };
    update({
      ...session,
      constraints: {
        ...session.constraints,
        [from]: session.constraints[from].filter((current) => current.id !== item.id),
        [to]: [...session.constraints[to], nextItem],
      },
    });
  }

  function addCondition() {
    if (!session) return;
    const label = added.trim();
    if (!label) return;
    update({
      ...session,
      constraints: {
        ...session.constraints,
        prefer: [
          ...session.constraints.prefer,
          {
            id: `PREFER:other:${label}`,
            type: "other",
            value: label,
            priority: "PREFER",
            source: "UI",
            label,
          },
        ],
      },
    });
    setAdded("");
  }

  if (!session) return null;

  return (
    <>
      <Header back />
      <main className="page">
        <header className="hero">
          <p className="kicker">02 / Review</p>
          <h1>이렇게 찾을게요.</h1>
          <p className="lede">
            {session.location.label} · 반경 {formatRadius(session.radius)}
          </p>
        </header>
        {session.notice ? <p className="banner">{session.notice}</p> : null}
        {(["MUST", "PREFER", "AVOID"] as Priority[]).map((priority) => (
          <section className="sheet" key={priority} data-testid={`group-${priority}`}>
            <div className="sheet-head">
              <p className="kicker">{TITLE[priority]}</p>
              <span className="score">{session.constraints[BUCKET[priority]].length}</span>
            </div>
            <div className="sheet-body">
              {session.constraints[BUCKET[priority]].length === 0 ? <p className="meta">없음</p> : null}
              {session.constraints[BUCKET[priority]].map((item) => (
                <div className="rule loose" key={item.id}>
                  <span className="rule-label">{item.label}</span>
                  <div className="row">
                    <select
                      className="plain"
                      value={item.priority}
                      aria-label={`${item.label} 우선순위`}
                      onChange={(event) => move(item, event.target.value as Priority)}
                    >
                      <option value="MUST">필수</option>
                      <option value="PREFER">선호</option>
                      <option value="AVOID">회피</option>
                    </select>
                    <button className="icon-btn" type="button" aria-label={`${item.label} 빼기`} onClick={() => remove(item)}>
                      <Icon name="close" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        <section className="sheet">
          <div className="sheet-head">
            <p className="kicker">Add</p>
          </div>
          <div className="sheet-body">
            <label className="field">
              <span>선호로 추가</span>
              <input value={added} onChange={(event) => setAdded(event.target.value)} />
            </label>
            <button className="btn-line" style={{ marginTop: "1rem" }} type="button" onClick={addCondition}>
              추가
            </button>
          </div>
        </section>
        <div className="dock">
          <div className="actions">
            <button
              className="btn"
              data-testid="start-recommend"
              type="button"
              onClick={() => {
                saveClientSession(syncSessionFields(session));
                router.push("/searching");
              }}
            >
              추천 시작
            </button>
            <Link className="btn-line" href="/">
              조건 수정
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
