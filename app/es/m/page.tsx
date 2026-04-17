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

export default function SpanishMobilePage() {
  const [heroAddress, setHeroAddress] = useState("");
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  const handleHeroAddress = (address: string) => {
    setHeroAddress(address);
  };

  return (
    <>
      <main className="bg-obsidian-900 min-h-screen">
        <NavMobile lang="es" />
        <HeroMobile onAddressSubmit={handleHeroAddress} lang="es" />
        <TrustStripMobile />
        <HowItWorksMobile lang="es" />
        <PainChipsMobile lang="es" />
        <ComparisonMobile lang="es" />
        <TestimonialsMobile lang="es" />
        <LeadFormMobile prefillAddress={heroAddress} lang="es" />
        <FAQMobile lang="es" />
        <FinalCTAMobile lang="es" />
        <Footer />
        <StickyCTA lang="es" />
      </main>

      {!overlayDismissed && (
        <VoiceAgent
          lang="es"
          shellMode
          onDismiss={() => setOverlayDismissed(true)}
          fallbackForm={<LeadFormMobile prefillAddress={heroAddress} lang="es" />}
        />
      )}
    </>
  );
}
