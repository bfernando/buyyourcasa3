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

// Desktop funnel — voice agent renders as a full-screen shell on top of
// the SEO content. The content below is fully rendered (crawlable) but
// hidden behind the overlay until the user dismisses it via "Prefer to type?".
export default function Home() {
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  return (
    <>
      <main>
        <Navigation />
        <Hero />
        <TrustBar />
        <HowItWorks />
        <PainToRelief />
        <Comparison />
        <Testimonials />
        <ServiceArea />
        <FAQ />
        <LeadForm />
        <FinalCTA />
        <Footer />
      </main>

      {!overlayDismissed && (
        <VoiceAgent
          lang="en"
          shellMode
          onDismiss={() => setOverlayDismissed(true)}
          fallbackForm={<LeadForm />}
        />
      )}
    </>
  );
}
