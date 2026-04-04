"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Why Us", href: "#comparison" },
    { label: "Reviews", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-obsidian-900/95 backdrop-blur-md border-b border-surface-border shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-sm bg-gold-gradient flex items-center justify-center">
              <span className="text-obsidian-900 font-display font-bold text-sm leading-none">B</span>
            </div>
            <span className="font-display text-xl font-medium text-cream tracking-wide">
              Buy<span className="text-gradient-gold">YourCasa</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-body uppercase tracking-widest text-cream/60 hover:text-gold transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <a
              href="#form"
              className="btn-gold px-6 py-2.5 rounded-sm inline-flex items-center gap-2"
            >
              Get My Cash Offer
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7H11M7 3L11 7L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 group"
            aria-label="Toggle menu"
          >
            <span className={clsx("block w-6 h-px bg-cream transition-all duration-300", menuOpen && "rotate-45 translate-y-[5px]")} />
            <span className={clsx("block w-4 h-px bg-cream/60 transition-all duration-300", menuOpen && "opacity-0 scale-x-0")} />
            <span className={clsx("block w-6 h-px bg-cream transition-all duration-300", menuOpen && "-rotate-45 -translate-y-[5px]")} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-obsidian-900/98 backdrop-blur-xl pt-20 px-8 md:hidden"
          >
            <div className="flex flex-col gap-6 py-8">
              {links.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 + 0.1 }}
                  onClick={() => setMenuOpen(false)}
                  className="text-2xl font-display text-cream/80 hover:text-gold transition-colors border-b border-surface-border pb-6"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="#form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => setMenuOpen(false)}
                className="btn-gold px-8 py-4 rounded-sm text-center mt-4"
              >
                Get My Cash Offer
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
