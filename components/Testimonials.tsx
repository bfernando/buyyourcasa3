"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { content, Locale } from "@/lib/content";

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(count)].map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 13 13" fill="#C9A96E">
          <path d="M6.5 1L8.06 4.41L11.75 4.9L9.13 7.45L9.79 11.1L6.5 9.3L3.21 11.1L3.87 7.45L1.25 4.9L4.94 4.41L6.5 1Z"/>
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].testimonials;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);

  return (
    <section
      id="testimonials"
      ref={ref}
      className="relative py-28 lg:py-40 bg-obsidian-900 overflow-hidden"
    >
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(201,169,110,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 lg:mb-20"
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-px bg-gold/40" />
            <span className="text-gold/70 uppercase tracking-[0.25em] text-[11px] font-body">
              {c.eyebrow}
            </span>
            <div className="w-8 h-px bg-gold/40" />
          </div>
          <h2 className="font-display font-light text-cream mb-4" style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}>
            {c.headline} <span className="italic text-gradient-gold">{c.headlineItalic}</span>
          </h2>
          <p className="text-cream/50 font-body font-light text-lg max-w-lg mx-auto">
            {c.sub}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="relative bg-surface border border-surface-border rounded-sm overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            <div className="p-8 lg:p-14">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="font-display text-8xl text-gold/10 leading-none mb-4 -mt-4 select-none">
                    &ldquo;
                  </div>
                  <StarRating count={c.items[active].rating} />
                  <blockquote
                    className="font-display font-light text-cream/90 mt-6 mb-8 leading-relaxed"
                    style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.9rem)" }}
                  >
                    {c.items[active].quote}
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                      <span className="font-display text-gold text-sm font-medium">
                        {c.items[active].initials}
                      </span>
                    </div>
                    <div>
                      <p className="text-cream font-body font-medium text-sm">{c.items[active].name}</p>
                      <p className="text-cream/40 font-body text-xs mt-0.5">{c.items[active].situation}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
        >
          {c.items.map((t, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`group p-4 rounded-sm border text-left transition-all duration-300 ${
                active === i
                  ? "border-gold/40 bg-gold/5"
                  : "border-surface-border bg-surface hover:border-gold/20 hover:bg-surface-hover"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-display ${
                  active === i ? "bg-gold text-obsidian-900" : "bg-surface-hover text-cream/50"
                }`}>
                  {t.initials}
                </div>
              </div>
              <p className={`font-body text-xs leading-tight ${active === i ? "text-cream/80" : "text-cream/40"}`}>
                {t.situation}
              </p>
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="flex items-center justify-center gap-6 mt-12 pt-10 border-t border-surface-border"
        >
          <div className="text-center">
            <div className="font-display text-4xl text-gradient-gold font-light">{c.rating}</div>
            <div className="flex justify-center mt-1 mb-1"><StarRating count={5} /></div>
            <div className="text-cream/40 text-xs font-body">{c.labels.rating}</div>
          </div>
          <div className="w-px h-12 bg-surface-border" />
          <div className="text-center">
            <div className="font-display text-4xl text-gradient-gold font-light">{c.reviewCount}</div>
            <div className="text-cream/40 text-xs font-body mt-2">{c.labels.reviews}</div>
          </div>
          <div className="w-px h-12 bg-surface-border" />
          <div className="text-center">
            <div className="font-display text-4xl text-gradient-gold font-light">{c.recommendPct}</div>
            <div className="text-cream/40 text-xs font-body mt-2">{c.labels.recommend}</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
