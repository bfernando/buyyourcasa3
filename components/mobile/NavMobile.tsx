"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

/**
 * NavMobile
 * ──────────
 * Minimal top nav. Logo left, phone right (click-to-call).
 * No hamburger menu on mobile funnel — adds friction without value.
 * Becomes slightly opaque on scroll to stay readable.
 */
export default function NavMobile() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-5 transition-all duration-400",
        scrolled
          ? "bg-obsidian-900/96 backdrop-blur-md border-b border-surface-border"
          : "bg-transparent"
      )}
    >
      {/* Logo */}
      <a href="/" className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-[3px] bg-gold-gradient flex items-center justify-center">
          <span className="text-obsidian-900 font-display font-bold text-xs leading-none">B</span>
        </div>
        <span className="font-display text-lg font-medium text-cream">
          Buy<span className="text-gradient-gold">YourCasa</span>
        </span>
      </a>

      {/* Click-to-call — high value on mobile */}
      <a
        href="tel:+15550001234"
        className="flex items-center gap-1.5 text-gold/70 hover:text-gold transition-colors"
        style={{ touchAction: "manipulation", minHeight: 44 }}
        aria-label="Call us"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.2 10.6l-2.1-2c-.4-.4-1-.4-1.4 0l-.8.8c-.8-.7-1.9-1.8-2.6-2.7l.8-.7c.4-.4.4-1 0-1.4L5 2.5c-.4-.4-1-.4-1.4 0l-.8.8c-.7.8-1.2 2.9 1.3 5.6 2.4 2.6 4.6 2 5.4 1.3l.7-.7c.4-.4.4-1-.3-2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <span className="text-xs font-body font-medium">(555) 000-1234</span>
      </a>
    </motion.nav>
  );
}
