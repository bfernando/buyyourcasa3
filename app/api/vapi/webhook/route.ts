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
 * The same secret value must be set in the assistant's `serverSecret` field
 * (we pass it via the assistant config when creating the call client-side —
 * but for the POC we rely purely on the header match).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────
// Loosely typed — Vapi's payload shape is large and we only read a few fields.
type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
};

type ToolCallsMessage = {
  type: "tool-calls";
  call?: { id?: string; metadata?: Record<string, unknown> };
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

// ─── Helpers ──────────────────────────────────────────────────────────────
function verifySecret(req: NextRequest): boolean {
  const expected = process.env.VAPI_WEBHOOK_SECRET;
  if (!expected) {
    // No secret set — allow in dev so you can test without the header.
    // In production, you MUST set VAPI_WEBHOOK_SECRET.
    if (process.env.NODE_ENV === "production") return false;
    return true;
  }
  // Vapi sends the secret in x-vapi-secret when you set the
  // server.secret field. We also accept a raw Authorization: Bearer fallback.
  const headerA = req.headers.get("x-vapi-secret");
  const headerB = req.headers.get("authorization");
  if (headerA && headerA === expected) return true;
  if (headerB && headerB === `Bearer ${expected}`) return true;
  return false;
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

async function handleCompleteLead(callId: string, source: string) {
  const lead = await findOrCreateByCallId(callId, {
    address: "(pending)",
    source,
  });
  await prisma.lead.update({
    where: { id: lead.id },
    data: { completed: true, step: 4 },
  });
  return { ok: true, leadId: lead.id };
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
  if (!verifySecret(req)) {
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
      const callId = m.call?.id ?? "";
      const source =
        (m.call?.metadata?.source as string | undefined) ?? "voice-en";
      const calls = m.toolCallList ?? m.toolCalls ?? [];

      // Vapi expects a `results` array keyed by the tool-call id.
      const results: Array<{ toolCallId: string; result: string }> = [];

      for (const call of calls) {
        const args = parseArgs(call.function.arguments);
        let outcome: Record<string, unknown> = { ok: false };

        switch (call.function.name) {
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
            outcome = await handleCompleteLead(callId, source);
            break;
          default:
            outcome = { ok: false, error: `unknown tool ${call.function.name}` };
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
