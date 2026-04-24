import { Lead } from "@prisma/client";
import { Resend } from "resend";

type LeadAlertResult =
  | { ok: true; id?: string | null }
  | { ok: false; skipped?: boolean; reason: string };

const NOT_PROVIDED = "Not provided";

function valueOrFallback(value: unknown): string {
  if (value === null || value === undefined) return NOT_PROVIDED;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : NOT_PROVIDED;
  }
  return String(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles",
  }).format(date);
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:600;width:180px;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function buildHtmlBody(lead: Lead): string {
  const rows = [
    ["Lead ID", lead.id],
    ["Source", valueOrFallback(lead.source)],
    ["Address", valueOrFallback(lead.address)],
    ["First Name", valueOrFallback(lead.firstName)],
    ["Last Name", valueOrFallback(lead.lastName)],
    ["Phone", valueOrFallback(lead.phone)],
    ["Email", valueOrFallback(lead.email)],
    ["Condition", valueOrFallback(lead.condition)],
    ["Timeline", valueOrFallback(lead.timeline)],
    ["Reason", valueOrFallback(lead.reason)],
    ["Created At", formatTimestamp(lead.createdAt)],
    ["Completed At", formatTimestamp(lead.updatedAt)],
  ];

  if (lead.callId) {
    rows.push(["Call ID", lead.callId]);
  }
  if (lead.callDurationSec !== null && lead.callDurationSec !== undefined) {
    rows.push(["Call Duration (sec)", String(lead.callDurationSec)]);
  }
  if (lead.recordingUrl) {
    rows.push(["Recording URL", lead.recordingUrl]);
  }

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f3f4f6;color:#111827;font-family:Arial,sans-serif;">
    <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="padding:20px 24px;background:#111827;color:#f9fafb;">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#d1d5db;">BuyYourCasa</p>
        <h1 style="margin:0;font-size:24px;line-height:1.2;">New Completed Lead</h1>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
          A lead completed the funnel and is ready for follow-up.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.5;">
          ${rows.map(([label, value]) => detailRow(label, value)).join("")}
        </table>
      </div>
    </div>
  </body>
</html>`;
}

function buildTextBody(lead: Lead): string {
  const lines = [
    "New completed lead",
    "",
    `Lead ID: ${valueOrFallback(lead.id)}`,
    `Source: ${valueOrFallback(lead.source)}`,
    `Address: ${valueOrFallback(lead.address)}`,
    `First Name: ${valueOrFallback(lead.firstName)}`,
    `Last Name: ${valueOrFallback(lead.lastName)}`,
    `Phone: ${valueOrFallback(lead.phone)}`,
    `Email: ${valueOrFallback(lead.email)}`,
    `Condition: ${valueOrFallback(lead.condition)}`,
    `Timeline: ${valueOrFallback(lead.timeline)}`,
    `Reason: ${valueOrFallback(lead.reason)}`,
    `Created At: ${formatTimestamp(lead.createdAt)}`,
    `Completed At: ${formatTimestamp(lead.updatedAt)}`,
  ];

  if (lead.callId) {
    lines.push(`Call ID: ${lead.callId}`);
  }
  if (lead.callDurationSec !== null && lead.callDurationSec !== undefined) {
    lines.push(`Call Duration (sec): ${lead.callDurationSec}`);
  }
  if (lead.recordingUrl) {
    lines.push(`Recording URL: ${lead.recordingUrl}`);
  }

  return lines.join("\n");
}

export async function sendLeadCompletionAlert(
  lead: Lead,
): Promise<LeadAlertResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.LEAD_ALERT_TO?.trim();
  const from = process.env.LEAD_ALERT_FROM?.trim();

  if (!apiKey || !to || !from) {
    console.warn("[lead-alert] missing email configuration", {
      leadId: lead.id,
      hasResendApiKey: Boolean(apiKey),
      hasLeadAlertTo: Boolean(to),
      hasLeadAlertFrom: Boolean(from),
    });
    return { ok: false, skipped: true, reason: "missing_config" };
  }

  try {
    const resend = new Resend(apiKey);
    const subject = `New completed lead: ${valueOrFallback(lead.address)}`;
    const { data, error } = await resend.emails.send(
      {
        from,
        to,
        subject,
        html: buildHtmlBody(lead),
        text: buildTextBody(lead),
      },
      {
        headers: {
          "Idempotency-Key": `lead-completion-${lead.id}`,
        },
      },
    );

    if (error) {
      console.error("[lead-alert] resend returned error", {
        leadId: lead.id,
        error,
      });
      return { ok: false, reason: "provider_error" };
    }

    return { ok: true, id: data?.id };
  } catch (error) {
    console.error("[lead-alert] send failed", {
      leadId: lead.id,
      error,
    });
    return { ok: false, reason: "send_failed" };
  }
}
