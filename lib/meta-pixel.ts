"use client";

type MetaEventOptions = {
  eventId?: string;
};

type LeadEventInput = MetaEventOptions & {
  source: string;
  lang?: string;
  leadId?: string | null;
};

type ContactEventInput = {
  location: string;
  href?: string;
  lang?: string;
};

type BrowserContext = {
  eventSourceUrl: string;
  userAgent: string;
  fbp?: string;
  fbc?: string;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

function getFbq() {
  if (typeof window === "undefined") return undefined;
  return typeof window.fbq === "function" ? window.fbq : undefined;
}

export function createMetaEventId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${Date.now()}_${random}`;
}

export function getMetaBrowserContext(): BrowserContext | undefined {
  if (typeof window === "undefined") return undefined;

  return {
    eventSourceUrl: window.location.href,
    userAgent: window.navigator.userAgent,
    fbp: getCookie("_fbp"),
    fbc: getCookie("_fbc"),
  };
}

export function trackMetaStandardEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  options: MetaEventOptions = {},
) {
  const fbq = getFbq();
  if (!fbq) return;

  if (options.eventId) {
    fbq("track", eventName, params, { eventID: options.eventId });
    return;
  }

  fbq("track", eventName, params);
}

export function trackMetaCustomEvent(
  eventName: string,
  params: Record<string, unknown> = {},
) {
  const fbq = getFbq();
  if (!fbq) return;
  fbq("trackCustom", eventName, params);
}

export function trackLeadStarted(source: string, lang?: string) {
  trackMetaCustomEvent("LeadStarted", {
    content_name: "Mi Casa lead funnel",
    content_category: source,
    language: lang,
  });
}

export function trackLeadComplete({
  eventId,
  source,
  lang,
  leadId,
}: LeadEventInput) {
  trackMetaStandardEvent(
    "Lead",
    {
      content_name: "Mi Casa lead",
      content_category: source,
      language: lang,
      lead_id: leadId ?? undefined,
    },
    { eventId },
  );
}

export function trackContactClick({
  location,
  href,
  lang,
}: ContactEventInput) {
  trackMetaStandardEvent("Contact", {
    content_name: "Phone click",
    content_category: "phone",
    location,
    href,
    language: lang,
  });
}
