"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

// ─── Replace these with your actual service cities ───────────────────────────
const cities = [
  "Atlanta", "Birmingham", "Nashville", "Charlotte", "Memphis",
  "Jacksonville", "Savannah", "Chattanooga", "Columbia", "Greenville",
  "Huntsville", "Knoxville", "Mobile", "Macon", "Montgomery",
  "Augusta", "Columbus", "Gainesville", "Tallahassee", "Pensacola",
];

export default function ServiceArea() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative py-24 lg:py-36 bg-surface overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="flex items-center gap-3 mb-5"
            >
              <div className="w-8 h-px bg-gold/40" />
              <span className="text-gold/70 uppercase tracking-[0.25em] text-[11px] font-body">
                Service Area
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-light text-cream mb-6"
              style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)" }}
            >
              Serving homeowners{" "}
              <span className="italic text-gradient-gold">across the Southeast</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-cream/50 font-body font-light text-base leading-relaxed mb-8"
            >
              We buy houses in major metros and surrounding communities throughout the Southeast.
              Whether you&apos;re in the heart of a city or outside the suburbs, we can make you an offer.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex items-start gap-3 p-5 border border-surface-border rounded-sm bg-obsidian-900 mb-8"
            >
              <svg className="text-gold mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5C6.1 1.5 3.75 3.85 3.75 6.75c0 4.22 5.25 9.75 5.25 9.75s5.25-5.53 5.25-9.75C14.25 3.85 11.9 1.5 9 1.5z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="9" cy="6.75" r="1.75" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <div>
                <p className="text-cream/70 text-sm font-body font-medium mb-1">Not sure if we cover your area?</p>
                <p className="text-cream/40 text-sm font-body">
                  Submit your address and we&apos;ll let you know within minutes. We&apos;re always expanding.
                </p>
              </div>
            </motion.div>

            <motion.a
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.7 }}
              href="#form"
              className="btn-gold px-7 py-3.5 rounded-sm inline-flex items-center gap-2 text-sm"
            >
              Check My Area
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7H11.5M7 2.5L11.5 7L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.a>
          </div>

          {/* Right: city grid */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Abstract map placeholder */}
            <div className="relative bg-obsidian-900 border border-surface-border rounded-sm p-8 lg:p-10">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

              {/* Dot grid map suggestion */}
              <div className="relative h-48 mb-8 overflow-hidden">
                {/* Simulated map dots */}
                <svg className="w-full h-full opacity-20" viewBox="0 0 400 200" fill="none">
                  {Array.from({ length: 20 }, (_, i) =>
                    Array.from({ length: 10 }, (_, j) => (
                      <circle
                        key={`${i}-${j}`}
                        cx={i * 21 + 5}
                        cy={j * 21 + 5}
                        r="1.5"
                        fill="#C9A96E"
                        opacity={Math.random() > 0.5 ? "0.6" : "0.2"}
                      />
                    ))
                  )}
                </svg>

                {/* Highlighted dots (service area) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="font-display text-5xl font-light text-gradient-gold mb-1">SE</div>
                    <div className="text-cream/30 text-xs uppercase tracking-widest font-body">United States</div>
                  </div>
                </div>

                {/* Pulsing center dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 rounded-full bg-gold/60 animate-pulse" />
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-gold/20 scale-150 animate-ping" />
                </div>
              </div>

              {/* City list */}
              <div className="flex flex-wrap gap-2">
                {cities.map((city, i) => (
                  <motion.span
                    key={city}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: i * 0.025 + 0.5, duration: 0.4 }}
                    className="px-3 py-1.5 text-xs font-body text-cream/60 border border-surface-border rounded-full bg-surface hover:border-gold/30 hover:text-gold/80 transition-colors duration-300 cursor-default"
                  >
                    {city}
                  </motion.span>
                ))}
                <span className="px-3 py-1.5 text-xs font-body text-gold/60 border border-gold/20 rounded-full bg-gold/5">
                  + more
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
