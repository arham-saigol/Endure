"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { db } from "@/lib/db";

const EASE = [0.2, 0.65, 0.3, 1] as const;

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      await db.auth.sendMagicCode({ email: value });
      setSent(true);
    } catch (err: unknown) {
      setError(extractError(err) || "Could not send the code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      await db.auth.signInWithMagicCode({ email: email.trim(), code: value });
    } catch (err: unknown) {
      setError(extractError(err) || "That code did not work.");
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  const fade = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="auth">
      <motion.div className="auth-ornament" {...fade} transition={{ duration: 0.6, ease: EASE }} />
      <motion.h1 className="brand" {...fade} transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}>
        Endure
      </motion.h1>
      <motion.p
        className="tagline"
        {...fade}
        transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
      >
        A quiet archive of effort. One mission, one deadline, one entry a night.
      </motion.p>

      <motion.div
        className="auth-form-wrap"
        {...fade}
        transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
      >
        {!sent ? (
          <form className="form-stack" onSubmit={sendCode}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@somewhere.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
              />
            </div>
            {error && <p className="err">{error}</p>}
            <div className="form-foot">
              <button className="btn" disabled={busy}>
                {busy ? "Sending…" : "Continue"}
              </button>
            </div>
            <p className="faint" style={{ fontSize: "0.8rem", marginTop: 4 }}>
              We&apos;ll email you a code. No password to remember.
            </p>
          </form>
        ) : (
          <form className="form-stack" onSubmit={verifyCode}>
            <div className="field">
              <label htmlFor="code">Code sent to {email.trim()}</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="input"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && <p className="err">{error}</p>}
            <div className="form-foot" style={{ justifyContent: "space-between" }}>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setSent(false);
                  setCode("");
                  setError(null);
                }}
              >
                Back
              </button>
              <button className="btn" disabled={busy}>
                {busy ? "Verifying…" : "Verify"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function extractError(err: unknown): string {
  const any = err as { body?: { message?: string }; message?: string };
  return any?.body?.message || any?.message || "";
}
