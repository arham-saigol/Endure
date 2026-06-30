"use client";

import { db } from "@/lib/db";

export type AnalyzeResult = { signal: string; summary: string };
export type MomentumResult = { momentumLine: string };

export type RecentEntry = {
  date: string;
  signal?: string | null;
  summary?: string | null;
};

async function authHeaders(): Promise<HeadersInit> {
  const user = (await db.getAuth()) as { refresh_token?: string } | null;
  return {
    "Content-Type": "application/json",
    ...(user?.refresh_token ? { Authorization: `Bearer ${user.refresh_token}` } : {}),
  };
}

async function responseError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => null);
  return new Error(typeof body?.error === "string" && body.error ? body.error : fallback);
}

export async function analyzeEntry(opts: {
  entryText: string;
  missionTitle: string;
  missionDescription?: string | null;
  recentSignals?: string[];
}): Promise<AnalyzeResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    throw await responseError(res, "analyze failed");
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
    headers: await authHeaders(),
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    throw await responseError(res, "momentum failed");
  }
  return res.json();
}
