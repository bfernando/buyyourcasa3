import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BuyYourCasa — Oferta en Efectivo por tu Casa en 24 Horas",
  description:
    "Vendemos tu casa rápido, sin reparaciones, sin comisiones y sin estrés. Oferta en efectivo en 24 horas.",
};

export default function EsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
