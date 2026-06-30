"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal } from "@/components/Reveal";
import { Disclosure } from "@/components/Disclosure";
import { todayISO, formatLongDate } from "@/lib/dates";
import { analyzeEntry } from "@/lib/ai";

export default function EntryPage() {
  return (
    <RequireAuth>
      <EntryInner />
    </RequireAuth>
  );
}

type Phase = "compose" | "working" | "result";

function EntryInner() {
  const { user } = db.useAuth();
  const router = useRouter();
  const params = useParams<{ date: string }>();
  const date = params?.date ?? "";

  const q = db.useQuery(
    user
      ? {
          missions: {
            $: { where: { "user.id": user.id } },
            entries: { $: { where: { date } } },
          },
        }
      : null
  );

  const missions = useMemo(
    () =>
      [...(q.data?.missions ?? [])].sort(
        (a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0)
      ),
    [q.data]
  );
  const mission = missions[0];
  const entry = mission?.entries?.[0] ?? null;

  const [phase, setPhase] = useState<Phase>("compose");
  const [draft, setDraft] = useState("");
  const [ai, setAi] = useState<{ signal: string; summary: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = todayISO();
  const isFuture = date > today;

  useEffect(() => {
    if (isFuture) router.replace("/mission");
  }, [isFuture, router]);

  useEffect(() => {
    if (!q.isLoading && user && !mission) router.replace("/onboarding");
  }, [q.isLoading, user, mission, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !mission || !user || phase !== "compose") return;
    setPhase("working");
    setError(null);

    const entryId = id();
    try {
      await db.transact([
        db.tx.entries[entryId]
          .update({
            date,
            rawText: text,
            createdAt: Date.now(),
          })
          .link({ mission: mission.id, user: user.id }),
        db.tx.missions[mission.id].update({ momentumLineDate: null }),
      ]);
    } catch (err: unknown) {
      setError(extractError(err) || "Could not save the entry.");
      setPhase("compose");
      return;
    }

    const recentSignals = [...(mission.entries ?? [])]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((e) => e.signal)
      .filter(Boolean) as string[];

    try {
      const res = await analyzeEntry({
        entryText: text,
        missionTitle: mission.title,
        missionDescription: mission.description,
        recentSignals,
      });
      await db.transact([
        db.tx.entries[entryId].update({
          signal: res.signal,
          summary: res.summary,
        }),
      ]);
      setAi(res);
    } catch {
      setAi(null);
      setError("Your entry is saved. The signal couldn't be written just now.");
    }
    setPhase("result");
  }

  if (isFuture || q.isLoading || !user || !mission) {
    return (
      <div className="loading">
        <span className="mark" />
      </div>
    );
  }

  const isToday = date === today;
  const rawText = entry?.rawText ?? draft;
  const shown = ai ?? (entry ? { signal: entry.signal, summary: entry.summary } : null);

  return (
    <div className="shell">
      <main className="page">
        <Reveal as="section" className="section">
          <div className="marg">
            <span>Entry</span>
            <span className="marg-meta">{formatLongDate(date)}</span>
          </div>
          <div className="body">
            {!(phase === "compose" && !entry) && (
              <div style={{ marginBottom: 24 }}>
                <Link href="/mission" className="ghost-btn">
                  ← Back to the mission
                </Link>
              </div>
            )}

            {phase === "working" ? (
              <div className="detail">
                <div className="analyzing">
                  <div className="a-line" />
                  <div className="a-line" />
                  <div className="a-line" />
                </div>
                <p className="faint">Reading your entry…</p>
              </div>
            ) : phase === "compose" && !entry ? (
              <form className="entry" onSubmit={submit}>
                <textarea
                  className="write-area"
                  placeholder="What happened today?"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                />
                <div className="write-foot">
                  <span className="write-count">
                    {draft.trim() ? `${draft.trim().length} characters` : ""}
                  </span>
                  <div className="write-actions">
                    <Link href="/mission" className="ghost-btn">
                      ← Back to the mission
                    </Link>
                    <button className="btn" disabled={!draft.trim()}>
                      {isToday ? "Record today" : "Record this day"}
                    </button>
                  </div>
                </div>
                {error && <p className="err">{error}</p>}
              </form>
            ) : (
              <article className="detail">
                {shown?.signal ? (
                  <>
                    <h1 className="signal">{shown.signal}</h1>
                    <p className="summary">{shown.summary}</p>
                  </>
                ) : (
                  <p className="err">
                    {error || "The signal for this day has not been written yet."}
                  </p>
                )}
                <Disclosure label="Read the raw entry">
                  <div style={{ whiteSpace: "pre-wrap" }}>{rawText}</div>
                </Disclosure>
              </article>
            )}
          </div>
        </Reveal>
      </main>
    </div>
  );
}

function extractError(err: unknown): string {
  const any = err as { body?: { message?: string }; message?: string };
  return any?.body?.message || any?.message || "";
}
