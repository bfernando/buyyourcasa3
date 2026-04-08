"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { content, Locale } from "@/lib/content";

export default function FinalCTAMobile({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].finalCta;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      className="relative py-20 px-5 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #08080C 0%, #0D0D16 50%, #08080C 100%)",
        paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 60%, rgba(201,169,110,0.09) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.7 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="w-10 h-px bg-gold/35" />
          <div className="w-2 h-2 rounded-full bg-gold/50" />
          <div className="w-10 h-px bg-gold/35" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-light text-cream leading-[0.95] tracking-[-0.025em] mb-4"
          style={{ fontSize: "clamp(2.8rem, 11vw, 4rem)" }}
        >
          {c.headline}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="font-display italic text-gradient-gold text-3xl mb-7"
        >
          {c.headlineItalic}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-cream/45 font-body font-light text-base leading-relaxed mb-9 max-w-xs mx-auto"
        >
          {c.sub}
        </motion.p>

        <motion.a
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.7 }}
          href="#mobile-form"
          className="btn-gold w-full h-14 rounded-sm flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide mx-auto"
          style={{ touchAction: "manipulation" }}
        >
          {c.cta}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M8 3L13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.a>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col gap-1 mt-6 text-cream/20 text-[10px] font-body uppercase tracking-widest"
        >
          {c.micros.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
