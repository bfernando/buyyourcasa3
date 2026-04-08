"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { content, Locale } from "@/lib/content";

const situationIcons = ["⚠", "🏚", "✦", "🔑", "🔧", "↗", "↓", "⬡"];

export default function PainToRelief({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].pain;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative py-28 lg:py-40 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #08080C 0%, #0E0E14 50%, #08080C 100%)" }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        aria-hidden
      >
        <span
          className="font-display font-bold text-white/[0.015] leading-none whitespace-nowrap"
          style={{ fontSize: "clamp(8rem, 25vw, 22rem)" }}
        >
          Relief
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
        <div className="max-w-3xl mb-16 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-3 mb-5"
          >
            <div className="w-8 h-px bg-gold/40" />
            <span className="text-gold/70 uppercase tracking-[0.25em] text-[11px] font-body">
              {c.eyebrow}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-light text-cream mb-6"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
          >
            {c.headline}{" "}
            <span className="italic text-gradient-gold">{c.headlineItalic}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-cream/50 font-body font-light text-lg leading-relaxed"
          >
            {c.sub}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-surface-border/50 border border-surface-border/50">
          {c.situations.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.06 + 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="group relative bg-obsidian-900 p-8 lg:p-9 flex flex-col gap-4 hover:bg-surface transition-all duration-500 cursor-default"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              <div className="text-xl opacity-60 group-hover:opacity-90 transition-opacity duration-300">{situationIcons[i]}</div>
              <h3 className="font-display text-xl text-cream font-medium group-hover:text-gradient-gold transition-colors duration-300">
                {item.label}
              </h3>
              <p className="text-cream/45 text-sm font-body font-light leading-relaxed group-hover:text-cream/60 transition-colors duration-300">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-14 text-center"
        >
          <p className="text-cream/40 font-body font-light text-base max-w-lg mx-auto mb-8">
            {c.sub}
          </p>
          <a href="#form" className="btn-outline px-8 py-3.5 rounded-sm inline-flex items-center gap-2 text-sm">
            {c.cta}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
