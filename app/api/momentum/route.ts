import { NextRequest } from "next/server";
import { deepseekComplete, parseJSONLoose } from "@/lib/deepseek";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You write a single daily momentum line for a private archive of effort. One person is pursuing a single important mission with a deadline, and each night they record a raw entry. A keeper reads those entries and, each day, writes one line that helps them remember they are still moving.

Write one strong, specific, emotionally intelligent sentence. It must be grounded in what they actually did and felt across the recent days — not generic motivation, not a platitude, not a command, never cheesy. Avoid exclamation marks. Prefer not to use the word "you." Name the texture of their effort plainly.

Maximum ~22 words. One sentence only.

Return only JSON: {"momentumLine": string}. No commentary, no markdown.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const recent: { date?: string; signal?: string | null; summary?: string | null }[] =
      Array.isArray(body?.recent) ? body.recent : [];
    const missionDescription = body?.missionDescription?.toString().trim() || "";
    const daysRemaining = Number(body?.daysRemaining);
    const lastRawText = body?.lastRawText?.toString().trim() || "";

    if (!recent.length) {
      return Response.json(
        { error: "no entries to build momentum from" },
        { status: 400 }
      );
    }

    const lines = recent
      .slice(0, 8)
      .map((e, i) => {
        const d = e.date ? `[${e.date}]` : "";
        const s = e.signal ? `${e.signal}.` : "";
        const sum = e.summary ? ` ${e.summary}` : "";
        return `${i === 0 ? "Most recent" : "Earlier"} ${d} ${s}${sum}`.trim();
      })
      .join("\n");

    const contextParts: string[] = [];
    contextParts.push(`Days remaining until the deadline: ${Number.isFinite(daysRemaining) ? daysRemaining : "unknown"}`);
    if (missionDescription) contextParts.push(`What the mission means:\n${missionDescription}`);
    contextParts.push(`Recent days (most recent first):\n${lines}`);
    if (lastRawText) contextParts.push(`The latest entry, verbatim:\n"""\n${lastRawText.slice(0, 1200)}\n"""`);

    const user = contextParts.join("\n\n");

    const raw = await deepseekComplete([
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ]);

    const parsed = parseJSONLoose<{ momentumLine?: string }>(raw);
    let line = (parsed.momentumLine || "").trim();
    line = line.replace(/^["“']|["”']$/g, "").trim();
    if (!line) throw new Error("empty momentum line");

    return Response.json({ momentumLine: line });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
