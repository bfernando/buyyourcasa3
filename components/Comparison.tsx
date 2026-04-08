"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import clsx from "clsx";
import { content, Locale } from "@/lib/content";

export default function Comparison({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].comparison;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="comparison"
      ref={ref}
      className="relative py-28 lg:py-40 bg-surface overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(201,169,110,0.04) 0%, transparent 70%)" }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14 lg:mb-20"
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-px bg-gold/40" />
            <span className="text-gold/70 uppercase tracking-[0.25em] text-[11px] font-body">
              {c.eyebrow}
            </span>
            <div className="w-8 h-px bg-gold/40" />
          </div>
          <h2 className="font-display font-light text-cream mb-4" style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}>
            {c.headline}
          </h2>
          <p className="text-cream/50 font-body font-light text-lg max-w-xl mx-auto">
            {c.sub}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden border border-surface-border rounded-sm"
        >
          <div className="grid grid-cols-[1fr,1fr,1fr] bg-obsidian-900">
            <div className="px-6 py-5 border-r border-surface-border">
              <span className="text-xs uppercase tracking-widest text-cream/30 font-body">Category</span>
            </div>
            <div className="px-6 py-5 border-r border-surface-border bg-gold/5 border-t border-t-gold/40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse-gold" />
                <span className="text-xs uppercase tracking-widest text-gold font-body font-medium">{c.ourLabel}</span>
              </div>
            </div>
            <div className="px-6 py-5">
              <span className="text-xs uppercase tracking-widest text-cream/30 font-body">{c.theirLabel}</span>
            </div>
          </div>

          {c.rows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -16 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.06 + 0.35, duration: 0.6 }}
              className={clsx(
                "grid grid-cols-[1fr,1fr,1fr] border-t border-surface-border group hover:bg-white/[0.012] transition-colors duration-300",
              )}
            >
              <div className="px-6 py-5 border-r border-surface-border flex items-center">
                <span className="text-cream/50 font-body text-sm">{row.label}</span>
              </div>
              <div className="px-6 py-5 border-r border-surface-border bg-gold/[0.03] flex items-start gap-2.5">
                <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" fill="rgba(201,169,110,0.15)"/>
                  <path d="M4.5 7l2 2 3-3" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-cream/85 font-body text-sm font-medium">{row.us}</span>
              </div>
              <div className="px-6 py-5 flex items-start gap-2.5">
                <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" fill="rgba(255,255,255,0.04)"/>
                  <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#6B6575" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-cream/35 font-body text-sm">{row.them}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="text-center mt-12"
        >
          <a href="#form" className="btn-gold px-8 py-4 rounded-sm inline-flex items-center gap-2.5 text-sm">
            {c.cta}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M8 3L13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
