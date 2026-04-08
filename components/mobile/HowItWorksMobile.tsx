"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { content, Locale } from "@/lib/content";

const stepIcons = [
  <svg key="1" width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 2C7.7 2 5 4.7 5 8c0 5.2 6 11 6 11s6-5.8 6-11c0-3.3-2.7-6-6-6z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="11" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>,
  <svg key="2" width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="4" width="18" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 7l9 7 9-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  <svg key="3" width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="6" width="18" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 10h18" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="6.5" cy="15" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 14h6M11 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
];

export default function HowItWorksMobile({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].howItWorks;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="how-it-works" ref={ref} className="py-12 px-5 bg-obsidian-900">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-px bg-gold/50" />
          <span className="text-gold/60 text-[10px] uppercase tracking-[0.25em] font-body">{c.eyebrow}</span>
        </div>
        <h2 className="font-display font-light text-cream text-4xl leading-tight">
          {c.headline.split(" ").slice(0, 2).join(" ")}.<br />
          <span className="italic text-gradient-gold">{lang === "es" ? "Listo." : "Done."}</span>
        </h2>
      </motion.div>

      <div className="relative flex flex-col gap-0">
        <div className="absolute left-[26px] top-10 bottom-10 w-px bg-gradient-to-b from-gold/30 via-gold/20 to-transparent" />

        {c.steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.12 + 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex gap-4 pb-8 last:pb-0"
          >
            <div className="shrink-0 flex flex-col items-center">
              <div className="w-[52px] h-[52px] rounded-full bg-surface border border-gold/20 flex items-center justify-center relative z-10">
                <div className="text-gold">{stepIcons[i]}</div>
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                  <span className="font-body text-[10px] font-bold text-obsidian-900">{i + 1}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex-1">
              <span className="inline-block px-2 py-0.5 rounded-full border border-gold/20 bg-gold/5 text-gold text-[10px] uppercase tracking-wider font-body mb-2">
                {step.time}
              </span>
              <h3 className="font-display text-xl text-cream mb-1.5 leading-tight">{step.title}</h3>
              <p className="text-cream/50 font-body text-sm leading-relaxed">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.a
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6, duration: 0.6 }}
        href="#mobile-form"
        className="btn-gold w-full h-13 rounded-sm flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide mt-8"
        style={{ minHeight: 52, touchAction: "manipulation" }}
      >
        {c.cta}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.a>
    </section>
  );
}
