"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const situations = [
  {
    icon: "⚠",
    label: "Foreclosure Risk",
    description: "Behind on mortgage payments and running out of runway? A cash sale can close before the bank does — protecting your credit and your dignity.",
  },
  {
    icon: "🏚",
    label: "Inherited Property",
    description: "Inherited a home you don't need — or can't afford to maintain? We handle properties in any condition, in any estate situation.",
  },
  {
    icon: "✦",
    label: "Going Through Divorce",
    description: "When life changes, the house often needs to change too. We move quickly and discreetly so both parties can move forward.",
  },
  {
    icon: "🔑",
    label: "Tired Landlord",
    description: "Done managing tenants, repairs, and late rent? We buy tenant-occupied properties. No need to wait for them to leave.",
  },
  {
    icon: "🔧",
    label: "Major Repairs Needed",
    description: "Foundation issues. Old roof. Outdated systems. We buy homes as-is — you won't spend a dollar on repairs before closing.",
  },
  {
    icon: "↗",
    label: "Relocating Quickly",
    description: "New job, new city, new chapter. When timing matters, a certain cash sale beats months of uncertainty on the open market.",
  },
  {
    icon: "↓",
    label: "Downsizing",
    description: "Ready for a simpler life with less to manage? We make the transition seamless — fast close, no hassle, your timeline.",
  },
  {
    icon: "⬡",
    label: "Problem Property",
    description: "Fire damage, code violations, squatters, or a title issue? We've seen it all. We handle the complexity so you don't have to.",
  },
];

export default function PainToRelief() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative py-28 lg:py-40 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #08080C 0%, #0E0E14 50%, #08080C 100%)" }}
    >
      {/* Large subtle text background */}
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
        {/* Header */}
        <div className="max-w-3xl mb-16 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-3 mb-5"
          >
            <div className="w-8 h-px bg-gold/40" />
            <span className="text-gold/70 uppercase tracking-[0.25em] text-[11px] font-body">
              We Understand Your Situation
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-light text-cream mb-6"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
          >
            Life doesn&apos;t wait for the{" "}
            <span className="italic text-gradient-gold">perfect market</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-cream/50 font-body font-light text-lg leading-relaxed"
          >
            Whether you&apos;re navigating a difficult chapter or simply need to move on quickly,
            we meet you where you are — without judgment, without pressure.
          </motion.p>
        </div>

        {/* Situations grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-surface-border/50 border border-surface-border/50">
          {situations.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                delay: i * 0.06 + 0.3,
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative bg-obsidian-900 p-8 lg:p-9 flex flex-col gap-4 hover:bg-surface transition-all duration-500 cursor-default"
            >
              {/* Gold top accent on hover */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

              <div className="text-xl opacity-60 group-hover:opacity-90 transition-opacity duration-300">{item.icon}</div>
              <h3 className="font-display text-xl text-cream font-medium group-hover:text-gradient-gold transition-colors duration-300">
                {item.label}
              </h3>
              <p className="text-cream/45 text-sm font-body font-light leading-relaxed group-hover:text-cream/60 transition-colors duration-300">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Empathy closer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-14 text-center"
        >
          <p className="text-cream/40 font-body font-light text-base max-w-lg mx-auto mb-8">
            Whatever your situation, you deserve a dignified, simple path forward.
            We offer one — no strings attached.
          </p>
          <a href="#form" className="btn-outline px-8 py-3.5 rounded-sm inline-flex items-center gap-2 text-sm">
            Tell Us About Your Property
          </a>
        </motion.div>
      </div>
    </section>
  );
}
