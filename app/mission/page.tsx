"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { RequireAuth } from "@/components/RequireAuth";
import { Calendar } from "@/components/Calendar";
import { Reveal, MaskReveal } from "@/components/Reveal";
import { todayISO, daysBetween, toISODate } from "@/lib/dates";
import { fetchMomentumLine } from "@/lib/ai";

export default function MissionPage() {
  return (
    <RequireAuth>
      <Mission />
    </RequireAuth>
  );
}

function Mission() {
  const { user } = db.useAuth();
  const router = useRouter();
  const q = db.useQuery(
    user
      ? {
          missions: { $: { where: { "user.id": user.id } }, entries: {} },
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

  useEffect(() => {
    if (!q.isLoading && user && !mission) router.replace("/onboarding");
  }, [q.isLoading, user, mission, router]);

  const entries = useMemo(
    () =>
      [...(mission?.entries ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [mission]
  );

  const today = todayISO();
  const rawDays = mission ? daysBetween(today, mission.dueDate) : 0;
  const fetching = useRef(false);
  const [momentumRetry, setMomentumRetry] = useState(0);

  useEffect(() => {
    if (!mission || entries.length === 0) return;
    if (mission.momentumLineDate === today) return;
    if (fetching.current) return;
    fetching.current = true;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const recent = [...entries]
      .reverse()
      .slice(0, 8)
      .map((e) => ({
        date: e.date,
        signal: e.signal,
        summary: e.summary,
      }));
    const lastRaw = entries[entries.length - 1]?.rawText ?? null;
    fetchMomentumLine({
      recent,
      missionDescription: mission.description,
      daysRemaining: Math.max(0, rawDays),
      lastRawText: lastRaw,
    })
      .then(({ momentumLine }) =>
        db.transact(
          db.tx.missions[mission.id].update({
            momentumLine,
            momentumLineDate: today,
          })
        )
      )
      .catch(() => {
        if (!cancelled) {
          retryTimer = setTimeout(() => setMomentumRetry((n) => n + 1), 10_000);
        }
      })
      .finally(() => {
        fetching.current = false;
      });
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission?.id, mission?.momentumLineDate, entries.length, today, momentumRetry]);

  if (q.isLoading || !user) {
    return (
      <div className="loading">
        <span className="mark" />
      </div>
    );
  }
  if (!mission) {
    return (
      <div className="loading">
        <span className="mark" />
      </div>
    );
  }

  const hasEntries = entries.length > 0;
  const createdAtISO = mission.createdAt
    ? toISODate(new Date(mission.createdAt))
    : today;
  const daysNum = rawDays < 0 ? Math.abs(rawDays) : rawDays;
  const isDeadlineToday = rawDays === 0;
  const daysText = isDeadlineToday
    ? "deadline today"
    : `${daysNum} ${daysNum === 1 ? "day" : "days"} ${
        rawDays > 0 ? "remaining" : "past deadline"
      }`;

  const momentumText = hasEntries
    ? mission.momentumLine || "Reading the last few days…"
    : "No reading yet.";

  return (
    <div className="shell">
      <main className="page mission-page">
        <section className="mission-hero fade-in">
          <h1 className="days-line">{daysText}</h1>
          <div className="reading-wrap">
            <p className="reading-label">Today&apos;s Reading</p>
            <MaskReveal key={momentumText} delay={0.22}>
              <p
                className={
                  mission.momentumLine && hasEntries
                    ? "todays-reading"
                    : "todays-reading placeholder"
                }
              >
                {momentumText}
              </p>
            </MaskReveal>
          </div>
        </section>

        <Reveal as="section" className="record-section" delay={0.05}>
          <div className="record-panel">
            <div className="record-title-wrap">
              <h2 className="record-title">The record</h2>
              <p className="record-count">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </p>
            </div>
            <Calendar
              key={mission.id}
              entries={entries}
              dueISO={mission.dueDate}
              createdAtISO={createdAtISO}
              onSelect={(iso) => router.push(`/entry/${iso}`)}
            />
          </div>
        </Reveal>
      </main>
    </div>
  );
}
