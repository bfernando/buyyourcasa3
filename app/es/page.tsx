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

export const metadata = {
  title: "BuyYourCasa — Oferta en Efectivo por tu Casa en 24 Horas",
  description: "Vendemos tu casa rápido, sin reparaciones, sin comisiones y sin estrés. Oferta en efectivo en 24 horas.",
};

export default function SpanishHome() {
  return (
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
  );
}
