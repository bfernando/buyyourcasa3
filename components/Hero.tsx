"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
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
        <div className="absolute inset-0" style={{
          background: "linear-gradient(145deg, #FFFDF9 0%, #F6F1E9 42%, #ECE2D4 100%)"
        }} />

        <motion.div
          style={{ y, background: "radial-gradient(ellipse, rgba(13,109,102,0.16) 0%, transparent 65%)" }}
          className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full"
        />

        <motion.div
          style={{ y, background: "radial-gradient(ellipse, rgba(255,138,0,0.16) 0%, transparent 60%)" }}
          className="absolute top-1/3 -right-32 w-[700px] h-[700px] rounded-full"
        />

        <motion.div
          style={{ y, background: "radial-gradient(ellipse, rgba(181,149,99,0.18) 0%, transparent 60%)" }}
          className="absolute bottom-0 left-1/4 w-[600px] h-[500px] rounded-full"
        />

        <svg
          className="absolute inset-0 w-full h-full opacity-[0.10]"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="720" y1="0" x2="0" y2="900" stroke="#0D6D66" strokeWidth="0.5" />
          <line x1="720" y1="0" x2="1440" y2="900" stroke="#0D6D66" strokeWidth="0.5" />
          <line x1="720" y1="0" x2="240" y2="900" stroke="#0D6D66" strokeWidth="0.5" />
          <line x1="720" y1="0" x2="1200" y2="900" stroke="#0D6D66" strokeWidth="0.5" />
          <line x1="720" y1="0" x2="480" y2="900" stroke="#0D6D66" strokeWidth="0.4" />
          <line x1="720" y1="0" x2="960" y2="900" stroke="#0D6D66" strokeWidth="0.4" />
          <line x1="0" y1="300" x2="1440" y2="300" stroke="#B59563" strokeWidth="0.35" />
          <line x1="0" y1="600" x2="1440" y2="600" stroke="#B59563" strokeWidth="0.35" />
          <line x1="0" y1="150" x2="1440" y2="150" stroke="#B59563" strokeWidth="0.2" />
          <line x1="0" y1="450" x2="1440" y2="450" stroke="#B59563" strokeWidth="0.2" />
          <line x1="0" y1="750" x2="1440" y2="750" stroke="#B59563" strokeWidth="0.2" />
          {/* Vanishing point circle rings */}
          <circle cx="720" cy="0" r="300" stroke="#0D6D66" strokeWidth="0.2" />
          <circle cx="720" cy="0" r="500" stroke="#0D6D66" strokeWidth="0.15" />
          <circle cx="720" cy="0" r="700" stroke="#0D6D66" strokeWidth="0.1" />
        </svg>

        <div
          className="absolute inset-0 opacity-55"
          style={{
            background: `
              radial-gradient(circle at 78% 28%, rgba(255,255,255,0.74), transparent 26%),
              linear-gradient(135deg, rgba(255,253,249,0.72) 0%, rgba(246,241,233,0.38) 55%, rgba(231,221,208,0.46) 100%)
            `,
          }}
        />

        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[#F3EDE4] via-[#F3EDE4]/80 to-transparent" />

        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#FFFDF9]/70 to-transparent" />
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
        className="relative z-10 grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-24 mx-auto lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.75fr)] lg:px-10"
      >
        <div className="max-w-4xl lg:max-w-3xl">
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

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.85, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block"
        >
          <div className="relative overflow-hidden rounded-[28px] border border-surface-border bg-surface-card/90 p-6 shadow-form backdrop-blur">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/10" />
            <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-[#FF8A00]/10" />
            <div className="relative rounded-[22px] border border-surface-border bg-white/80 px-6 py-7">
              <Image
                src="/mi-casa-logo-cropped.png"
                alt="Mi Casa Investment Group"
                width={820}
                height={620}
                className="h-auto w-full"
                priority
              />
            </div>
            <div className="relative mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-sm border border-surface-border bg-surface px-4 py-3">
                <span className="block text-[10px] font-body uppercase tracking-[0.2em] text-cream/45">
                  Local
                </span>
                <strong className="mt-1 block font-display text-xl font-medium text-cream">
                  San Diego
                </strong>
              </div>
              <div className="rounded-sm border border-surface-border bg-surface px-4 py-3">
                <span className="block text-[10px] font-body uppercase tracking-[0.2em] text-cream/45">
                  Sin presión
                </span>
                <strong className="mt-1 block font-display text-xl font-medium text-cream">
                  Oferta clara
                </strong>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-surface-border pt-8 flex flex-wrap gap-8 lg:col-span-2 lg:gap-16"
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
