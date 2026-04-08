"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { content, Locale } from "@/lib/content";

export default function Hero({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].hero;
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {/* ─── Background layer ─── */}
      <div className="absolute inset-0 z-0">
        {/* Base dark gradient */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(160deg, #0E0B1A 0%, #08080C 35%, #0A1018 65%, #060608 100%)"
        }} />

        {/* Cinematic ambient glow - upper left — increased opacity */}
        <motion.div
          style={{ y, background: "radial-gradient(ellipse, rgba(80,65,140,0.55) 0%, transparent 65%)" }}
          className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full"
        />

        {/* Gold glow - right center — increased opacity */}
        <motion.div
          style={{ y, background: "radial-gradient(ellipse, rgba(201,169,110,0.18) 0%, transparent 60%)" }}
          className="absolute top-1/3 -right-32 w-[700px] h-[700px] rounded-full"
        />

        {/* Warm gold glow - lower left */}
        <motion.div
          style={{ y, background: "radial-gradient(ellipse, rgba(140,100,50,0.12) 0%, transparent 60%)" }}
          className="absolute bottom-0 left-1/4 w-[600px] h-[500px] rounded-full"
        />

        {/* Abstract architectural lines - SVG overlay — increased opacity */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="720" y1="0" x2="0" y2="900" stroke="white" strokeWidth="0.5" />
          <line x1="720" y1="0" x2="1440" y2="900" stroke="white" strokeWidth="0.5" />
          <line x1="720" y1="0" x2="240" y2="900" stroke="white" strokeWidth="0.5" />
          <line x1="720" y1="0" x2="1200" y2="900" stroke="white" strokeWidth="0.5" />
          <line x1="720" y1="0" x2="480" y2="900" stroke="white" strokeWidth="0.4" />
          <line x1="720" y1="0" x2="960" y2="900" stroke="white" strokeWidth="0.4" />
          <line x1="0" y1="300" x2="1440" y2="300" stroke="white" strokeWidth="0.35" />
          <line x1="0" y1="600" x2="1440" y2="600" stroke="white" strokeWidth="0.35" />
          <line x1="0" y1="150" x2="1440" y2="150" stroke="white" strokeWidth="0.2" />
          <line x1="0" y1="450" x2="1440" y2="450" stroke="white" strokeWidth="0.2" />
          <line x1="0" y1="750" x2="1440" y2="750" stroke="white" strokeWidth="0.2" />
          {/* Vanishing point circle rings */}
          <circle cx="720" cy="0" r="300" stroke="white" strokeWidth="0.2" />
          <circle cx="720" cy="0" r="500" stroke="white" strokeWidth="0.15" />
          <circle cx="720" cy="0" r="700" stroke="white" strokeWidth="0.1" />
        </svg>

        {/* Hero image overlay — replace this URL with your own premium image */}
        {/* Using CSS gradient as placeholder for a dark luxury architectural photo */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              linear-gradient(135deg, #1a1025 0%, #0d0d18 30%, #0a1520 60%, #080c14 100%)
            `,
          }}
        />

        {/* Bottom gradient fade to page */}
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[#08080C] via-[#08080C]/80 to-transparent" />

        {/* Subtle top vignette */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#08080C]/60 to-transparent" />
      </div>

      {/* ─── Animated accent lines ─── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Thin horizontal gold lines */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 1.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent origin-left"
        />
        {/* Vertical accent left */}
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: 1.6, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/10 to-transparent origin-top"
        />
      </div>

      {/* ─── Hero content ─── */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full pt-24 pb-16"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-8 h-px bg-gold/60" />
          <span className="text-gold/80 uppercase tracking-[0.25em] text-[11px] font-body font-medium">
            {c.eyebrow}
          </span>
        </motion.div>

        {/* Main headline */}
        <div className="max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-light leading-[0.95] tracking-[-0.03em] mb-6"
            style={{ fontSize: "clamp(3.2rem, 8vw, 7rem)" }}
          >
            <span className="block text-cream">{c.lines[0]}</span>
            <span className="block text-cream">{c.lines[1]}</span>
            <span className="block text-gradient-gold italic">{c.lines[2]}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-cream/60 font-body font-light leading-relaxed max-w-xl mb-10"
            style={{ fontSize: "clamp(1rem, 1.8vw, 1.2rem)" }}
          >
            {c.sub}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#form"
              className="btn-gold px-8 py-4 rounded-sm inline-flex items-center justify-center gap-2.5 text-sm"
            >
              {c.cta}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M8 3L13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a
              href="#how-it-works"
              className="btn-outline px-8 py-4 rounded-sm inline-flex items-center justify-center gap-2.5 text-sm"
            >
              {c.secondaryCta}
            </a>
          </motion.div>
        </div>

        {/* Bottom stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 pt-8 border-t border-surface-border flex flex-wrap gap-8 lg:gap-16"
        >
          {c.stats.map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-3xl font-light text-gradient-gold">{stat.value}</div>
              <div className="text-xs text-cream/40 uppercase tracking-widest mt-1 font-body">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 right-8 z-10 hidden lg:flex flex-col items-center gap-3"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-cream/30 font-body rotate-90 origin-center translate-x-4">Scroll</span>
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
      </motion.div>
    </section>
  );
}
