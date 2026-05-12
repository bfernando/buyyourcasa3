import { NextRequest, NextResponse } from "next/server";

const MAX_STRING_LENGTH = 500;
const MAX_PAYLOAD_BYTES = 8_000;

type ClientEventPayload = {
  event?: unknown;
  source?: unknown;
  lang?: unknown;
  phase?: unknown;
  path?: unknown;
  eventId?: unknown;
  details?: unknown;
  timestamp?: unknown;
  userAgent?: unknown;
};

function sanitizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_STRING_LENGTH);
}

function sanitizeDetails(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const details: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(value)) {
    if (rawValue === null || rawValue === undefined) continue;

    if (typeof rawValue === "string") {
      details[key] = rawValue.slice(0, MAX_STRING_LENGTH);
      continue;
    }

    if (
      typeof rawValue === "number" ||
      typeof rawValue === "boolean"
    ) {
      details[key] = rawValue;
      continue;
    }

    if (Array.isArray(rawValue)) {
      details[key] = rawValue
        .filter((item) => typeof item === "string")
        .slice(0, 20)
        .map((item) => item.slice(0, 120));
    }
  }

  return Object.keys(details).length > 0 ? details : undefined;
}

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  let body: ClientEventPayload;
  try {
    body = (await req.json()) as ClientEventPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const event = sanitizeString(body.event);
  if (!event) {
    return NextResponse.json({ error: "event is required" }, { status: 400 });
  }

  const payload = {
    event,
    source: sanitizeString(body.source),
    lang: sanitizeString(body.lang),
    phase: sanitizeString(body.phase),
    path: sanitizeString(body.path),
    eventId: sanitizeString(body.eventId),
    timestamp: sanitizeString(body.timestamp),
    userAgent: sanitizeString(body.userAgent),
    details: sanitizeDetails(body.details),
    ipCountry: req.headers.get("x-vercel-ip-country"),
    ipRegion: req.headers.get("x-vercel-ip-country-region"),
    ipCity: req.headers.get("x-vercel-ip-city"),
  };

  console.warn("[client-event]", payload);

  return NextResponse.json({ ok: true });
}
