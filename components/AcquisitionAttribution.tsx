"use client";

import { useEffect } from "react";
import { reportPropertyAcquisitionFunnelVisit } from "@/lib/property-acquisition-attribution-client";
import { type Locale } from "@/lib/content";

export default function AcquisitionAttribution({ lang = "en" }: { lang?: Locale }) {
  useEffect(() => {
    reportPropertyAcquisitionFunnelVisit(lang);
  }, [lang]);

  return null;
}
