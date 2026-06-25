import { NextRequest, NextResponse } from "next/server";
import { notifyPropertyAcquisitionEngine } from "@/lib/property-acquisition";

export async function POST(req: NextRequest) {
  let body: {
    eventType?: string;
    attribution?: Record<string, unknown>;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const result = await notifyPropertyAcquisitionEngine({
    eventType: body.eventType || "funnel_visit",
    attribution: body.attribution,
    extra: {
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for"),
    },
  });

  return NextResponse.json({ ok: true, tracked: result.ok, reason: "reason" in result ? result.reason : undefined });
}
