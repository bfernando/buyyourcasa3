export const ADVERTISED_SMS_NUMBER = "+16195470490";

const OPT_OUT_KEYWORDS = new Set([
  "stop",
  "stop please",
  "please stop",
  "stopall",
  "unsubscribe",
  "unsubscribe me",
  "cancel",
  "end",
  "quit",
  "remove me",
]);
const HELP_KEYWORDS = new Set(["help", "info"]);
const OPT_IN_KEYWORDS = new Set(["start", "unstop"]);

export type InboundSmsKind =
  | "prospect"
  | "opt_out"
  | "help"
  | "opt_in"
  | "test"
  | "ignored";

export type InboundSmsDecision = {
  kind: InboundSmsKind;
  normalizedSender?: string;
  normalizedMessage?: string;
  shouldPersist: boolean;
  shouldAlert: boolean;
  reason?: string;
  replyInstruction?: string;
};

export type NotificationDispatchPlan = {
  email: boolean;
  sms: boolean;
  acquisition: boolean;
};

type EvaluateInboundSmsInput = {
  sender?: string;
  message?: string;
  address?: string;
  source: string;
  isTest: boolean;
  excludedNumbers: Array<string | undefined>;
};

function normalizeMessage(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, 1600) : undefined;
}

function messageContent(value: unknown): string | undefined {
  if (typeof value === "string") return normalizeMessage(value);
  if (!Array.isArray(value)) return undefined;

  const text = value
    .map((part) => {
      if (typeof part === "string") return part;
      if (!part || typeof part !== "object") return "";
      const record = part as Record<string, unknown>;
      return typeof record.text === "string"
        ? record.text
        : typeof record.content === "string"
          ? record.content
          : "";
    })
    .filter(Boolean)
    .join(" ");
  return normalizeMessage(text);
}

export function extractLatestUserMessage(value: unknown): string | undefined {
  if (typeof value === "string") return normalizeMessage(value);
  if (!Array.isArray(value)) return undefined;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    const item = value[index];
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const role = typeof record.role === "string" ? record.role.toLowerCase() : "";
    if (role && !["user", "customer"].includes(role)) continue;
    const content = messageContent(record.content ?? record.message ?? record.text);
    if (content) return content;
  }
  return undefined;
}

export function normalizePhoneNumber(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("{{") || trimmed.includes("}}")) {
    return undefined;
  }

  const withoutChannelPrefix = trimmed.replace(/^(?:sms|tel):/i, "");
  const digits = withoutChannelPrefix.replace(/\D/g, "");

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return undefined;
}

export function notificationExcludedNumbers(
  twilioFromNumber: string | undefined,
  notificationPhoneNumbers: string | undefined,
): string[] {
  return [
    ADVERTISED_SMS_NUMBER,
    twilioFromNumber,
    ...(notificationPhoneNumbers?.split(",") ?? []),
  ]
    .map(normalizePhoneNumber)
    .filter((number): number is string => Boolean(number));
}

export function notificationDispatchPlan(
  emailClaimCount: number,
  smsClaimCount: number,
): NotificationDispatchPlan {
  const email = emailClaimCount === 1;
  const sms = smsClaimCount === 1;
  return { email, sms, acquisition: email || sms };
}

export function isExplicitSmsQaMessage(message: string | undefined): boolean {
  if (!message) return false;
  return /\b(?:automated qa|automated quality assurance|production qa)\b/i.test(
    message,
  );
}

export function evaluateInboundSms({
  sender,
  message,
  address,
  source,
  isTest,
  excludedNumbers,
}: EvaluateInboundSmsInput): InboundSmsDecision {
  const normalizedSender = normalizePhoneNumber(sender);
  const normalizedMessage = normalizeMessage(message);
  const normalizedExcludedNumbers = new Set(
    excludedNumbers
      .map(normalizePhoneNumber)
      .filter((number): number is string => Boolean(number)),
  );

  if (!normalizedSender) {
    return {
      kind: "ignored",
      shouldPersist: false,
      shouldAlert: false,
      reason: "invalid_or_system_sender",
    };
  }

  if (normalizedExcludedNumbers.has(normalizedSender)) {
    return {
      kind: "ignored",
      normalizedSender,
      normalizedMessage,
      shouldPersist: false,
      shouldAlert: false,
      reason: "internal_sender",
    };
  }

  const keyword = normalizedMessage
    ?.toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
  if (keyword && OPT_OUT_KEYWORDS.has(keyword)) {
    return {
      kind: "opt_out",
      normalizedSender,
      normalizedMessage,
      shouldPersist: true,
      shouldAlert: false,
      reason: "opt_out_keyword",
    };
  }

  if (keyword && HELP_KEYWORDS.has(keyword)) {
    return {
      kind: "help",
      normalizedSender,
      normalizedMessage,
      shouldPersist: true,
      shouldAlert: false,
      reason: "help_keyword",
      replyInstruction:
        "Reply once that Mi Casa Investment Group helps property owners request a no-obligation cash offer. Ask for the property address to continue and mention STOP to opt out.",
    };
  }

  if (keyword && OPT_IN_KEYWORDS.has(keyword)) {
    return {
      kind: "opt_in",
      normalizedSender,
      normalizedMessage,
      shouldPersist: true,
      shouldAlert: false,
      reason: "opt_in_keyword",
      replyInstruction:
        "Acknowledge the opt-in once and ask for the property address they may want to sell.",
    };
  }

  if (isTest || source.startsWith("test-")) {
    return {
      kind: "test",
      normalizedSender,
      normalizedMessage,
      shouldPersist: true,
      shouldAlert: false,
      reason: "test_message",
    };
  }

  // The Vapi tool is restricted to seller-intent SMS conversations. At this
  // boundary, a valid external sender plus either the current message or a
  // captured address is the safest server-side prospect signal available.
  if (!normalizedMessage && !address?.trim()) {
    return {
      kind: "ignored",
      normalizedSender,
      shouldPersist: false,
      shouldAlert: false,
      reason: "empty_message",
    };
  }

  return {
    kind: "prospect",
    normalizedSender,
    normalizedMessage,
    shouldPersist: true,
    shouldAlert: true,
    replyInstruction: address?.trim()
      ? "Thank the seller briefly and say the Mi Casa team will follow up. Ask only the next missing intake question."
      : "Thank the seller for reaching out to Mi Casa Investment Group and ask for the property address they may want to sell.",
  };
}
