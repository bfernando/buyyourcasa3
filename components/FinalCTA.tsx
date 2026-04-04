"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative py-32 lg:py-48 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #08080C 0%, #0C0C12 50%, #08080C 100%)" }}
    >
      {/* Cinematic glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 60%, rgba(201,169,110,0.09) 0%, transparent 65%)",
        }}
      />

      {/* Architectural line decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/12 to-transparent origin-left"
        />
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/8 to-transparent origin-right"
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex items-center justify-center gap-3 mb-7"
        >
          <div className="w-12 h-px bg-gold/40" />
          <div className="w-2 h-2 rounded-full bg-gold/60" />
          <div className="w-12 h-px bg-gold/40" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-light text-cream mb-6 leading-[0.95]"
          style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}
        >
          The offer is waiting.
          <br />
          <span className="italic text-gradient-gold">The next step is yours.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25, duration: 0.9 }}
          className="text-cream/50 font-body font-light text-lg leading-relaxed max-w-xl mx-auto mb-12"
        >
          No obligation. No rush. Just a fair cash offer from a team that genuinely
          respects your time, your situation, and your home.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#form"
            className="btn-gold px-10 py-4.5 rounded-sm inline-flex items-center gap-3 text-sm"
            style={{ paddingTop: "1.1rem", paddingBottom: "1.1rem" }}
          >
            Get My Free Cash Offer
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M8 3L13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-10 text-cream/25 text-xs font-body uppercase tracking-widest"
        >
          <span>No obligation</span>
          <span className="w-1 h-1 rounded-full bg-gold/30" />
          <span>No repairs needed</span>
          <span className="w-1 h-1 rounded-full bg-gold/30" />
          <span>No agent fees</span>
          <span className="w-1 h-1 rounded-full bg-gold/30" />
          <span>Close in 7 days</span>
        </motion.div>
      </div>
    </section>
  );
}
