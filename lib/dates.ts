// Local-date utilities. All "day" identity is based on the user's local
// calendar, never UTC, so "today" always matches what they see.

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(aISO: string, bISO: string): number {
  const a = parseISODate(aISO).getTime();
  const b = parseISODate(bISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export type DayCell = {
  iso: string;
  inMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
};

// Monday-first grid. Returns 42 cells (6 weeks) for a stable layout.
export function monthGrid(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Mon=0 .. Sun=6
  const gridStart = addDays(toISODate(first), -startOffset);
  const today = todayISO();
  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const iso = addDays(gridStart, i);
    cells.push({
      iso,
      inMonth: parseISODate(iso).getMonth() === month,
      isToday: iso === today,
      isPast: iso < today,
      isFuture: iso > today,
    });
  }
  return cells;
}

export function formatLongDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
