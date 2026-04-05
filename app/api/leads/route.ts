import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/leads — create a new lead with just the address (Step 1 capture)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.address?.trim()) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        address: body.address.trim(),
        source: body.source ?? "desktop",
        step: 1,
      },
    });

    return NextResponse.json({ id: lead.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/leads error:", err);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}

// GET /api/leads — list all leads (useful for a simple admin view later)
export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(leads);
  } catch (err) {
    console.error("GET /api/leads error:", err);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
