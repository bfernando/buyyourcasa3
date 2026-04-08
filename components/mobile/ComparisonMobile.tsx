"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { content, Locale } from "@/lib/content";

export default function ComparisonMobile({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].comparison;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const usBenefits = c.rows.map((r) => r.us);
  const themDrawbacks = c.rows.map((r) => r.them);

  return (
    <section id="comparison" ref={ref} className="py-12 px-5 bg-obsidian-900">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-7"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-px bg-gold/50" />
          <span className="text-gold/60 text-[10px] uppercase tracking-[0.25em] font-body">{c.eyebrow}</span>
        </div>
        <h2 className="font-display font-light text-cream text-4xl leading-tight">
          {c.headline}
        </h2>
      </motion.div>

      <div className="flex flex-col gap-4">
        {/* Our card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-sm border border-gold/40 bg-gold/[0.04] overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-gold" />
              <span className="text-xs uppercase tracking-widest text-gold font-body font-medium">
                {c.ourLabel}
              </span>
            </div>
            <ul className="flex flex-col gap-2.5">
              {usBenefits.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <circle cx="7.5" cy="7.5" r="6.5" fill="rgba(201,169,110,0.12)"/>
                    <path d="M4.5 7.5l2 2 4-4" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-cream/85 font-body text-sm leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Traditional card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.28, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-sm border border-surface-border bg-surface p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-cream/20" />
            <span className="text-xs uppercase tracking-widest text-cream/30 font-body">
              {c.theirLabel}
            </span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {themDrawbacks.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="7.5" cy="7.5" r="6.5" fill="rgba(255,255,255,0.03)"/>
                  <path d="M5 5l5 5M10 5l-5 5" stroke="#5A5460" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-cream/30 font-body text-sm leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <motion.a
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5, duration: 0.6 }}
        href="#mobile-form"
        className="btn-gold w-full h-13 rounded-sm flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide mt-7"
        style={{ minHeight: 52, touchAction: "manipulation" }}
      >
        {c.cta}
      </motion.a>
    </section>
  );
}
