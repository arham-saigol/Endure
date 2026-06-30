"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  WEEKDAY_LETTERS,
  monthGrid,
  formatLongDate,
  parseISODate,
  clamp,
  todayISO,
} from "@/lib/dates";

type EntryLite = { date: string; signal?: string | null };

function monthIndex(y: number, m: number) {
  return y * 12 + m;
}

const EASE = [0.2, 0.65, 0.3, 1] as const;

export function Calendar({
  entries,
  dueISO,
  createdAtISO,
  onSelect,
}: {
  entries: EntryLite[];
  dueISO: string;
  createdAtISO?: string | null;
  onSelect: (iso: string) => void;
}) {
  const byDate = useMemo(() => {
    const m = new Map<string, EntryLite>();
    for (const e of entries) m.set(e.date, e);
    return m;
  }, [entries]);

  const today = useMemo(() => todayISO(), []);

  const minISO = createdAtISO && createdAtISO < today ? createdAtISO : today;
  const maxISO = dueISO < today ? today : dueISO;
  const minD = parseISODate(minISO);
  const maxD = parseISODate(maxISO);
  let lo = monthIndex(minD.getFullYear(), minD.getMonth());
  let hi = monthIndex(maxD.getFullYear(), maxD.getMonth());
  if (hi < lo) {
    const t = lo;
    lo = hi;
    hi = t;
  }
  const todayD = parseISODate(today);
  const startMI = clamp(
    monthIndex(todayD.getFullYear(), todayD.getMonth()),
    lo,
    hi
  );
  const [cursor, setCursor] = useState(startMI);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();

  const year = Math.floor(cursor / 12);
  const month = cursor % 12;
  const cells = monthGrid(year, month);
  const canPrev = cursor > lo;
  const canNext = cursor < hi;

  function go(delta: number) {
    setDir(delta);
    setCursor((c) => clamp(c + delta, lo, hi));
  }

  const variants = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: (d: number) => ({ opacity: 0, x: d > 0 ? 28 : -28 }),
        animate: { opacity: 1, x: 0 },
        exit: (d: number) => ({ opacity: 0, x: d > 0 ? -28 : 28 }),
      };

  return (
    <div className="cal-card">
      <div className="cal">
        <div className="cal-head">
          <div className="cal-month-wrap">
            <span className="cal-month">{monthName(year, month)}</span>
            <span className="cal-year">{year}</span>
          </div>
          <div className="cal-nav">
            <button
              type="button"
              className="icon-btn"
              aria-label="Previous month"
              disabled={!canPrev}
              onClick={() => go(-1)}
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Next month"
              disabled={!canNext}
              onClick={() => go(1)}
            >
              <Chevron dir="right" />
            </button>
          </div>
        </div>

        <div className="cal-grid-wrap">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={cursor}
              className="cal-grid"
              custom={dir}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.32, ease: EASE }}
            >
              {WEEKDAY_LETTERS.map((l, i) => (
                <div className="cal-dow" key={i} aria-hidden>
                  {l}
                </div>
              ))}
              {cells.map((c) => {
                if (!c.inMonth) {
                  return <div className="day out" key={c.iso} aria-hidden />;
                }
                const has = byDate.has(c.iso);
                const sig = has ? byDate.get(c.iso)?.signal : null;
                const cls = ["day"];
                let node: React.ReactNode = null;
                if (has) {
                  cls.push("filled");
                  const delay = ((parseISODate(c.iso).getDate() % 6) + 1) * 0.5;
                  node = (
                    <span
                      className={c.isToday ? "node today-filled" : "node filled"}
                      style={c.isToday ? undefined : { animationDelay: `${delay}s` }}
                    />
                  );
                } else if (c.isToday) {
                  cls.push("today");
                } else if (c.isPast) {
                  cls.push("past-open");
                }
                if (c.isFuture) cls.push("future");

                return (
                  <button
                    type="button"
                    key={c.iso}
                    className={cls.join(" ")}
                    disabled={c.isFuture}
                    onClick={() => !c.isFuture && onSelect(c.iso)}
                    aria-label={
                      formatLongDate(c.iso) +
                      (has ? `, recorded${sig ? `: ${sig}` : ""}` : "")
                    }
                  >
                    {node}
                    <span className="num">{parseISODate(c.iso).getDate()}</span>
                    {sig ? <span className="tip">{sig}</span> : null}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function monthName(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long" });
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{
        transform: dir === "left" ? "rotate(180deg)" : "none",
      }}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
