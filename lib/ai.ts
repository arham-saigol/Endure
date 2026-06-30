"use client";

export type AnalyzeResult = { signal: string; summary: string };
export type MomentumResult = { momentumLine: string };

export type RecentEntry = {
  date: string;
  signal?: string | null;
  summary?: string | null;
};

export async function analyzeEntry(opts: {
  entryText: string;
  missionTitle: string;
  missionDescription?: string | null;
  recentSignals?: string[];
}): Promise<AnalyzeResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "analyze failed");
  }
  return res.json();
}

export async function fetchMomentumLine(opts: {
  recent: RecentEntry[];
  missionDescription?: string | null;
  daysRemaining: number;
  lastRawText?: string | null;
}): Promise<MomentumResult> {
  const res = await fetch("/api/momentum", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "momentum failed");
  }
  return res.json();
}
