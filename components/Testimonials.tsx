"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

// ─── Replace these with real testimonials ────────────────────────────────────
const testimonials = [
  {
    id: 1,
    quote:
      "I inherited my mother's house and had no idea what to do with it. The team walked me through everything, never pressured me, and closed in 11 days. I cried with relief. The whole experience felt dignified.",
    name: "Margaret T.",
    situation: "Inherited Property — Atlanta, GA",
    rating: 5,
    initials: "MT",
  },
  {
    id: 2,
    quote:
      "We were three months behind on mortgage and I thought we were going to lose everything. BuyYourCasa gave us a fair offer the same week I called, and we closed before the bank could act. Life-changing.",
    name: "Darnell & Keisha W.",
    situation: "Foreclosure Prevention — Birmingham, AL",
    rating: 5,
    initials: "DW",
  },
  {
    id: 3,
    quote:
      "My ex and I needed out fast. The property was in rough shape and neither of us wanted to deal with showings or a realtor. These guys bought it as-is. Smooth, professional, and genuinely kind throughout.",
    name: "Sandra R.",
    situation: "Divorce Settlement — Nashville, TN",
    rating: 5,
    initials: "SR",
  },
  {
    id: 4,
    quote:
      "After 14 years as a landlord I was burned out. Nightmare tenants, deferred maintenance — I just wanted out. Got a solid offer in 24 hours, tenants in place. Nothing I could have gotten on the open market this cleanly.",
    name: "Robert H.",
    situation: "Tired Landlord — Charlotte, NC",
    rating: 5,
    initials: "RH",
  },
  {
    id: 5,
    quote:
      "The roof was caved in on one side. Every realtor told me to put $40K into it first. BuyYourCasa made an offer without blinking. Fair price, zero repairs. I'd recommend them to anyone in a tough spot.",
    name: "Linda V.",
    situation: "Major Repairs — Memphis, TN",
    rating: 5,
    initials: "LV",
  },
];

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

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);

  return (
    <section
      id="testimonials"
      ref={ref}
      className="relative py-28 lg:py-40 bg-obsidian-900 overflow-hidden"
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(201,169,110,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 lg:mb-20"
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-px bg-gold/40" />
            <span className="text-gold/70 uppercase tracking-[0.25em] text-[11px] font-body">
              Seller Stories
            </span>
            <div className="w-8 h-px bg-gold/40" />
          </div>
          <h2 className="font-display font-light text-cream mb-4" style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}>
            Real people. Real relief.
          </h2>
          <p className="text-cream/50 font-body font-light text-lg max-w-lg mx-auto">
            Every home we purchase comes with a story. These are a few of them.
          </p>
        </motion.div>

        {/* Featured testimonial — large format */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="relative bg-surface border border-surface-border rounded-sm overflow-hidden">
            {/* Gold top accent */}
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
                  {/* Large quote mark */}
                  <div className="font-display text-8xl text-gold/10 leading-none mb-4 -mt-4 select-none">
                    &ldquo;
                  </div>

                  <StarRating count={testimonials[active].rating} />

                  <blockquote className="font-display font-light text-cream/90 mt-6 mb-8 leading-relaxed"
                    style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.9rem)" }}>
                    {testimonials[active].quote}
                  </blockquote>

                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                      <span className="font-display text-gold text-sm font-medium">
                        {testimonials[active].initials}
                      </span>
                    </div>
                    <div>
                      <p className="text-cream font-body font-medium text-sm">{testimonials[active].name}</p>
                      <p className="text-cream/40 font-body text-xs mt-0.5">{testimonials[active].situation}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Selector tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
        >
          {testimonials.map((t, i) => (
            <button
              key={t.id}
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

        {/* Aggregate rating */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="flex items-center justify-center gap-6 mt-12 pt-10 border-t border-surface-border"
        >
          <div className="text-center">
            <div className="font-display text-4xl text-gradient-gold font-light">4.9</div>
            <div className="flex justify-center mt-1 mb-1"><StarRating count={5} /></div>
            <div className="text-cream/40 text-xs font-body">Average Rating</div>
          </div>
          <div className="w-px h-12 bg-surface-border" />
          <div className="text-center">
            <div className="font-display text-4xl text-gradient-gold font-light">200+</div>
            <div className="text-cream/40 text-xs font-body mt-2">Verified Reviews</div>
          </div>
          <div className="w-px h-12 bg-surface-border" />
          <div className="text-center">
            <div className="font-display text-4xl text-gradient-gold font-light">98%</div>
            <div className="text-cream/40 text-xs font-body mt-2">Would Recommend</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
