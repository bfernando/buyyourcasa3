import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { preflightResponse, withCors } from "@/lib/cors";
import { notifyPropertyAcquisitionEngine } from "@/lib/property-acquisition";

// CORS preflight for cross-origin POSTs from micasainvestmentgroup.com
export async function OPTIONS(req: NextRequest) {
  return preflightResponse(req);
}

// POST /api/leads — create a new lead with just the address (Step 1 capture)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.address?.trim()) {
      return withCors(req, NextResponse.json({ error: "Address is required" }, { status: 400 }));
    }

    const lead = await prisma.lead.create({
      data: {
        address: body.address.trim(),
        source: body.source ?? "desktop",
        step: 1,
      },
    });

    await notifyPropertyAcquisitionEngine({
      eventType: "funnel_form_started",
      lead,
      attribution: body.attribution,
      extra: {
        userAgent: req.headers.get("user-agent"),
        ip: req.headers.get("x-forwarded-for"),
      },
    });

    return withCors(req, NextResponse.json({ id: lead.id }, { status: 201 }));
  } catch (err) {
    console.error("POST /api/leads error:", err);
    return withCors(req, NextResponse.json({ error: "Failed to create lead" }, { status: 500 }));
  }
}

function isAuthorizedLeadRead(req: NextRequest) {
  const expectedValues = [
    process.env.LEADS_ADMIN_TOKEN,
    process.env.ADMIN_API_TOKEN,
    process.env.PROPERTY_ACQUISITION_ENGINE_WEBHOOK_SECRET,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  if (expectedValues.length === 0) return false;

  const supplied = (
    req.headers.get("x-admin-api-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    ""
  ).trim();
  if (!supplied) return false;

  const suppliedBuffer = Buffer.from(supplied);
  return expectedValues.some((expected) => {
    const expectedBuffer = Buffer.from(expected);
    return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
  });
}

// GET /api/leads — private admin-only lead review endpoint.
export async function GET(req: NextRequest) {
  if (!isAuthorizedLeadRead(req)) {
    return withCors(req, NextResponse.json({ error: "Not found" }, { status: 404 }));
  }

  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return withCors(req, NextResponse.json(leads));
  } catch (err) {
    console.error("GET /api/leads error:", err);
    return withCors(req, NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 }));
  }
}
