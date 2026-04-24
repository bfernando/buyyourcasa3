import { Lead } from "@prisma/client";

type SmsAlertResult =
  | { ok: true; ids: string[] }
  | { ok: false; skipped?: boolean; reason: string };

const TWILIO_MESSAGES_URL = "https://api.twilio.com/2010-04-01/Accounts";
const NOT_PROVIDED = "Not provided";

function valueOrFallback(value: unknown): string {
  if (value === null || value === undefined) return NOT_PROVIDED;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : NOT_PROVIDED;
  }
  return String(value);
}

function notificationNumbers(): string[] {
  return (
    process.env.NOTIFICATION_PHONE_NUMBERS?.split(",")
      .map((number) => number.trim())
      .filter(Boolean) ?? []
  );
}

function buildSmsBody(lead: Lead): string {
  const name = [lead.firstName, lead.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  return [
    "New completed BuyYourCasa lead",
    `Address: ${valueOrFallback(lead.address)}`,
    `Name: ${valueOrFallback(name)}`,
    `Phone: ${valueOrFallback(lead.phone)}`,
    `Email: ${valueOrFallback(lead.email)}`,
    `Timeline: ${valueOrFallback(lead.timeline)}`,
    `Condition: ${valueOrFallback(lead.condition)}`,
  ].join("\n");
}

async function sendTwilioMessage(to: string, body: string): Promise<string> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    throw new Error("missing_config");
  }

  const params = new URLSearchParams({
    To: to,
    From: from,
    Body: body,
  });

  const response = await fetch(
    `${TWILIO_MESSAGES_URL}/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${accountSid}:${authToken}`,
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | { sid?: string; message?: string; code?: number }
    | null;

  if (!response.ok) {
    throw new Error(
      `twilio_error:${payload?.code ?? response.status}:${payload?.message ?? response.statusText}`,
    );
  }

  return payload?.sid ?? "";
}

export async function sendLeadCompletionSmsAlert(
  lead: Lead,
): Promise<SmsAlertResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  const to = notificationNumbers();

  if (!accountSid || !authToken || !from || to.length === 0) {
    console.warn("[lead-sms-alert] missing SMS configuration", {
      leadId: lead.id,
      hasAccountSid: Boolean(accountSid),
      hasAuthToken: Boolean(authToken),
      hasFrom: Boolean(from),
      recipientCount: to.length,
    });
    return { ok: false, skipped: true, reason: "missing_config" };
  }

  try {
    const body = buildSmsBody(lead);
    const ids = await Promise.all(
      to.map((number) => sendTwilioMessage(number, body)),
    );

    return { ok: true, ids };
  } catch (error) {
    console.error("[lead-sms-alert] send failed", {
      leadId: lead.id,
      error,
    });
    return { ok: false, reason: "send_failed" };
  }
}

export async function sendTestSmsAlert(): Promise<SmsAlertResult> {
  const to = notificationNumbers();
  const body =
    "BuyYourCasa test notification: SMS alerts are connected for new completed leads.";

  if (to.length === 0) {
    return { ok: false, skipped: true, reason: "missing_recipients" };
  }

  try {
    const ids = await Promise.all(
      to.map((number) => sendTwilioMessage(number, body)),
    );
    return { ok: true, ids };
  } catch (error) {
    console.error("[lead-sms-alert] test send failed", { error });
    return { ok: false, reason: "send_failed" };
  }
}
