"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { RequireAuth } from "@/components/RequireAuth";
import { Header } from "@/components/Header";
import { Calendar } from "@/components/Calendar";
import { Reveal, MaskReveal } from "@/components/Reveal";
import { Disclosure } from "@/components/Disclosure";
import { todayISO, daysBetween, toISODate, formatLongDate } from "@/lib/dates";
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

  useEffect(() => {
    if (!mission || entries.length === 0) return;
    if (mission.momentumLineDate === today) return;
    if (fetching.current) return;
    fetching.current = true;
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
      .catch(() => {})
      .finally(() => {
        fetching.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission?.id, mission?.momentumLineDate, entries.length, today]);

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
  const daysLabel = isDeadlineToday
    ? "the deadline is today"
    : rawDays > 0
    ? "days until the deadline"
    : "days past the deadline";

  const momentumText = hasEntries
    ? mission.momentumLine || "Reading the last few days…"
    : "The archive begins with one entry.";

  return (
    <div className="shell">
      <Header />
      <main className="page">
        <section className="section">
          <div className="marg fade-in">
            <span>Today</span>
            <span className="marg-meta">{formatLongDate(today)}</span>
          </div>
          <div className="body">
            <div className="days-block fade-in">
              <div className="days-row">
                {isDeadlineToday ? (
                  <span
                    className="days-num"
                    style={{
                      fontSize: "clamp(3rem, 11vw, 5.6rem)",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Today
                  </span>
                ) : (
                  <span className="days-num">{daysNum}</span>
                )}
                <span className="days-label">{daysLabel}</span>
              </div>
            </div>

            <div
              className="momentum-card fade-in"
              style={{ animationDelay: "0.12s" }}
            >
              <div className="momentum-eyebrow">
                <span className="pulse" />
                Today&apos;s reading
              </div>
              <MaskReveal key={momentumText} delay={0.28}>
                <p
                  className={
                    mission.momentumLine && hasEntries
                      ? "momentum"
                      : "momentum placeholder"
                  }
                >
                  {momentumText}
                </p>
              </MaskReveal>
            </div>
          </div>
        </section>

        {mission.description && (
          <Reveal as="section" className="section" delay={0.05}>
            <div className="marg">
              <span>Why</span>
            </div>
            <div className="body">
              <Disclosure label="Why this matters">
                {mission.description}
              </Disclosure>
            </div>
          </Reveal>
        )}

        {!hasEntries && (
          <Reveal as="section" className="section" delay={0.05}>
            <div className="marg">
              <span>Begin</span>
            </div>
            <div className="body">
              <div className="empty">
                <span className="e-mark">§</span>
                <p className="e-title">No entries yet.</p>
                <p className="e-body">
                  The first proof is the hardest. Tonight, write a few honest
                  lines about what happened today. That is enough to begin.
                </p>
                <button
                  className="btn"
                  onClick={() => router.push(`/entry/${today}`)}
                >
                  Record today
                </button>
              </div>
            </div>
          </Reveal>
        )}

        <Reveal as="section" className="section" delay={0.05}>
          <div className="marg">
            <span>The record</span>
            <span className="marg-meta">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <div className="body">
            <Calendar
              key={mission.id}
              entries={entries}
              dueISO={mission.dueDate}
              createdAtISO={createdAtISO}
              onSelect={(iso) => router.push(`/entry/${iso}`)}
            />
            <div className="cal-foot">
              <span className="legend">
                <span className="sw filled" />
                <span>recorded</span>
              </span>
              <span className="legend">
                <span className="sw ring" />
                <span>today</span>
              </span>
              <span className="legend">
                <span className="sw dot" />
                <span>open</span>
              </span>
            </div>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
