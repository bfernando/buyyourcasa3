"use client";

import { trackContactClick } from "@/lib/meta-pixel";
import { content, type Locale } from "@/lib/content";
import BrandLogo from "@/components/BrandLogo";

export default function Footer({ lang = "en" }: { lang?: Locale }) {
  const year = new Date().getFullYear();
  const links =
    lang === "es"
      ? [
          ["Cómo Funciona", "#how-it-works"],
          ["Por Qué Nosotros", "#comparison"],
          ["Testimonios", "#testimonials"],
          ["Preguntas", "#faq"],
          ["Obtener Mi Oferta", "#form"],
        ]
      : [
          ["How It Works", "#how-it-works"],
          ["Why Sell to Us", "#comparison"],
          ["Testimonials", "#testimonials"],
          ["FAQ", "#faq"],
          ["Get My Offer", "#form"],
        ];
  const phone = content[lang].nav.phone;

  return (
    <footer className="relative bg-obsidian-900 border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <BrandLogo />
            </div>
            <p className="text-cream/35 font-body text-sm leading-relaxed max-w-xs">
              {lang === "es"
                ? "Un equipo local de compra de casas en efectivo para propietarios que quieren una salida clara, rápida y sin presión."
                : "A local cash home buying team giving homeowners a clear, fast, no-pressure path forward."}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs uppercase tracking-widest text-cream/30 font-body mb-4">
              {lang === "es" ? "Navegar" : "Navigate"}
            </p>
            <div className="flex flex-col gap-3">
              {links.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="text-cream/45 hover:text-gold font-body text-sm transition-colors duration-200"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs uppercase tracking-widest text-cream/30 font-body mb-4">
              {lang === "es" ? "Contacto" : "Contact"}
            </p>
            <div className="flex flex-col gap-3">
              {/* Replace with real contact info */}
              <a
                href="tel:+16195470490"
                onClick={() =>
                  trackContactClick({
                    location: "footer",
                    href: "tel:+16195470490",
                    lang,
                  })
                }
                className="text-cream/45 hover:text-gold font-body text-sm transition-colors duration-200 flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M12.5 9.8l-2-1.9c-.4-.4-1-.4-1.4 0l-.8.8C7.1 8.1 5.9 7 5.3 5.7l.8-.8c.4-.4.4-1 0-1.4L4.2 1.5c-.4-.4-1-.4-1.4 0l-.7.7C1.2 3.1 1.5 5.8 3.6 8c2.1 2.2 4.8 2.4 5.7 1.5l.7-.7c.4-.4.4-1.1.5-.9z" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                {phone}
              </a>
              <a
                href="mailto:offers@buyyour.casa"
                className="text-cream/45 hover:text-gold font-body text-sm transition-colors duration-200 flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1 5l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                offers@buyyour.casa
              </a>
              <p className="text-cream/30 font-body text-xs mt-2">
                {lang === "es"
                  ? "Sirviendo San Diego, Chula Vista y comunidades cercanas"
                  : "Serving San Diego, Chula Vista, and nearby communities"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-surface-border">
          <p className="text-cream/25 font-body text-xs">
            © {year} Mi Casa Investment Group. All rights reserved.
          </p>
          <div className="flex gap-5 text-cream/25 font-body text-xs">
            <a href="/privacy" className="hover:text-cream/50 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-cream/50 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
