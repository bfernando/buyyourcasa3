"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * StickyCTA
 * ─────────
 * UX rationale: The sticky CTA ensures "Get My Cash Offer" is always one
 * thumb-tap away regardless of where the user is in the scroll journey.
 * It hides when: (a) the hero CTA is visible, (b) the form section is visible —
 * so it never competes with the primary conversion UI.
 * Bottom placement = thumb zone on both iOS and Android.
 */
export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let rafId: number;

    const check = () => {
      const hero = document.getElementById("mobile-hero");
      const form = document.getElementById("mobile-form");

      const heroBottom = hero?.getBoundingClientRect().bottom ?? 0;
      const formTop = form?.getBoundingClientRect().top ?? 9999;
      const winH = window.innerHeight;

      // Show when hero is scrolled past AND form is not yet in view
      const pastHero = heroBottom < winH * 0.5;
      const formVisible = formTop < winH * 0.85;

      setVisible(pastHero && !formVisible);
    };

    const onScroll = () => {
      rafId = requestAnimationFrame(check);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    check();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 38 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] pt-3 bg-obsidian-900/95 backdrop-blur-md border-t border-surface-border"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
        >
          <div className="flex items-center gap-3 max-w-sm mx-auto">
            {/* Click-to-call */}
            {/* Replace href with your real phone number */}
            <a
              href="tel:+15550001234"
              className="shrink-0 w-12 h-12 rounded-sm border border-surface-border bg-surface flex items-center justify-center text-gold/70 hover:text-gold hover:border-gold/30 transition-colors"
              aria-label="Call us"
              style={{ touchAction: "manipulation" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16.5 13.2l-2.6-2.5c-.5-.5-1.3-.5-1.8 0l-1 1c-1-.9-2.4-2.2-3.2-3.4l1-.9c.5-.5.5-1.3 0-1.8L6.3 3.1c-.5-.5-1.3-.5-1.8 0L3.6 4c-.9 1-1.5 3.7 1.6 7 3 3.2 5.8 2.5 6.7 1.6l.9-.9c.5-.5.5-1.3-.3-2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>

            {/* Primary CTA */}
            <a
              href="#mobile-form"
              className="btn-gold flex-1 h-12 rounded-sm flex items-center justify-center gap-2 text-sm font-body font-semibold tracking-wide uppercase"
              style={{ touchAction: "manipulation" }}
            >
              Get My Cash Offer
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
