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
import AcquisitionAttribution from "@/components/AcquisitionAttribution";

// Spanish mobile keeps the same address-first form flow as English mobile.
export default function SpanishMobilePage() {
  const [heroAddress, setHeroAddress] = useState("");

  const handleHeroAddress = (address: string) => {
    setHeroAddress(address);
  };

  return (
    <>
      <AcquisitionAttribution lang="es" />
      <main className="bg-obsidian-900 min-h-screen">
        <NavMobile lang="es" />
        <HeroMobile onAddressSubmit={handleHeroAddress} lang="es" />
        <TrustStripMobile lang="es" />
        <HowItWorksMobile lang="es" />
        <PainChipsMobile lang="es" />
        <ComparisonMobile lang="es" />
        <TestimonialsMobile lang="es" />
        <LeadFormMobile prefillAddress={heroAddress} lang="es" />
        <FAQMobile lang="es" />
        <FinalCTAMobile lang="es" />
        <Footer lang="es" />
        <StickyCTA lang="es" />
      </main>
    </>
  );
}
