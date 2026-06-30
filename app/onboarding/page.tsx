"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal } from "@/components/Reveal";
import { addDays, todayISO } from "@/lib/dates";

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <Onboarding />
    </RequireAuth>
  );
}

function Onboarding() {
  const { user } = db.useAuth();
  const router = useRouter();
  const q = db.useQuery(
    user
      ? { missions: { $: { where: { "user.id": user.id } } } }
      : null
  );
  const hasMission = !!q.data?.missions?.length;

  useEffect(() => {
    if (!q.isLoading && hasMission) router.replace("/mission");
  }, [q.isLoading, hasMission, router]);

  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = todayISO();
  const minDue = addDays(today, 1);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    if (!t) {
      setError("Name your mission.");
      return;
    }
    if (!due) {
      setError("Choose a deadline.");
      return;
    }
    if (due <= today) {
      setError("The deadline must be ahead of you.");
      return;
    }
    if (!user) return;
    setBusy(true);
    try {
      const mId = user.id;
      const description = desc.trim();
      await db.transact(
        db.tx.missions[mId]
          .update({
            title: t,
            dueDate: due,
            createdAt: Date.now(),
            ...(description ? { description } : {}),
          })
          .link({ user: user.id })
      );
      router.replace("/mission");
    } catch (err: unknown) {
      setError(extractError(err) || "Could not create the mission.");
      setBusy(false);
    }
  }

  if (q.isLoading || !user || hasMission) {
    return (
      <div className="loading">
        <span className="mark" />
      </div>
    );
  }

  return (
    <div className="shell">
      <main className="page">
        <Reveal as="section" className="section">
          <div className="marg">
            <span>Begin</span>
          </div>
          <div className="body">
            <h1 className="lede" style={{ maxWidth: "16ch" }}>
              What are you trying to become?
            </h1>
            <p className="body-prose" style={{ marginTop: 16, maxWidth: "48ch" }}>
              One mission. One deadline. Each night, a short record of proof.
              There is no plan here, no tasks — only the evidence that you kept
              going.
            </p>

            <form
              className="form-stack"
              style={{ marginTop: 36 }}
              onSubmit={submit}
            >
              <div className="field">
                <label htmlFor="t">Mission</label>
                <input
                  id="t"
                  className="input input-display"
                  placeholder="Become someone who finishes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  maxLength={120}
                />
              </div>
              <div className="field">
                <label htmlFor="d">Deadline</label>
                <input
                  id="d"
                  type="date"
                  className="input"
                  min={minDue}
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="de">
                  What it means{" "}
                  <span
                    className="faint"
                    style={{
                      textTransform: "none",
                      letterSpacing: 0,
                      fontWeight: 400,
                    }}
                  >
                    — optional
                  </span>
                </label>
                <textarea
                  id="de"
                  className="textarea"
                  placeholder="A line or two about why this matters to you."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  maxLength={600}
                />
              </div>
              {error && <p className="err">{error}</p>}
              <div className="form-foot">
                <button className="btn" disabled={busy}>
                  {busy ? "Beginning…" : "Begin the mission"}
                </button>
              </div>
            </form>
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
