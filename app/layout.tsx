import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuyYourCasa — Fair Cash Offers for Your Home",
  description:
    "Get a fair, all-cash offer for your home in 24 hours. No repairs, no agents, no fees. Close on your schedule. Serving homeowners across the region.",
  keywords:
    "sell house fast cash, cash home buyers, sell house as-is, no repairs needed, cash offer home",
  openGraph: {
    title: "BuyYourCasa — Fair Cash Offers for Your Home",
    description:
      "Skip the repairs, the agents, and the uncertainty. Get a fair cash offer in 24 hours and close on your timeline.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08080C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-obsidian-900 text-cream antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
