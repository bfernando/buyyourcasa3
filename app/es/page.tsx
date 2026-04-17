"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import HowItWorks from "@/components/HowItWorks";
import PainToRelief from "@/components/PainToRelief";
import Comparison from "@/components/Comparison";
import Testimonials from "@/components/Testimonials";
import ServiceArea from "@/components/ServiceArea";
import FAQ from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import VoiceAgent from "@/components/VoiceAgent";

export default function SpanishHome() {
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  return (
    <>
      <main>
        <Navigation lang="es" />
        <Hero lang="es" />
        <TrustBar lang="es" />
        <HowItWorks lang="es" />
        <PainToRelief lang="es" />
        <Comparison lang="es" />
        <Testimonials lang="es" />
        <ServiceArea lang="es" />
        <FAQ lang="es" />
        <LeadForm lang="es" />
        <FinalCTA lang="es" />
        <Footer />
      </main>

      {!overlayDismissed && (
        <VoiceAgent
          lang="es"
          shellMode
          onDismiss={() => setOverlayDismissed(true)}
          fallbackForm={<LeadForm lang="es" />}
        />
      )}
    </>
  );
}
