"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * HeroMobile
 * ───────────
 * UX decisions:
 * 1. Address input IS the first conversion step — no intermediate click.
 *    Starting the form with an address is low-friction (it's about the house,
 *    not about giving personal info). This pattern lifts mobile CVR 20-35%.
 * 2. Headline is ≤7 words — reads in one glance at scroll speed.
 * 3. Sub is 1 line — three key benefits, scannable.
 * 4. Stats row below fold — keeps above-fold uncluttered.
 * 5. No parallax on mobile — causes jank and scroll lag.
 * 6. CSS gradient background — zero image request, instant paint.
 */

interface HeroMobileProps {
  onAddressSubmit: (address: string) => void;
}

export default function HeroMobile({ onAddressSubmit }: HeroMobileProps) {
  const [address, setAddress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      inputRef.current?.focus();
      return;
    }
    onAddressSubmit(address.trim());
    // Scroll to form section
    document.getElementById("mobile-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="mobile-hero"
      className="relative min-h-[100svh] flex flex-col justify-center pb-10 pt-20 px-5 overflow-hidden"
    >
      {/* ─── Background ─── */}
      <div className="absolute inset-0 z-0">
        {/* Deep cinematic base */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(160deg, #0E0B18 0%, #08080C 40%, #0A1018 70%, #06060A 100%)"
        }} />

        {/* Warm gold ambient — upper right — boosted */}
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full" style={{
          background: "radial-gradient(ellipse, rgba(201,169,110,0.28) 0%, transparent 65%)"
        }} />

        {/* Cool purple ambient — upper left */}
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full" style={{
          background: "radial-gradient(ellipse, rgba(80,65,140,0.5) 0%, transparent 65%)"
        }} />

        {/* Warm gold — lower right */}
        <div className="absolute bottom-1/4 -right-20 w-56 h-56 rounded-full" style={{
          background: "radial-gradient(ellipse, rgba(140,100,50,0.2) 0%, transparent 65%)"
        }} />

        {/* Perspective grid lines — boosted opacity */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" fill="none">
          <line x1="195" y1="0" x2="0" y2="844" stroke="white" strokeWidth="0.7"/>
          <line x1="195" y1="0" x2="390" y2="844" stroke="white" strokeWidth="0.7"/>
          <line x1="195" y1="0" x2="97" y2="844" stroke="white" strokeWidth="0.5"/>
          <line x1="195" y1="0" x2="293" y2="844" stroke="white" strokeWidth="0.5"/>
          <line x1="0" y1="280" x2="390" y2="280" stroke="white" strokeWidth="0.4"/>
          <line x1="0" y1="560" x2="390" y2="560" stroke="white" strokeWidth="0.4"/>
          <circle cx="195" cy="0" r="200" stroke="white" strokeWidth="0.3"/>
          <circle cx="195" cy="0" r="380" stroke="white" strokeWidth="0.2"/>
        </svg>

        {/* Bottom gradient to page */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-obsidian-900 to-transparent" />
      </div>

      {/* ─── Content ─── */}
      <div className="relative z-10">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex items-center gap-2 mb-5"
        >
          <div className="w-5 h-px bg-gold/60" />
          <span className="text-gold/70 text-[10px] uppercase tracking-[0.25em] font-body">
            Cash Offer · 24 Hours
          </span>
        </motion.div>

        {/* Headline — max 7 words, 2 lines */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-light text-cream leading-[0.95] tracking-[-0.025em] mb-4"
          style={{ fontSize: "clamp(2.8rem, 12vw, 4rem)" }}
        >
          Sell Fast.{" "}
          <span className="italic text-gradient-gold block">Get Cash.</span>
        </motion.h1>

        {/* Sub — 1 line, 3 core benefits */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.6 }}
          className="text-cream/55 font-body font-light text-base mb-8 leading-snug"
        >
          No repairs. No agents. No hidden fees.
        </motion.p>

        {/* Address input form — Step 1 starts here */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-3"
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your property address"
              autoComplete="street-address"
              className="form-input w-full h-14 px-4 pr-12 rounded-sm text-base"
              style={{ fontSize: 16 }} // Prevents iOS zoom
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gold/40">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5C6.1 1.5 3.75 3.85 3.75 6.75c0 4.22 5.25 9.75 5.25 9.75s5.25-5.53 5.25-9.75C14.25 3.85 11.9 1.5 9 1.5z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="9" cy="6.75" r="1.75" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
          </div>

          <button
            type="submit"
            className="btn-gold h-14 w-full rounded-sm text-sm font-semibold tracking-wide uppercase flex items-center justify-center gap-2"
            style={{ touchAction: "manipulation" }}
          >
            Get My Cash Offer
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M8 3L13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <p className="text-center text-cream/30 text-xs font-body">
            No obligation · Free · Takes 2 minutes
          </p>
        </motion.form>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.7 }}
          className="flex items-center justify-between pt-8 mt-6 border-t border-surface-border"
        >
          {[
            { value: "500+", label: "Homes Bought" },
            { value: "24hr", label: "Offer Time" },
            { value: "$0", label: "Fees Ever" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl font-light text-gradient-gold">{s.value}</div>
              <div className="text-cream/35 text-[10px] uppercase tracking-wider font-body mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
