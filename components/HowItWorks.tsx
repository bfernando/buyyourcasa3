"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Tell Us About Your Property",
    description:
      "Fill out our simple 2-minute form — just the basics. Property address, your contact info, and a few details about your situation. No inspection, no photos needed.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 3L4 8.5V20.5L14 26L24 20.5V8.5L14 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M14 14m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M14 3V14M14 14L4 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    time: "2 minutes",
  },
  {
    number: "02",
    title: "We Review & Reach Out",
    description:
      "Our team personally reviews your property details and reaches out within 24 hours. We may ask a few light follow-up questions — nothing invasive, no pressure.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 6.5h20v16H4z" rx="1.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M4 6.5l10 9 10-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="4" y="6.5" width="20" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    time: "Within 24 hours",
  },
  {
    number: "03",
    title: "Receive Your Cash Offer",
    description:
      "We present a clear, fair, all-cash offer — no lowballs, no games. Take your time to review it. If it works for you, we move forward. No obligation if it doesn't.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="7" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 12h22" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8.5" cy="18" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M13 17h8M13 19h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    time: "No obligation",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative py-28 lg:py-40 bg-obsidian-900 overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 opacity-40 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(201,169,110,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20 lg:mb-28"
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-px bg-gold/40" />
            <span className="text-gold/70 uppercase tracking-[0.25em] text-[11px] font-body">
              The Process
            </span>
            <div className="w-8 h-px bg-gold/40" />
          </div>
          <h2 className="font-display font-light text-cream mb-5" style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}>
            Three steps to a stress-free sale
          </h2>
          <p className="text-cream/50 font-body text-lg max-w-xl mx-auto font-light">
            We&apos;ve stripped out every unnecessary step so selling your home feels simple again.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line desktop */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-px">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-to-r from-transparent via-gold/30 to-transparent origin-left"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 32 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: i * 0.15 + 0.3,
                  duration: 0.9,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative flex flex-col items-center text-center lg:px-10"
              >
                {/* Step node */}
                <div className="relative mb-8">
                  {/* Outer ring */}
                  <div className="w-32 h-32 rounded-full border border-gold/20 flex items-center justify-center relative">
                    {/* Inner circle */}
                    <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center border border-gold/15 shadow-gold-sm">
                      <div className="text-gold">{step.icon}</div>
                    </div>
                    {/* Number */}
                    <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-gold flex items-center justify-center">
                      <span className="font-display text-obsidian-900 text-sm font-semibold leading-none">
                        {i + 1}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time badge */}
                <div className="mb-4 px-3 py-1 rounded-full border border-gold/20 bg-gold/5">
                  <span className="text-gold text-xs font-body uppercase tracking-widest">{step.time}</span>
                </div>

                <h3 className="font-display font-medium text-cream text-2xl mb-4">
                  {step.title}
                </h3>
                <p className="text-cream/50 font-body font-light text-base leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA nudge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-center mt-16 lg:mt-20"
        >
          <a href="#form" className="btn-gold px-8 py-4 rounded-sm inline-flex items-center gap-2.5 text-sm">
            Start With Your Address
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M8 3L13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <p className="text-cream/30 text-xs font-body mt-4 uppercase tracking-widest">No obligation · No spam · 100% free</p>
        </motion.div>
      </div>
    </section>
  );
}
