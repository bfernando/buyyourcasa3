/**
 * app/api/vapi/webhook/route.ts
 * ─────────────────────────────
 * Receives server-side events from Vapi for browser voice calls and inbound
 * SMS sessions.
 *
 * Two kinds of events we care about:
 *   1. tool-calls       — assistant called one of our function tools
 *                         (including save_mi_casa_sms_lead).
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
import { Lead, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  sendInboundSmsLeadAlert,
  sendLeadCompletionAlert,
} from "@/lib/email/lead-alert";
import {
  sendInboundSmsLeadSmsAlert,
  sendLeadCompletionSmsAlert,
} from "@/lib/sms/lead-alert";
import {
  evaluateInboundSms,
  extractLatestUserMessage,
  notificationDispatchPlan,
  notificationExcludedNumbers,
} from "@/lib/sms/inbound";
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
  chat?: {
    id?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
    customer?: { number?: string };
  };
  session?: {
    id?: string;
    metadata?: Record<string, unknown>;
    customer?: { number?: string };
  };
  phoneNumber?: { id?: string; number?: string };
  customer?: { number?: string };
  timestamp?: string | number;
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

type ChatCreatedMessage = {
  type: "chat.created";
  timestamp?: string | number;
  customer?: { number?: string };
  phoneNumber?: { id?: string; number?: string };
  assistant?: { id?: string; metadata?: Record<string, unknown> };
  chat: {
    id?: string;
    sessionId?: string;
    input?: unknown;
    messages?: unknown;
    metadata?: Record<string, unknown>;
  };
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

type VapiRequestContext = {
  chatId?: string;
  sessionId?: string;
};

const BEYFLO_VAPI_WEBHOOK_URL = "https://www.beyflo.com/api/webhooks/vapi";

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

function interactionId(
  message: ToolCallsMessage,
  source: string,
  requestContext: VapiRequestContext,
): string | undefined {
  const isSms =
    source.includes("sms") ||
    Boolean(
      requestContext.sessionId ||
        requestContext.chatId ||
        message.chat ||
        message.session,
    );
  if (isSms) {
    const smsId =
      requestContext.sessionId ??
      message.session?.id ??
      message.chat?.sessionId ??
      message.chat?.id ??
      message.call?.id;
    if (smsId) return smsId;
  }

  if (message.call?.id) return message.call.id;

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
  const metadata =
    message.call?.metadata ?? message.session?.metadata ?? message.chat?.metadata;
  const configuredSource = str(metadata?.source);
  if (configuredSource) return configuredSource;

  return message.chat || message.session || message.call?.type === "chat"
    ? "sms-vapi"
    : "voice-en";
}

function inboundTimestamp(message: ToolCallsMessage): Date {
  const value = message.timestamp;
  const parsed =
    typeof value === "number"
      ? new Date(value < 10_000_000_000 ? value * 1000 : value)
      : typeof value === "string"
        ? new Date(value)
        : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function compactObject(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  );
}

function smsAttribution(
  message: ToolCallsMessage,
  source: string,
  toolCallId: string,
  providerMessageId: string,
  sessionId: string,
  requestContext: VapiRequestContext,
): Prisma.InputJsonObject {
  const metadata =
    message.session?.metadata ?? message.chat?.metadata ?? message.call?.metadata;
  const propertyAttribution =
    metadata?.propertyAcquisitionAttribution &&
    typeof metadata.propertyAcquisitionAttribution === "object"
      ? metadata.propertyAcquisitionAttribution
      : undefined;

  return compactObject({
    provider: "vapi",
    source,
    vapiToolCallId: toolCallId,
    vapiProviderMessageId: providerMessageId,
    vapiSessionId: sessionId,
    vapiChatId: requestContext.chatId ?? message.chat?.id,
    vapiCallId: message.call?.id,
    vapiPhoneNumberId: message.phoneNumber?.id,
    transport: str(metadata?.transport),
    propertyAcquisitionAttribution: propertyAttribution,
  }) as Prisma.InputJsonObject;
}

async function resolveVapiChatContext(
  message: ToolCallsMessage,
  fallbackMessage: string | undefined,
  requestContext: VapiRequestContext,
): Promise<{ sessionId?: string; inboundMessage?: string }> {
  const knownSessionId =
    requestContext.sessionId ?? message.session?.id ?? message.chat?.sessionId;
  const chatId = requestContext.chatId ?? message.chat?.id;
  if ((knownSessionId && fallbackMessage) || !chatId) {
    return { sessionId: knownSessionId, inboundMessage: fallbackMessage };
  }

  const apiKey = process.env.VAPI_PRIVATE_KEY?.trim();
  if (!apiKey) {
    return { sessionId: knownSessionId, inboundMessage: fallbackMessage };
  }

  try {
    const response = await fetch(
      `https://api.vapi.ai/chat/${encodeURIComponent(chatId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!response.ok) {
      console.warn("[vapi webhook] chat context lookup failed", {
        status: response.status,
        chatId,
      });
      return { sessionId: knownSessionId, inboundMessage: fallbackMessage };
    }

    const chat = (await response.json()) as {
      sessionId?: string;
      input?: unknown;
      messages?: unknown;
    };
    return {
      sessionId: knownSessionId ?? str(chat.sessionId),
      inboundMessage:
        fallbackMessage ??
        extractLatestUserMessage(chat.input) ??
        extractLatestUserMessage(chat.messages),
    };
  } catch (error) {
    console.warn("[vapi webhook] chat context lookup error", {
      chatId,
      error,
    });
    return { sessionId: knownSessionId, inboundMessage: fallbackMessage };
  }
}

async function resolveVapiSessionCustomerNumber(
  sessionId: string | undefined,
): Promise<string | undefined> {
  const apiKey = process.env.VAPI_PRIVATE_KEY?.trim();
  if (!apiKey || !sessionId) return undefined;

  try {
    const response = await fetch(
      `https://api.vapi.ai/session/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!response.ok) {
      console.warn("[vapi webhook] session customer lookup failed", {
        status: response.status,
        sessionId,
      });
      return undefined;
    }

    const session = (await response.json()) as {
      customer?: { number?: unknown };
    };
    return phone(session.customer?.number);
  } catch (error) {
    console.warn("[vapi webhook] session customer lookup error", {
      sessionId,
      error,
    });
    return undefined;
  }
}

async function forwardAssistantEventToBeyflo(
  body: { message?: VapiMessage } | VapiMessage,
): Promise<NextResponse> {
  try {
    const beyfloSecret = process.env.BEYFLO_VAPI_WEBHOOK_SECRET?.trim();
    const response = await fetch(BEYFLO_VAPI_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(beyfloSecret && { "x-vapi-secret": beyfloSecret }),
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("[vapi webhook] Beyflo forwarding failed", {
        status: response.status,
      });
      return NextResponse.json({
        ok: true,
        forwarded: false,
        upstreamStatus: response.status,
      });
    }

    return NextResponse.json(payload ?? { ok: true, forwarded: true });
  } catch (error) {
    console.error("[vapi webhook] Beyflo forwarding error", error);
    return NextResponse.json({ ok: true, forwarded: false });
  }
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
  return prisma.lead.upsert({
    where: { callId },
    update: {},
    create: {
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
  toolCallId: string,
  sourceFromMessage: string,
  args: Record<string, unknown>,
  message: ToolCallsMessage,
  requestContext: VapiRequestContext,
) {
  const isTest = bool(args.isTest);
  const source =
    isTest || sourceFromMessage.startsWith("test-")
      ? "test-sms-vapi"
      : "sms-vapi";
  const address = str(args.address);
  const fallbackInboundMessage =
    str(args.inboundMessage) ?? str(args.message) ?? address;
  const chatContext = await resolveVapiChatContext(
    message,
    fallbackInboundMessage,
    requestContext,
  );
  const contactPhone =
    phone(customerPhone(message)) ??
    (await resolveVapiSessionCustomerNumber(chatContext.sessionId)) ??
    phone(args.phone);
  const inboundMessage = chatContext.inboundMessage;
  const resolvedConversationId = chatContext.sessionId ?? conversationId;
  const providerMessageId =
    requestContext.chatId ?? message.chat?.id ?? toolCallId;
  const firstName = str(args.firstName);
  const lastName = str(args.lastName);
  const email = str(args.email);
  const condition = str(args.condition);
  const timeline = str(args.timeline);
  const reason = str(args.reason);

  const decision = evaluateInboundSms({
    sender: contactPhone,
    message: inboundMessage,
    address,
    source,
    isTest,
    excludedNumbers: notificationExcludedNumbers(
      process.env.TWILIO_FROM_NUMBER,
      process.env.NOTIFICATION_PHONE_NUMBERS,
    ),
  });

  if (!decision.shouldPersist || !decision.normalizedSender) {
    return {
      ok: true,
      ignored: true,
      reason: decision.reason,
      test: decision.kind === "test",
    };
  }

  const receivedAt = inboundTimestamp(message);
  const attribution = smsAttribution(
    message,
    source,
    toolCallId,
    providerMessageId,
    resolvedConversationId,
    requestContext,
  );
  const hasDetails = Boolean(condition || timeline || reason);
  const shouldComplete =
    decision.kind === "prospect" && Boolean(address && decision.normalizedSender);
  const placeholderAddress = "(pending SMS address)";

  let updatedLead: Lead;
  try {
    updatedLead = await prisma.lead.upsert({
      where: { callId: resolvedConversationId },
      create: {
        address: address ?? placeholderAddress,
        source,
        channel: "SMS",
        phone: decision.normalizedSender,
        callId: resolvedConversationId,
        smsProvider: "vapi",
        providerMessageId,
        inboundMessage: decision.normalizedMessage ?? address,
        firstInboundAt: receivedAt,
        lastInboundAt: receivedAt,
        attribution,
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(condition && { condition }),
        ...(timeline && { timeline }),
        ...(reason && { reason }),
        step: hasDetails ? 3 : address ? 2 : 1,
        ...(decision.kind === "opt_out" && { smsOptedOutAt: receivedAt }),
      },
      update: {
        ...(address && { address }),
        source,
        channel: "SMS",
        phone: decision.normalizedSender,
        smsProvider: "vapi",
        providerMessageId,
        ...(decision.normalizedMessage && {
          inboundMessage: decision.normalizedMessage,
        }),
        lastInboundAt: receivedAt,
        attribution,
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(condition && { condition }),
        ...(timeline && { timeline }),
        ...(reason && { reason }),
        step: hasDetails ? 3 : address ? 2 : 1,
        ...(decision.kind === "opt_out" && { smsOptedOutAt: receivedAt }),
        ...(decision.kind === "opt_in" && { smsOptedOutAt: null }),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const duplicate = await prisma.lead.findUnique({
        where: { providerMessageId },
      });
      if (duplicate) {
        return {
          ok: true,
          leadId: duplicate.id,
          completed: duplicate.completed,
          duplicate: true,
          test: source === "test-sms-vapi",
        };
      }
    }
    throw error;
  }

  const completionClaim = shouldComplete
    ? await prisma.lead.updateMany({
        where: { id: updatedLead.id, completed: false },
        data: { completed: true, step: 4 },
      })
    : { count: 0 };

  const alertEligible = decision.shouldAlert && !updatedLead.smsOptedOutAt;
  const [emailClaim, smsClaim] = alertEligible
    ? await prisma.$transaction([
        prisma.lead.updateMany({
          where: { id: updatedLead.id, smsEmailAlertClaimedAt: null },
          data: { smsEmailAlertClaimedAt: receivedAt },
        }),
        prisma.lead.updateMany({
          where: { id: updatedLead.id, smsInternalAlertClaimedAt: null },
          data: { smsInternalAlertClaimedAt: receivedAt },
        }),
      ])
    : [{ count: 0 }, { count: 0 }];

  updatedLead =
    (await prisma.lead.findUnique({ where: { id: updatedLead.id } })) ??
    updatedLead;

  const dispatch = notificationDispatchPlan(emailClaim.count, smsClaim.count);
  const firstMessageEffects: Array<Promise<unknown>> = [];
  if (dispatch.email) {
    firstMessageEffects.push(sendInboundSmsLeadAlert(updatedLead));
  }
  if (dispatch.sms) {
    firstMessageEffects.push(sendInboundSmsLeadSmsAlert(updatedLead));
  }
  if (dispatch.acquisition) {
    firstMessageEffects.push(
      notifyPropertyAcquisitionEngine({
        eventType: "funnel_sms_started",
        lead: updatedLead,
        attribution: attribution as Record<string, unknown>,
      }),
    );
  }

  if (completionClaim.count === 1) {
    const metaEventId = createServerMetaEventId("lead_sms", updatedLead.id);
    firstMessageEffects.push(
      notifyPropertyAcquisitionEngine({
        eventType: "funnel_sms_completed",
        lead: updatedLead,
        attribution: attribution as Record<string, unknown>,
      }),
      sendMetaLeadEvent({
        lead: updatedLead,
        eventId: metaEventId,
        browser: {},
      }),
    );
  }

  const effects = await Promise.allSettled(firstMessageEffects);
  for (const effect of effects) {
    if (effect.status === "rejected") {
      console.error("[vapi webhook] SMS lead side effect failed", effect.reason);
    }
  }

  return {
    ok: true,
    leadId: updatedLead.id,
    completed: updatedLead.completed,
    test: decision.kind === "test",
    kind: decision.kind,
    notificationClaimed: dispatch.acquisition,
    ...(decision.replyInstruction && {
      replyInstruction: decision.replyInstruction,
    }),
    ...(decision.kind === "opt_out" && { suppressReply: true }),
  };
}

async function handleChatCreated(message: ChatCreatedMessage) {
  const chatId = str(message.chat.id);
  const sessionId = str(message.chat.sessionId);
  const conversationId = sessionId ?? chatId;
  if (!chatId || !conversationId) {
    return { ok: false, error: "missing chat or session id" };
  }

  const inboundMessage =
    extractLatestUserMessage(message.chat.input) ??
    extractLatestUserMessage(message.chat.messages);
  const toolMessage: ToolCallsMessage = {
    type: "tool-calls",
    timestamp: message.timestamp,
    customer: message.customer,
    phoneNumber: message.phoneNumber,
    chat: {
      id: chatId,
      sessionId,
      metadata: message.chat.metadata,
      customer: message.customer,
    },
  };

  return handleSaveSmsLead(
    conversationId,
    `chat-created:${chatId}`,
    "sms-vapi",
    { inboundMessage },
    toolMessage,
    { chatId, sessionId },
  );
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
      const source = interactionSource(m);
      const requestContext: VapiRequestContext = {
        chatId: str(req.headers.get("x-chat-id")),
        sessionId: str(req.headers.get("x-session-id")),
      };
      const callId = interactionId(m, source, requestContext);
      if (!callId) {
        return NextResponse.json(
          { error: "missing interaction id" },
          { status: 400 },
        );
      }
      const metadata = m.call?.metadata;
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
              call.id,
              source,
              args,
              m,
              requestContext,
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

    if (type === "chat.created") {
      const outcome = await handleChatCreated(
        msg as unknown as ChatCreatedMessage,
      );
      return NextResponse.json({ received: true, ...outcome });
    }

    if (type === "end-of-call-report") {
      await handleEndOfCall(msg as unknown as EndOfCallMessage);
      return forwardAssistantEventToBeyflo(body);
    }

    // This assistant's legacy server URL points at Beyflo. Once chat.created
    // events are routed here for deterministic SMS capture, preserve the
    // existing voice/event behavior by forwarding everything else upstream.
    return forwardAssistantEventToBeyflo(body);
  } catch (err) {
    console.error("[vapi webhook]", type, err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
}

// GET for health checks / Vapi's verification pings.
export async function GET() {
  return NextResponse.json({ ok: true, service: "vapi-webhook" });
}
