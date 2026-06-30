"use client";

import Link from "next/link";
import { db } from "@/lib/db";

export function Header() {
  return (
    <header className="topbar">
      <Link href="/mission" className="wordmark" aria-label="Endure">
        Endure<span className="dot">.</span>
      </Link>
      <button className="ghost-btn" onClick={() => db.auth.signOut()}>
        Sign out
      </button>
    </header>
  );
}
