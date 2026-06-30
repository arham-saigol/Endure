import { NextRequest } from "next/server";
import { deepseekComplete, parseJSONLoose } from "@/lib/deepseek";
import { requireInstantUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You are the keeper of a private archive of effort. One person is pursuing a single important mission with a deadline, and each night they record a raw, unfiltered entry about what they did, what happened, what they felt, and what they struggled with.

Read their entry and return two things:

1. "signal" — a short heading of 2 to 4 words, in Title Case, that captures the tone and meaning of this day. It must feel human, specific, and memorable. It is never a score. It never judges the person harshly. It names what the day was.
   Examples of the register to aim for: "Still Moving", "Heavy Day, Still Here", "Quiet Progress", "Chose Discipline", "Built Through It", "Protected the Mission", "Forward Anyway", "Did Not Break", "Returned to the Work", "Held the Line".

2. "summary" — one short paragraph of 2 to 4 sentences. Capture what happened that day, what mattered, and what it quietly says about their progress. Be grounded and strong. Do not use bullet points. Do not over-explain. Do not sound like therapy notes. Do not address the reader as "you" throughout. Write as a calm witness recording the day.

Return only JSON: {"signal": string, "summary": string}. No commentary, no markdown.`;

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireInstantUser(req);
    if (!authUser) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const entryText = body?.entryText?.toString().trim();
    const missionTitle = body?.missionTitle?.toString().trim();
    const missionDescription = body?.missionDescription?.toString().trim();
    const recentSignals: string[] = Array.isArray(body?.recentSignals)
      ? body.recentSignals.map((s: unknown) => s?.toString()).filter(Boolean)
      : [];

    if (!entryText) {
      return Response.json({ error: "empty entry" }, { status: 400 });
    }

    const contextParts: string[] = [];
    if (missionTitle) contextParts.push(`Mission: ${missionTitle}`);
    if (missionDescription) contextParts.push(`What this mission means to them:\n${missionDescription}`);
    if (recentSignals.length) {
      contextParts.push(
        `Recent daily signals (most recent first): ${recentSignals.slice(0, 6).join(", ")}`
      );
    }
    const context = contextParts.length ? contextParts.join("\n\n") + "\n\n" : "";

    const user = `${context}Today's entry:\n"""\n${entryText}\n"""`;

    const raw = await deepseekComplete([
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ]);

    const parsed = parseJSONLoose<{ signal?: string; summary?: string }>(raw);
    const signal = (parsed.signal || "").trim();
    const summary = (parsed.summary || "").trim();

    if (!signal || !summary) {
      throw new Error("incomplete response");
    }

    return Response.json({ signal, summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
