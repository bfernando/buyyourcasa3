import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ENGINE_BASE_URL = "https://property-acquisition-ops.vercel.app";

function engineUnsubscribeUrl(req: NextRequest) {
  const configuredUrl =
    process.env.PROPERTY_ACQUISITION_ENGINE_UNSUBSCRIBE_URL?.trim() ||
    process.env.PROPERTY_ACQUISITION_ENGINE_WEBHOOK_URL?.trim();
  const url = configuredUrl ? new URL(configuredUrl) : new URL(DEFAULT_ENGINE_BASE_URL);
  url.pathname = "/u";
  url.search = req.nextUrl.search;
  return url;
}

async function forwardUnsubscribe(req: NextRequest) {
  const target = engineUnsubscribeUrl(req);
  const headers: Record<string, string> = {
    "User-Agent": req.headers.get("user-agent") ?? "buyyourcasa-unsubscribe-proxy",
    "X-Forwarded-For": req.headers.get("x-forwarded-for") ?? "",
  };

  let body: string | undefined;
  if (req.method === "POST") {
    body = await req.text();
    headers["Content-Type"] = req.headers.get("content-type") ?? "application/x-www-form-urlencoded";
  }

  const response = await fetch(target, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest) {
  return forwardUnsubscribe(req);
}

export async function POST(req: NextRequest) {
  return forwardUnsubscribe(req);
}
