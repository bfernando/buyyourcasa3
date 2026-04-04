"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * TrustStripMobile
 * ─────────────────
 * UX: 2×3 grid (not scrollable) so all trust signals are visible at once.
 * Each item is icon + 2-word label. No descriptions — user is scrolling fast.
 * Must be parseable in <2 seconds. Icons communicate before words are read.
 */

const items = [
  { label: "No Repairs", icon: "🔧" },
  { label: "No Fees", icon: "✓" },
  { label: "Cash Offer", icon: "$" },
  { label: "Close Fast", icon: "⚡" },
  { label: "As-Is Sale", icon: "🏠" },
  { label: "Any Situation", icon: "♥" },
];

export default function TrustStripMobile() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section ref={ref} className="bg-surface border-y border-surface-border py-8 px-5">
      {/* Section label */}
      <p className="text-center text-[10px] uppercase tracking-[0.25em] text-gold/50 font-body mb-5">
        The BuyYourCasa Standard
      </p>

      {/* 2×3 grid */}
      <div className="grid grid-cols-3 gap-px bg-surface-border border border-surface-border">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="bg-surface flex flex-col items-center justify-center py-5 px-2 gap-2"
          >
            <span className="text-xl leading-none" aria-hidden>
              {item.icon === "✓" ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="9" stroke="#C9A96E" strokeWidth="1.5"/>
                  <path d="M7 11l3 3 5-5" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : item.icon === "$" ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 4v14M7.5 16.5c1 .7 2.2 1 3.5 1s2.5-.4 3.5-1c.7-.5 1-1.2 1-2 0-2.5-5-2.5-5-5 0-.8.3-1.5 1-2C12.5 7 13.7 6.5 15 6.5" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M7 7.5c.7-.7 2-1.5 4-1.5" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : item.icon === "⚡" ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M13 3L5 12h7l-1 7 9-10h-7l1-6z" stroke="#C9A96E" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              ) : item.icon === "🔧" ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M15 5a4 4 0 01-4 7.46L7 16.5a2 2 0 01-2.83-2.83l4.04-4A4 4 0 0115 5z" stroke="#C9A96E" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              ) : item.icon === "🏠" ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M3 9.5L11 3l8 6.5V19H3V9.5z" stroke="#C9A96E" strokeWidth="1.5" strokeLinejoin="round"/>
                  <rect x="8" y="13" width="6" height="6" stroke="#C9A96E" strokeWidth="1.5"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 4C7.5 4 4 7.5 4 11c0 5 7 13 7 13s7-8 7-13c0-3.5-3.5-7-7-7z" stroke="#C9A96E" strokeWidth="1.5"/>
                  <circle cx="11" cy="11" r="2.5" stroke="#C9A96E" strokeWidth="1.5"/>
                </svg>
              )}
            </span>
            <span className="text-cream/75 text-xs font-body font-medium text-center leading-tight">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Rating bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex items-center justify-center gap-2 mt-6"
      >
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="#C9A96E">
              <path d="M6 1L7.5 4.2l3.5.5-2.5 2.4.6 3.4L6 8.9l-3.1 1.6.6-3.4L1 4.7l3.5-.5L6 1z"/>
            </svg>
          ))}
        </div>
        <span className="text-cream/50 text-xs font-body">4.9 · 200+ reviews</span>
      </motion.div>
    </section>
  );
}
