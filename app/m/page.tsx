"use client";

import { useState } from "react";
import NavMobile from "@/components/mobile/NavMobile";
import HeroMobile from "@/components/mobile/HeroMobile";
import TrustStripMobile from "@/components/mobile/TrustStripMobile";
import HowItWorksMobile from "@/components/mobile/HowItWorksMobile";
import PainChipsMobile from "@/components/mobile/PainChipsMobile";
import ComparisonMobile from "@/components/mobile/ComparisonMobile";
import TestimonialsMobile from "@/components/mobile/TestimonialsMobile";
import FAQMobile from "@/components/mobile/FAQMobile";
import LeadFormMobile from "@/components/mobile/LeadFormMobile";
import FinalCTAMobile from "@/components/mobile/FinalCTAMobile";
import StickyCTA from "@/components/mobile/StickyCTA";
import Footer from "@/components/Footer";

/**
 * Mobile Funnel Page — /m
 * ────────────────────────
 * Funnel order (mobile-optimized):
 *
 * 1. Hero        — Address input as step 1 of the form (zero friction entry)
 * 2. Trust strip — Immediate credibility before they scroll further
 * 3. How it works — Reassure the process is simple
 * 4. Pain chips  — Pattern recognition (they see themselves)
 * 5. Comparison  — Rational justification for the emotional decision
 * 6. Testimonials — Social proof at the peak of consideration
 * 7. Form        — Primary conversion point (preceded by maximum trust-building)
 * 8. FAQ         — Last objection removal for hesitators
 * 9. Final CTA   — Emotional close for anyone who scrolled past the form
 *
 * Key architecture decision:
 * Address entered in hero is passed as prop to LeadFormMobile,
 * which prefills Step 1 and advances to Step 2 immediately.
 * This "hero-as-step-1" pattern reduces perceived form length and
 * increases mobile form completion by starting the journey earlier.
 */

export default function MobilePage() {
  const [heroAddress, setHeroAddress] = useState("");

  const handleHeroAddress = (address: string) => {
    setHeroAddress(address);
    // Scroll handled inside HeroMobile after calling this
  };

  return (
    <main className="bg-obsidian-900 min-h-screen">
      {/* Sticky top nav */}
      <NavMobile />

      {/* 1 — Hero: above-fold everything */}
      <HeroMobile onAddressSubmit={handleHeroAddress} />

      {/* 2 — Trust strip: credibility immediately after scroll */}
      <TrustStripMobile />

      {/* 3 — How it works: process reassurance */}
      <HowItWorksMobile />

      {/* 4 — Pain chips: pattern recognition / empathy */}
      <PainChipsMobile />

      {/* 5 — Comparison: rational justification */}
      <ComparisonMobile />

      {/* 6 — Testimonials: social proof */}
      <TestimonialsMobile />

      {/* 7 — FORM: primary conversion point */}
      <LeadFormMobile prefillAddress={heroAddress} />

      {/* 8 — FAQ: objection removal for hesitators */}
      <FAQMobile />

      {/* 9 — Final CTA: last emotional push */}
      <FinalCTAMobile />

      {/* Footer */}
      <Footer />

      {/* Sticky bottom CTA — always accessible */}
      <StickyCTA />
    </main>
  );
}
