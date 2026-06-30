"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const EASE = [0.2, 0.65, 0.3, 1] as const;

export function Disclosure({
  kicker,
  label,
  children,
  defaultOpen = false,
}: {
  kicker?: ReactNode;
  label: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();

  return (
    <div className="disclosure" data-open={open}>
      <button
        type="button"
        className="disclosure-trigger"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="label">
          {kicker && <span className="kicker">{kicker}</span>}
          <span>{label}</span>
        </span>
        <span className="chev" aria-hidden>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="disclosure-panel"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={
              reduce
                ? { opacity: 1 }
                : { height: "auto", opacity: 1 }
            }
            exit={
              reduce
                ? { opacity: 0 }
                : { height: 0, opacity: 0 }
            }
            transition={{ duration: 0.34, ease: EASE }}
          >
            <div className="disclosure-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
