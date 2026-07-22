import { Lead } from "@prisma/client";

type NotifyInput = {
  eventType: string;
  lead?: Lead;
  attribution?: Record<string, unknown>;
  extra?: Record<string, unknown>;
};

function leadPayload(lead: Lead) {
  return {
    buyyourcasa_lead_id: lead.id,
    address: lead.address,
    source: lead.source,
    channel: lead.channel,
    step: lead.step,
    completed: lead.completed,
    phone: lead.phone,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    condition: lead.condition,
    timeline: lead.timeline,
    reason: lead.reason,
    callId: lead.callId,
    callDurationSec: lead.callDurationSec,
    recordingUrl: lead.recordingUrl,
    smsProvider: lead.smsProvider,
    providerMessageId: lead.providerMessageId,
    inboundMessage: lead.inboundMessage,
    firstInboundAt: lead.firstInboundAt?.toISOString(),
    lastInboundAt: lead.lastInboundAt?.toISOString(),
    smsOptedOutAt: lead.smsOptedOutAt?.toISOString(),
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export async function notifyPropertyAcquisitionEngine({
  eventType,
  lead,
  attribution,
  extra,
}: NotifyInput) {
  const endpoint =
    process.env.PROPERTY_ACQUISITION_ENGINE_WEBHOOK_URL?.trim() ||
    "https://property-acquisition-ops.vercel.app/webhooks/buyyourcasa";
  const secret = process.env.PROPERTY_ACQUISITION_ENGINE_WEBHOOK_SECRET?.trim();

  if (!endpoint || !secret) {
    return { ok: false, skipped: true, reason: "missing_config" };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Property-Acquisition-Webhook-Secret": secret,
      },
      body: JSON.stringify({
        event_type: eventType,
        attribution: attribution ?? {},
        lead: lead ? leadPayload(lead) : undefined,
        ...extra,
      }),
    });

    if (!response.ok) {
      console.warn("[property-acquisition] webhook failed", {
        status: response.status,
        eventType,
        leadId: lead?.id,
      });
      return { ok: false, reason: "webhook_failed" };
    }

    return { ok: true };
  } catch (error) {
    console.warn("[property-acquisition] webhook error", {
      eventType,
      leadId: lead?.id,
      error,
    });
    return { ok: false, reason: "request_failed" };
  }
}
