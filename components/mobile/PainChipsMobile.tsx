"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { content, Locale } from "@/lib/content";

export default function PainChipsMobile({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].mobilePain;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-12 px-5 bg-surface">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />

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
        <p className="text-cream/45 font-body text-sm mt-2 leading-relaxed">
          {c.sub}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="flex flex-wrap gap-2 mb-8"
      >
        {c.chips.map((s, i) => (
          <motion.span
            key={s}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: i * 0.05 + 0.2, duration: 0.4 }}
            className="px-4 py-2.5 rounded-full border border-surface-border bg-obsidian-900 text-cream/70 text-sm font-body leading-none"
          >
            {s}
          </motion.span>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <p className="text-cream/40 font-body text-sm mb-5 leading-relaxed">
          {c.empathy}{" "}
          <span className="text-cream/70">{c.empathyStrong}</span>
        </p>
        <a
          href="#mobile-form"
          className="btn-outline w-full h-12 rounded-sm flex items-center justify-center gap-2 text-sm uppercase tracking-wide font-body font-medium"
          style={{ touchAction: "manipulation" }}
        >
          {c.cta}
        </a>
      </motion.div>
    </section>
  );
}
