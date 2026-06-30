import { NextRequest } from "next/server";

type InstantUser = { id: string };

export async function requireInstantUser(req: NextRequest): Promise<InstantUser | null> {
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return null;

  const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
  if (!appId) throw new Error("Missing NEXT_PUBLIC_INSTANT_APP_ID");

  const res = await fetch("https://api.instantdb.com/runtime/auth/verify_refresh_token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ "app-id": appId, "refresh-token": token }),
    cache: "no-store",
  }).catch(() => null);

  if (!res?.ok) return null;

  const data = await res.json().catch(() => null);
  return data?.user?.id ? { id: data.user.id } : null;
}
