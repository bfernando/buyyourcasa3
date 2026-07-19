/**
 * app/api/vapi/webhook/route.ts
 * ─────────────────────────────
 * Receives server-side events from Vapi during a browser voice call.
 *
 * Two kinds of events we care about:
 *   1. tool-calls       — assistant called one of our function tools
 *                         (save_address, save_contact, save_details, complete_lead).
 *                         We write the extracted fields into the leads table,
 *                         same rows the legacy form writes to.
 *   2. end-of-call-report — the call ended. We save the transcript, recording
 *                           URL, and call duration onto the lead row.
 *
 * Security: Vapi sends every request with a header that must match
 * VAPI_WEBHOOK_SECRET. Any request that doesn't match is rejected with 401.
 * For browser-created calls, the assistant config passes a Vapi webhook
 * credential ID; the raw secret stays in Vapi/Vercel and is never exposed to
 * the browser.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLeadCompletionAlert } from "@/lib/email/lead-alert";
import { sendLeadCompletionSmsAlert } from "@/lib/sms/lead-alert";
import { notifyPropertyAcquisitionEngine } from "@/lib/property-acquisition";
import {
  createServerMetaEventId,
  sendMetaLeadEvent,
} from "@/lib/meta-capi";

// ─── Types ────────────────────────────────────────────────────────────────
// Loosely typed — Vapi's payload shape is large and we only read a few fields.
type ToolCall = {
  id: string;
  type?: "function";
  name?: string;
  arguments?: string | Record<string, unknown>;
  parameters?: string | Record<string, unknown>;
  function?: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
};

type ToolCallsMessage = {
  type: "tool-calls";
  call?: {
    id?: string;
    type?: string;
    metadata?: Record<string, unknown>;
    customer?: { number?: string };
  };
  chat?: { id?: string; customer?: { number?: string } };
  session?: {
    id?: string;
    metadata?: Record<string, unknown>;
    customer?: { number?: string };
  };
  customer?: { number?: string };
  toolCallList?: ToolCall[];
  toolCalls?: ToolCall[];
};

type EndOfCallMessage = {
  type: "end-of-call-report";
  call?: {
    id?: string;
    metadata?: Record<string, unknown>;
    durationSeconds?: number;
  };
  endedReason?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  artifact?: {
    recordingUrl?: string;
    transcript?: string;
    messages?: Array<{ role: string; message?: string; time?: number }>;
  };
  messages?: Array<{ role: string; message?: string; time?: number }>;
};

// Loose envelope for "any Vapi message" — we narrow by `type` before use.
type VapiMessage = { type?: string } & Record<string, unknown>;
type SecretVerification =
  | { ok: true }
  | {
      ok: false;
      reason: string;
      hasExpectedSecret: boolean;
      hasVapiSecretHeader: boolean;
      hasAuthorizationHeader: boolean;
    };

// ─── Helpers ──────────────────────────────────────────────────────────────
function verifySecret(req: NextRequest): SecretVerification {
  const expected = process.env.VAPI_WEBHOOK_SECRET;
  if (!expected) {
    // No secret set — allow in dev so you can test without the header.
    // In production, you MUST set VAPI_WEBHOOK_SECRET.
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        reason: "missing_expected_secret",
        hasExpectedSecret: false,
        hasVapiSecretHeader: Boolean(req.headers.get("x-vapi-secret")),
        hasAuthorizationHeader: Boolean(req.headers.get("authorization")),
      };
    }
    return { ok: true };
  }
  // Vapi may send either x-vapi-secret from dashboard-level server settings or
  // Authorization: Bearer from a stored webhook credential.
  const headerA = req.headers.get("x-vapi-secret");
  const headerB = req.headers.get("authorization");
  if (headerA && headerA === expected) return { ok: true };
  if (headerB && headerB === `Bearer ${expected}`) return { ok: true };
  return {
    ok: false,
    reason: "secret_mismatch",
    hasExpectedSecret: true,
    hasVapiSecretHeader: Boolean(headerA),
    hasAuthorizationHeader: Boolean(headerB),
  };
}

function parseArgs(
  raw: string | Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return raw;
}

function str(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function phone(v: unknown): string | undefined {
  const value = str(v);
  if (!value || value.includes("{{") || value.includes("}}")) {
    return undefined;
  }
  return value;
}

function bool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v !== "string") return false;
  return ["true", "yes", "1"].includes(v.trim().toLowerCase());
}

function toolName(call: ToolCall): string | undefined {
  return call.function?.name ?? call.name;
}

function toolArguments(call: ToolCall): Record<string, unknown> {
  return parseArgs(
    call.function?.arguments ?? call.arguments ?? call.parameters,
  );
}

function interactionId(message: ToolCallsMessage): string | undefined {
  const directId = message.call?.id ?? message.chat?.id ?? message.session?.id;
  if (directId) return directId;

  const phone = customerPhone(message);
  return phone ? `sms:${phone}` : undefined;
}

function customerPhone(message: ToolCallsMessage): string | undefined {
  return (
    str(message.customer?.number) ??
    str(message.session?.customer?.number) ??
    str(message.chat?.customer?.number) ??
    str(message.call?.customer?.number)
  );
}

function interactionSource(message: ToolCallsMessage): string {
  const metadata = message.call?.metadata ?? message.session?.metadata;
  const configuredSource = str(metadata?.source);
  if (configuredSource) return configuredSource;

  return message.chat || message.session || message.call?.type === "chat"
    ? "sms-vapi"
    : "voice-en";
}

// ─── Tool-call handlers ───────────────────────────────────────────────────
// Each handler receives the (callId, args) and mutates the leads table.
// We key the row by callId: the first save_address call for a given callId
// creates the row, later calls update it. This mirrors the legacy form's
// progressive capture pattern.

async function findOrCreateByCallId(
  callId: string,
  initial: { address: string; source: string },
) {
  // Upsert by a unique (callId)? We don't have a unique constraint on callId,
  // so do a findFirst then create-or-update.
  const existing = await prisma.lead.findFirst({ where: { callId } });
  if (existing) return existing;
  return prisma.lead.create({
    data: {
      address: initial.address,
      source: initial.source,
      callId,
      step: 1,
    },
  });
}

async function handleSaveAddress(
  callId: string,
  source: string,
  args: Record<string, unknown>,
) {
  const address = str(args.address);
  if (!address) return { ok: false, error: "address missing" };
  const lead = await findOrCreateByCallId(callId, { address, source });
  // If a previous tool-call created the lead without an address (shouldn't
  // happen, but belt-and-suspenders), update it.
  if (!lead.address && address) {
    await prisma.lead.update({ where: { id: lead.id }, data: { address } });
  }
  return { ok: true, leadId: lead.id };
}

async function handleSaveContact(
  callId: string,
  source: string,
  args: Record<string, unknown>,
) {
  const firstName = str(args.firstName);
  const lastName = str(args.lastName);
  const phone = str(args.phone);
  const email = str(args.email);

  // If the agent somehow called save_contact before save_address, we still
  // need a lead row. Create a placeholder with address = "(pending)" — the
  // agent will follow up with save_address momentarily.
  const lead = await findOrCreateByCallId(callId, {
    address: "(pending)",
    source,
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
      ...(email && { email }),
      step: Math.max(2, lead.step),
    },
  });
  return { ok: true, leadId: lead.id };
}

async function handleSaveDetails(
  callId: string,
  source: string,
  args: Record<string, unknown>,
) {
  const condition = str(args.condition);
  const timeline = str(args.timeline);
  const reason = str(args.reason);

  const lead = await findOrCreateByCallId(callId, {
    address: "(pending)",
    source,
  });
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      ...(condition && { condition }),
      ...(timeline && { timeline }),
      ...(reason && { reason }),
      step: Math.max(3, lead.step),
    },
  });
  return { ok: true, leadId: lead.id };
}

async function handleCompleteLead(
  callId: string,
  source: string,
  metadata?: Record<string, unknown>,
) {
  const lead = await findOrCreateByCallId(callId, {
    address: "(pending)",
    source,
  });
  const updatedLead = await prisma.lead.update({
    where: { id: lead.id },
    data: { completed: true, step: 4 },
  });

  if (!lead.completed && updatedLead.completed) {
    const metaEventId =
      str(metadata?.metaEventId) ??
      createServerMetaEventId("lead_voice", updatedLead.id);
    const results = await Promise.allSettled([
      sendLeadCompletionAlert(updatedLead),
      sendLeadCompletionSmsAlert(updatedLead),
      notifyPropertyAcquisitionEngine({
        eventType: "funnel_voice_completed",
        lead: updatedLead,
        attribution:
          metadata?.propertyAcquisitionAttribution &&
          typeof metadata.propertyAcquisitionAttribution === "object"
            ? (metadata.propertyAcquisitionAttribution as Record<string, unknown>)
            : undefined,
      }),
      sendMetaLeadEvent({
        lead: updatedLead,
        eventId: metaEventId,
        browser: {
          eventSourceUrl: str(metadata?.eventSourceUrl),
          userAgent: str(metadata?.userAgent),
          fbp: str(metadata?.fbp),
          fbc: str(metadata?.fbc),
        },
      }),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[vapi webhook] lead completion side effect failed", result.reason);
      }
    }
  }

  return { ok: true, leadId: lead.id };
}

async function handleSaveSmsLead(
  conversationId: string,
  args: Record<string, unknown>,
  fallbackPhone?: string,
) {
  const isTest = bool(args.isTest);
  const source = isTest ? "test-sms-vapi" : "sms-vapi";
  const address = str(args.address);
  const contactPhone = phone(fallbackPhone) ?? phone(args.phone);
  const firstName = str(args.firstName);
  const lastName = str(args.lastName);
  const email = str(args.email);
  const condition = str(args.condition);
  const timeline = str(args.timeline);
  const reason = str(args.reason);

  if (!address) {
    return { ok: false, error: "address missing" };
  }

  const existing = await findOrCreateByCallId(conversationId, {
    address,
    source,
  });
  const hasDetails = Boolean(condition || timeline || reason);
  const shouldComplete = !isTest && Boolean(contactPhone);

  const updatedLead = await prisma.lead.update({
    where: { id: existing.id },
    data: {
      address,
      source,
      ...(contactPhone && { phone: contactPhone }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(condition && { condition }),
      ...(timeline && { timeline }),
      ...(reason && { reason }),
      step: hasDetails ? 3 : contactPhone ? 2 : 1,
      ...(shouldComplete && { completed: true }),
    },
  });

  if (!existing.completed && updatedLead.completed) {
    const metaEventId = createServerMetaEventId("lead_sms", updatedLead.id);
    const results = await Promise.allSettled([
      sendLeadCompletionAlert(updatedLead),
      sendLeadCompletionSmsAlert(updatedLead),
      notifyPropertyAcquisitionEngine({
        eventType: "funnel_sms_completed",
        lead: updatedLead,
      }),
      sendMetaLeadEvent({
        lead: updatedLead,
        eventId: metaEventId,
        browser: {},
      }),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        console.error(
          "[vapi webhook] SMS lead completion side effect failed",
          result.reason,
        );
      }
    }
  }

  return {
    ok: true,
    leadId: updatedLead.id,
    completed: updatedLead.completed,
    test: isTest,
  };
}

// ─── End-of-call-report handler ───────────────────────────────────────────
async function handleEndOfCall(msg: EndOfCallMessage) {
  const callId = msg.call?.id;
  if (!callId) return;

  const duration =
    typeof msg.call?.durationSeconds === "number"
      ? Math.round(msg.call.durationSeconds)
      : undefined;
  const recordingUrl =
    msg.artifact?.recordingUrl ?? msg.recordingUrl ?? msg.stereoRecordingUrl;
  const messages = msg.artifact?.messages ?? msg.messages ?? [];

  // Find the lead row created earlier by tool calls; if none exists, skip —
  // there's nothing to attach the transcript to.
  const lead = await prisma.lead.findFirst({ where: { callId } });
  if (!lead) return;

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      ...(duration && { callDurationSec: duration }),
      ...(recordingUrl && { recordingUrl }),
      ...(messages.length > 0 && { transcript: messages as object }),
    },
  });
}

// ─── Route handler ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const secretVerification = verifySecret(req);
  if (!secretVerification.ok) {
    console.warn("[vapi webhook] unauthorized", secretVerification);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { message?: VapiMessage } | VapiMessage;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Vapi wraps events in { message: {...} } — unwrap if present.
  const msg: VapiMessage =
    body && typeof body === "object" && "message" in body && body.message
      ? (body.message as VapiMessage)
      : (body as VapiMessage);

  const type = msg.type;

  try {
    if (type === "tool-calls") {
      const m = msg as unknown as ToolCallsMessage;
      const callId = interactionId(m);
      if (!callId) {
        return NextResponse.json(
          { error: "missing interaction id" },
          { status: 400 },
        );
      }
      const metadata = m.call?.metadata;
      const source = interactionSource(m);
      const calls = m.toolCallList ?? m.toolCalls ?? [];

      // Vapi expects a `results` array keyed by the tool-call id.
      const results: Array<{ toolCallId: string; result: string }> = [];

      for (const call of calls) {
        const name = toolName(call);
        const args = toolArguments(call);
        let outcome: Record<string, unknown> = { ok: false };

        switch (name) {
          case "save_address":
            outcome = await handleSaveAddress(callId, source, args);
            break;
          case "save_contact":
            outcome = await handleSaveContact(callId, source, args);
            break;
          case "save_details":
            outcome = await handleSaveDetails(callId, source, args);
            break;
          case "complete_lead":
            outcome = await handleCompleteLead(callId, source, metadata);
            break;
          case "save_mi_casa_sms_lead":
            outcome = await handleSaveSmsLead(
              callId,
              args,
              customerPhone(m),
            );
            break;
          default:
            outcome = { ok: false, error: `unknown tool ${name ?? "missing"}` };
        }

        results.push({
          toolCallId: call.id,
          result: JSON.stringify(outcome),
        });
      }

      return NextResponse.json({ results });
    }

    if (type === "end-of-call-report") {
      await handleEndOfCall(msg as unknown as EndOfCallMessage);
      return NextResponse.json({ ok: true });
    }

    // Any other event type (status-update, hang, etc.) — ack and move on.
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[vapi webhook]", type, err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
}

// GET for health checks / Vapi's verification pings.
export async function GET() {
  return NextResponse.json({ ok: true, service: "vapi-webhook" });
}
