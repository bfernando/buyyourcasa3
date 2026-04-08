"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { content, Locale } from "@/lib/content";

export default function TestimonialsMobile({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].testimonials;
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [active, setActive] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    setActive(index);
  }, []);

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: "smooth" });
    setActive(index);
  };

  return (
    <section id="testimonials" ref={ref} className="py-12 bg-surface">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="px-5 mb-6"
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.2, duration: 0.6 }}
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-3 pl-5 pr-5 pb-2"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          overscrollBehaviorX: "contain",
        }}
      >
        {c.items.map((t, idx) => (
          <div
            key={idx}
            className="shrink-0 w-[calc(100vw-40px)] rounded-sm border border-surface-border bg-obsidian-900 overflow-hidden"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            <div className="p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <svg key={i} width="13" height="13" viewBox="0 0 13 13" fill="#C9A96E">
                    <path d="M6.5 1L8.06 4.41L11.75 4.9L9.13 7.45L9.79 11.1L6.5 9.3L3.21 11.1L3.87 7.45L1.25 4.9L4.94 4.41L6.5 1Z"/>
                  </svg>
                ))}
              </div>
              <blockquote className="font-display font-light text-cream/85 text-xl leading-snug mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <span className="font-display text-gold text-sm">{t.initials}</span>
                </div>
                <div>
                  <p className="text-cream font-body font-medium text-sm">{t.name}</p>
                  <p className="text-cream/35 font-body text-xs mt-0.5">{t.situation}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="flex justify-center gap-1.5 mt-4 px-5">
        {c.items.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`transition-all duration-300 rounded-full ${
              i === active ? "w-6 h-2 bg-gold" : "w-2 h-2 bg-surface-border"
            }`}
            aria-label={`Go to testimonial ${i + 1}`}
            style={{ touchAction: "manipulation" }}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-5 mt-7 pt-6 border-t border-surface-border mx-5">
        <div className="text-center">
          <div className="font-display text-3xl font-light text-gradient-gold">{c.rating}</div>
          <div className="text-cream/30 text-[10px] font-body uppercase tracking-wider mt-1">{c.labels.rating}</div>
        </div>
        <div className="w-px h-10 bg-surface-border" />
        <div className="text-center">
          <div className="font-display text-3xl font-light text-gradient-gold">{c.reviewCount}</div>
          <div className="text-cream/30 text-[10px] font-body uppercase tracking-wider mt-1">{c.labels.reviews}</div>
        </div>
        <div className="w-px h-10 bg-surface-border" />
        <div className="text-center">
          <div className="font-display text-3xl font-light text-gradient-gold">{c.recommendPct}</div>
          <div className="text-cream/30 text-[10px] font-body uppercase tracking-wider mt-1">{c.labels.recommend}</div>
        </div>
      </div>
    </section>
  );
}
