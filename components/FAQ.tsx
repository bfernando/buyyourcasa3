"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { content, Locale } from "@/lib/content";

function FAQItem({ q, a, index, isInView }: { q: string; a: string; index: number; isInView: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.06 + 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="border-b border-surface-border last:border-none"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-6 py-7 text-left group"
        aria-expanded={open}
      >
        <span className={`font-body text-base leading-snug transition-colors duration-300 ${open ? "text-cream" : "text-cream/70 group-hover:text-cream/90"}`}>
          {q}
        </span>
        <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${
          open
            ? "border-gold bg-gold/10 text-gold rotate-45"
            : "border-surface-border text-cream/40 group-hover:border-gold/30 group-hover:text-gold/50"
        }`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-cream/55 font-body font-light text-base leading-relaxed pb-8 pr-14">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].faq;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="faq"
      ref={ref}
      className="relative py-28 lg:py-40 bg-obsidian-900 overflow-hidden"
    >
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(201,169,110,0.04) 0%, transparent 65%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[380px,1fr] gap-16 lg:gap-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
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
              style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)" }}
            >
              {c.headline}{" "}
              <span className="italic text-gradient-gold">{c.headlineItalic}</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-cream/45 font-body font-light text-base leading-relaxed mb-8"
            >
              {c.sub}
            </motion.p>

            <motion.a
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.7 }}
              href="#form"
              className="btn-outline px-7 py-3.5 rounded-sm inline-flex items-center gap-2 text-sm"
            >
              {c.stillHave}
            </motion.a>
          </div>

          <div>
            {c.items.map((item, i) => (
              <FAQItem
                key={i}
                q={item.q}
                a={item.a}
                index={i}
                isInView={isInView}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
