import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLeadCompletionAlert } from "@/lib/email/lead-alert";
import { sendLeadCompletionSmsAlert } from "@/lib/sms/lead-alert";
import {
  createServerMetaEventId,
  sendMetaLeadEvent,
} from "@/lib/meta-capi";
import { preflightResponse, withCors } from "@/lib/cors";
import { notifyPropertyAcquisitionEngine } from "@/lib/property-acquisition";

// CORS preflight for cross-origin PATCHes from micasainvestmentgroup.com
export async function OPTIONS(req: NextRequest) {
  return preflightResponse(req);
}

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
      return withCors(req, NextResponse.json({ error: "Lead not found" }, { status: 404 }));
    }

    // Strip undefined values so we don't overwrite existing data with nulls
    const data: Record<string, unknown> = {};
    const metaEventId =
      typeof body.metaEventId === "string" && body.metaEventId.trim()
        ? body.metaEventId.trim()
        : createServerMetaEventId("lead", id);
    const eventSourceUrl =
      typeof body.eventSourceUrl === "string" && body.eventSourceUrl.trim()
        ? body.eventSourceUrl.trim()
        : undefined;
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

    await notifyPropertyAcquisitionEngine({
      eventType: lead.completed ? "funnel_form_completed" : "funnel_form_updated",
      lead,
      attribution: body.attribution,
      extra: {
        userAgent: req.headers.get("user-agent"),
        ip: req.headers.get("x-forwarded-for"),
      },
    });

    if (!existingLead.completed && lead.completed) {
      const results = await Promise.allSettled([
        sendLeadCompletionAlert(lead),
        sendLeadCompletionSmsAlert(lead),
        sendMetaLeadEvent({
          lead,
          eventId: metaEventId,
          req,
          browser: { eventSourceUrl },
        }),
      ]);

      for (const result of results) {
        if (result.status === "rejected") {
          console.error("Lead completion side effect failed", result.reason);
        }
      }
    }

    return withCors(req, NextResponse.json({ ...lead, metaEventId }));
  } catch (err) {
    console.error("PATCH /api/leads/:id error:", err);
    return withCors(req, NextResponse.json({ error: "Failed to update lead" }, { status: 500 }));
  }
}
