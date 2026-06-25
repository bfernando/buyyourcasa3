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

// Spanish funnel mirrors the English form-first flow. No AI voice overlay.
export default function SpanishHome() {
  return (
    <>
      <AcquisitionAttribution lang="es" />
      <main>
        <Navigation lang="es" />
        <LeadForm lang="es" />
        <TrustBar lang="es" />
        <HowItWorks lang="es" />
        <PainToRelief lang="es" />
        <Comparison lang="es" />
        <Testimonials lang="es" />
        <ServiceArea lang="es" />
        <FAQ lang="es" />
        <FinalCTA lang="es" />
        <Footer lang="es" />
      </main>
    </>
  );
}
