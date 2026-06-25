"use client";

import Navigation from "@/components/Navigation";
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
import AcquisitionAttribution from "@/components/AcquisitionAttribution";

// English funnel — form-first for email and ad traffic. The address-first
// wizard is the primary conversion path; no AI voice overlay on English routes.
export default function Home() {
  return (
    <>
      <AcquisitionAttribution lang="en" />
      <main>
        <Navigation />
        <LeadForm />
        <TrustBar />
        <HowItWorks />
        <PainToRelief />
        <Comparison />
        <Testimonials />
        <ServiceArea />
        <FAQ />
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
