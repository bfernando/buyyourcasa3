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
import VoiceAgent from "@/components/VoiceAgent";

/**
 * Mobile Funnel Page — /m
 * Voice agent renders as a full-screen shell on top of the SEO content.
 * Address entered in hero is passed as prop to LeadFormMobile (fallback),
 * which prefills Step 1 and advances to Step 2 immediately.
 */

export default function MobilePage() {
  const [heroAddress, setHeroAddress] = useState("");
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  const handleHeroAddress = (address: string) => {
    setHeroAddress(address);
    // Scroll handled inside HeroMobile after calling this
  };

  return (
    <>
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

      {/* Voice agent overlay — full-screen, voice-first primary conversion path */}
      {!overlayDismissed && (
        <VoiceAgent
          lang="en"
          shellMode
          onDismiss={() => setOverlayDismissed(true)}
          fallbackForm={<LeadFormMobile prefillAddress={heroAddress} />}
        />
      )}
    </>
  );
}
