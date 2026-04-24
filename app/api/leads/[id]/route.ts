import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLeadCompletionAlert } from "@/lib/email/lead-alert";
import { sendLeadCompletionSmsAlert } from "@/lib/sms/lead-alert";

// PATCH /api/leads/:id — progressively update a lead as they complete each step
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { id } = params;
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Strip undefined values so we don't overwrite existing data with nulls
    const data: Record<string, unknown> = {};
    const allowed = [
      "phone", "firstName", "lastName", "email",
      "condition", "timeline", "reason",
      "step", "completed",
      // Voice agent fields (populated by /api/vapi/webhook)
      "callId", "callDurationSec", "recordingUrl", "transcript",
    ];
    for (const key of allowed) {
      if (body[key] !== undefined && body[key] !== null && body[key] !== "") {
        data[key] = body[key];
      }
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
    });

    if (!existingLead.completed && lead.completed) {
      await sendLeadCompletionAlert(lead);
      await sendLeadCompletionSmsAlert(lead);
    }

    return NextResponse.json(lead);
  } catch (err) {
    console.error("PATCH /api/leads/:id error:", err);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
