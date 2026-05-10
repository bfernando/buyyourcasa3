import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Casa Investment Group — Oferta en Efectivo por tu Casa",
  description:
    "Compra local de casas en San Diego y Chula Vista. Vende rápido, sin reparaciones, sin comisiones y sin estrés.",
};

export default function EsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
