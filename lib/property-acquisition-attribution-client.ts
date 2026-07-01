"use client";

export type PropertyAcquisitionAttribution = {
  mc_lead_id?: string;
  mc_token?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  scan_id?: string;
  lang?: string;
  page_url?: string;
  referrer?: string;
};

const TEMPLATE_CODE_TO_NAME: Record<string, string> = {
  ia: "acquisition_initial_a",
  ib: "acquisition_initial_b",
  ic: "acquisition_initial_c",
  f1a: "acquisition_followup_1_a",
  f1b: "acquisition_followup_1_b",
  f1c: "acquisition_followup_1_c",
  f2a: "acquisition_followup_2_a",
  f2b: "acquisition_followup_2_b",
  f2c: "acquisition_followup_2_c",
};

function firstParam(params: URLSearchParams, ...keys: string[]) {
  for (const key of keys) {
    const value = params.get(key);
    if (value) return value;
  }
  return undefined;
}

function expandTemplateCode(value?: string) {
  if (!value) return undefined;
  return TEMPLATE_CODE_TO_NAME[value] ?? value;
}

function slugPart(value?: string, maxLength = 32) {
  if (!value) return undefined;
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");

  return slug || undefined;
}

function isMetaTraffic(...values: Array<string | undefined>) {
  return values.some((value) => {
    const slug = slugPart(value, 64);
    return Boolean(
      slug &&
        (slug.includes("facebook") ||
          slug.includes("meta") ||
          slug.includes("instagram") ||
          slug === "fb" ||
          slug === "ig" ||
          slug.includes("paid-social")),
    );
  });
}

export function getPropertyAcquisitionAttribution(lang?: string): PropertyAcquisitionAttribution {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const leadId = firstParam(params, "mc_lead_id", "lead_id", "l");
  const token = firstParam(params, "mc_token", "token", "k", "t");
  const utmContent = firstParam(params, "utm_content") ?? expandTemplateCode(firstParam(params, "c"));
  const attribution: PropertyAcquisitionAttribution = {
    mc_lead_id: leadId,
    mc_token: token,
    utm_source: firstParam(params, "utm_source") ?? (leadId && token ? "mi_casa_email" : undefined),
    utm_medium: firstParam(params, "utm_medium") ?? (leadId && token ? "email" : undefined),
    utm_campaign: firstParam(params, "utm_campaign") ?? (leadId && token ? "property_acquisition" : undefined),
    utm_content: utmContent,
    scan_id: firstParam(params, "scan_id"),
    lang: firstParam(params, "lang") ?? lang,
    page_url: window.location.href,
    referrer: document.referrer || undefined,
  };

  return attribution;
}

export function hasPropertyAcquisitionAttribution(attribution: PropertyAcquisitionAttribution) {
  return Boolean(
    (attribution.mc_lead_id && attribution.mc_token) ||
      attribution.utm_source ||
      attribution.utm_medium ||
      attribution.utm_campaign ||
      attribution.utm_content ||
      attribution.scan_id,
  );
}

export function isPostcardAttribution(attribution: PropertyAcquisitionAttribution) {
  const values = [
    attribution.utm_source,
    attribution.utm_medium,
    attribution.utm_campaign,
    attribution.utm_content,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  return values.some((value) => value.includes("postcard"));
}

export function getAttributedLeadSource(
  baseSource: string,
  attribution: PropertyAcquisitionAttribution,
) {
  if (isPostcardAttribution(attribution)) {
    return `${baseSource}-postcard`;
  }

  const source = slugPart(attribution.utm_source);
  const medium = slugPart(attribution.utm_medium);
  const campaign = slugPart(attribution.utm_campaign);
  const content = slugPart(attribution.utm_content);

  if (source || medium || campaign || content) {
    const channel = isMetaTraffic(source, medium, campaign, content)
      ? "facebook"
      : source ?? medium ?? "utm";
    const creative = content ?? campaign;

    return [baseSource, channel, creative].filter(Boolean).join("-");
  }

  return baseSource;
}

export async function reportPropertyAcquisitionFunnelVisit(lang?: string) {
  const attribution = getPropertyAcquisitionAttribution(lang);
  if (!hasPropertyAcquisitionAttribution(attribution)) return;

  try {
    await fetch("/api/acquisition-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: isPostcardAttribution(attribution)
          ? "postcard_funnel_visit"
          : "funnel_visit",
        attribution,
      }),
      keepalive: true,
    });
  } catch {
    // Attribution should never block the funnel experience.
  }
}
