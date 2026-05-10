import { createHash, randomUUID } from "crypto";
import type { Lead } from "@prisma/client";
import type { NextRequest } from "next/server";

type MetaBrowserData = {
  eventSourceUrl?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
};

type SendLeadEventInput = {
  lead: Lead;
  eventId: string;
  req?: NextRequest;
  browser?: MetaBrowserData;
};

type MetaUserData = {
  em?: string[];
  ph?: string[];
  fn?: string[];
  ln?: string[];
  external_id?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
};

export function createServerMetaEventId(prefix: string, id?: string) {
  return `${prefix}_${id ?? randomUUID()}_${Date.now()}`;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase();
}

function normalizePhone(value?: string | null) {
  const digits = value?.replace(/\D/g, "");
  if (!digits) return undefined;
  return digits.length === 10 ? `1${digits}` : digits;
}

function normalizeName(value?: string | null) {
  return value?.trim().toLowerCase();
}

function firstForwardedIp(req?: NextRequest) {
  const forwardedFor = req?.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim();
}

function cookieValue(req: NextRequest | undefined, name: string) {
  return req?.cookies.get(name)?.value;
}

function buildUserData(
  lead: Lead,
  req?: NextRequest,
  browser?: MetaBrowserData,
): MetaUserData {
  const email = normalizeEmail(lead.email);
  const phone = normalizePhone(lead.phone);
  const firstName = normalizeName(lead.firstName);
  const lastName = normalizeName(lead.lastName);
  const userAgent = req?.headers.get("user-agent") ?? browser?.userAgent;
  const fbp = cookieValue(req, "_fbp") ?? browser?.fbp;
  const fbc = cookieValue(req, "_fbc") ?? browser?.fbc;

  return {
    ...(email && { em: [sha256(email)] }),
    ...(phone && { ph: [sha256(phone)] }),
    ...(firstName && { fn: [sha256(firstName)] }),
    ...(lastName && { ln: [sha256(lastName)] }),
    external_id: [sha256(lead.id)],
    ...(firstForwardedIp(req) && { client_ip_address: firstForwardedIp(req) }),
    ...(userAgent && { client_user_agent: userAgent }),
    ...(fbp && { fbp }),
    ...(fbc && { fbc }),
  };
}

export async function sendMetaLeadEvent({
  lead,
  eventId,
  req,
  browser,
}: SendLeadEventInput) {
  const pixelId =
    process.env.META_PIXEL_ID ??
    process.env.NEXT_PUBLIC_META_PIXEL_ID ??
    process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  const accessToken =
    process.env.META_ACCESS_TOKEN ?? process.env.META_CONVERSIONS_API_TOKEN;

  if (!pixelId || !accessToken) {
    return { skipped: true, reason: "Meta CAPI is not configured" };
  }

  const graphVersion = process.env.META_GRAPH_API_VERSION ?? "v25.0";
  const endpoint = new URL(
    `https://graph.facebook.com/${graphVersion}/${pixelId}/events`,
  );
  endpoint.searchParams.set("access_token", accessToken);

  const eventSourceUrl =
    browser?.eventSourceUrl ??
    req?.headers.get("referer") ??
    process.env.NEXT_PUBLIC_SITE_URL;

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: eventSourceUrl,
        user_data: buildUserData(lead, req, browser),
        custom_data: {
          content_name: "BuyYourCasa lead",
          content_category: lead.source,
          lead_id: lead.id,
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE && {
      test_event_code: process.env.META_TEST_EVENT_CODE,
    }),
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[Meta CAPI] Lead event failed", res.status, detail);
      return { ok: false, status: res.status };
    }

    return { ok: true };
  } catch (error) {
    console.error("[Meta CAPI] Lead event error", error);
    return { ok: false, error };
  }
}
