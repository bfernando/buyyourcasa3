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

export default function Home() {
  return (
    <main>
      {/* Sticky navigation */}
      <Navigation />

      {/* 1 ─── Hero — cinematic full-screen opener */}
      <Hero />

      {/* 2 ─── Trust bar — immediate credibility after hero */}
      <TrustBar />

      {/* 3 ─── How it works — reassures the process is easy */}
      <HowItWorks />

      {/* 4 ─── Pain → Relief — builds empathy and emotional connection */}
      <PainToRelief />

      {/* 5 ─── Comparison — logical justification for choosing us */}
      <Comparison />

      {/* 6 ─── Testimonials — social proof and trust reinforcement */}
      <Testimonials />

      {/* 7 ─── Service area — local trust signal */}
      <ServiceArea />

      {/* 8 ─── FAQ — removes friction and answers objections */}
      <FAQ />

      {/* 9 ─── Lead form — primary conversion point */}
      <LeadForm />

      {/* 10 ─── Final CTA — emotional close for any remaining visitors */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </main>
  );
}
