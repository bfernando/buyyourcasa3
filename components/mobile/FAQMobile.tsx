"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { content, Locale } from "@/lib/content";

function FAQRow({ q, a, isInView, index }: { q: string; a: string; isInView: boolean; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.06 + 0.15, duration: 0.5 }}
      className="border-b border-surface-border last:border-none"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
        style={{ minHeight: 56, touchAction: "manipulation" }}
        aria-expanded={open}
      >
        <span className={`font-body text-base leading-snug transition-colors duration-200 ${open ? "text-cream" : "text-cream/70"}`}>
          {q}
        </span>
        <div className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${
          open ? "border-gold bg-gold/10 text-gold rotate-45" : "border-surface-border text-cream/30"
        }`}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 2V9M2 5.5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-cream/50 font-body text-sm leading-relaxed pb-5 pr-12">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQMobile({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].faq;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="faq" ref={ref} className="py-12 px-5 bg-obsidian-900">
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
          {c.headline}{" "}
          <span className="italic text-gradient-gold">{c.headlineItalic}</span>
        </h2>
      </motion.div>

      <div>
        {c.items.map((item, i) => (
          <FAQRow key={i} q={item.q} a={item.a} isInView={isInView} index={i} />
        ))}
      </div>
    </section>
  );
}
