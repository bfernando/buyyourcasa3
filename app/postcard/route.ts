import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { notifyPropertyAcquisitionEngine } from "@/lib/property-acquisition";

const POSTCARD_CAMPAIGN = "english_postcard_may2026";

export const dynamic = "force-dynamic";

function firstParam(req: NextRequest, key: string, fallback: string) {
  return req.nextUrl.searchParams.get(key)?.trim() || fallback;
}

export async function GET(req: NextRequest) {
  const scanId = randomUUID();
  const campaign = firstParam(req, "campaign", POSTCARD_CAMPAIGN);
  const content = firstParam(req, "content", "qr");
  const attribution = {
    utm_source: "postcard",
    utm_medium: "print",
    utm_campaign: campaign,
    utm_content: content,
    scan_id: scanId,
    lang: "en",
    page_url: req.url,
    referrer: req.headers.get("referer") ?? undefined,
  };

  console.warn("[postcard-qr-scan]", {
    scanId,
    campaign,
    content,
    ipCountry: req.headers.get("x-vercel-ip-country"),
    ipRegion: req.headers.get("x-vercel-ip-country-region"),
    ipCity: req.headers.get("x-vercel-ip-city"),
    userAgent: req.headers.get("user-agent"),
  });

  await notifyPropertyAcquisitionEngine({
    eventType: "postcard_qr_scan",
    attribution,
    extra: {
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for"),
    },
  });

  const destination = new URL("/m", req.url);
  destination.searchParams.set("utm_source", attribution.utm_source);
  destination.searchParams.set("utm_medium", attribution.utm_medium);
  destination.searchParams.set("utm_campaign", attribution.utm_campaign);
  destination.searchParams.set("utm_content", attribution.utm_content);
  destination.searchParams.set("scan_id", attribution.scan_id);

  return NextResponse.redirect(destination, 307);
}
