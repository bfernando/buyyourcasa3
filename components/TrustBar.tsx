"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { content, Locale } from "@/lib/content";

const itemIcons = [
  <svg key="star" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.99 18L10 15.27L5 18L5.99 12.14L2 8.27L7.91 7.26L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>,
  <svg key="clock" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 6v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  <svg key="arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  <svg key="check" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M4 10l5 5 9-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  <svg key="cal" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="3" y="5" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 9h14M7 5V3M13 5V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  <svg key="pin" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2C6.13 2 3 5.13 3 9c0 5.25 7 11 7 11s7-5.75 7-11c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>,
];

export default function TrustBar({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].trustBar;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative py-16 bg-surface border-y border-surface-border overflow-hidden"
    >
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-xs uppercase tracking-[0.25em] text-gold/60 font-body">
            {c.sectionLabel}
          </span>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-surface-border">
          {c.items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface flex flex-col items-center text-center px-4 py-6 gap-3 group hover:bg-surface-hover transition-colors duration-300"
            >
              <div className="text-gold/70 group-hover:text-gold transition-colors duration-300">
                {itemIcons[i]}
              </div>
              <div>
                <p className="text-cream/90 text-sm font-medium font-body leading-tight mb-1">
                  {item.label}
                </p>
                <p className="text-cream/35 text-xs font-body">{item.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-10 pt-8 border-t border-surface-border"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#C9A96E">
                  <path d="M7 1l1.63 3.3 3.63.53-2.63 2.56.62 3.62L7 9.27l-3.25 1.74.62-3.62L1.74 4.83l3.63-.53L7 1z"/>
                </svg>
              ))}
            </div>
            <span className="text-cream/60 text-sm font-body">{c.ratingText}</span>
          </div>

          <div className="w-px h-4 bg-surface-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L2 3.5v5.5c0 3.04 2.59 5.44 6 6.5 3.41-1.06 6-3.46 6-6.5V3.5L8 1z" stroke="#C9A96E" strokeWidth="1.2" fill="rgba(201,169,110,0.08)"/>
              <path d="M5.5 8l2 2 3-3" stroke="#C9A96E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-cream/50 text-sm font-body">{c.badge1}</span>
          </div>

          <div className="w-px h-4 bg-surface-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="#C9A96E" strokeWidth="1.2"/>
              <path d="M5.5 8l2 2 3-3" stroke="#C9A96E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-cream/50 text-sm font-body">{c.badge2}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
