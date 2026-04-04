"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";

/**
 * TestimonialsMobile
 * ───────────────────
 * UX: CSS scroll-snap carousel — native browser scroll behavior.
 * This is smoother on mobile than any JS-driven animation because it
 * uses the compositor thread, avoiding JS/main-thread jank.
 * Quotes are SHORT (2–3 sentences max). Mobile users won't read a novel.
 * Dot indicators give progress/pagination sense without visual overhead.
 */

const testimonials = [
  {
    quote: "I inherited my mother's house and had no idea what to do. They walked me through everything, never pressured me, and closed in 11 days. I cried with relief.",
    name: "Margaret T.",
    situation: "Inherited Property · Atlanta, GA",
    rating: 5,
    initials: "MT",
  },
  {
    quote: "Three months behind on mortgage. BuyYourCasa gave us a fair offer the same week I called and we closed before the bank could act. Life-changing.",
    name: "Darnell & Keisha W.",
    situation: "Foreclosure · Birmingham, AL",
    rating: 5,
    initials: "DW",
  },
  {
    quote: "My ex and I needed out fast. The property was rough. They bought it as-is, no showings, no hassle. Smooth, professional, genuinely kind.",
    name: "Sandra R.",
    situation: "Divorce · Nashville, TN",
    rating: 5,
    initials: "SR",
  },
  {
    quote: "After 14 years as a landlord I was burned out. Got a solid offer in 24 hours with tenants still in place. Nothing I could get on the open market this cleanly.",
    name: "Robert H.",
    situation: "Tired Landlord · Charlotte, NC",
    rating: 5,
    initials: "RH",
  },
];

export default function TestimonialsMobile() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [active, setActive] = useState(0);

  // Update dot indicator on scroll
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="px-5 mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-px bg-gold/50" />
          <span className="text-gold/60 text-[10px] uppercase tracking-[0.25em] font-body">Seller Stories</span>
        </div>
        <h2 className="font-display font-light text-cream text-4xl leading-tight">
          Real people.{" "}
          <span className="italic text-gradient-gold">Real relief.</span>
        </h2>
      </motion.div>

      {/* Scroll carousel — CSS scroll-snap for native smoothness */}
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
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="shrink-0 w-[calc(100vw-40px)] rounded-sm border border-surface-border bg-obsidian-900 overflow-hidden"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Gold top line */}
            <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            <div className="p-6">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <svg key={i} width="13" height="13" viewBox="0 0 13 13" fill="#C9A96E">
                    <path d="M6.5 1L8.06 4.41L11.75 4.9L9.13 7.45L9.79 11.1L6.5 9.3L3.21 11.1L3.87 7.45L1.25 4.9L4.94 4.41L6.5 1Z"/>
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="font-display font-light text-cream/85 text-xl leading-snug mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Attribution */}
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

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-4 px-5">
        {testimonials.map((_, i) => (
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

      {/* Aggregate */}
      <div className="flex items-center justify-center gap-5 mt-7 pt-6 border-t border-surface-border mx-5">
        <div className="text-center">
          <div className="font-display text-3xl font-light text-gradient-gold">4.9</div>
          <div className="text-cream/30 text-[10px] font-body uppercase tracking-wider mt-1">Rating</div>
        </div>
        <div className="w-px h-10 bg-surface-border" />
        <div className="text-center">
          <div className="font-display text-3xl font-light text-gradient-gold">200+</div>
          <div className="text-cream/30 text-[10px] font-body uppercase tracking-wider mt-1">Reviews</div>
        </div>
        <div className="w-px h-10 bg-surface-border" />
        <div className="text-center">
          <div className="font-display text-3xl font-light text-gradient-gold">98%</div>
          <div className="text-cream/30 text-[10px] font-body uppercase tracking-wider mt-1">Recommend</div>
        </div>
      </div>
    </section>
  );
}
