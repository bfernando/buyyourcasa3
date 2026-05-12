"use client";

/**
 * components/VoiceAgent.tsx
 * ────────────────────────
 * Full-screen, voice-first lead capture shell that replaces the multi-step
 * form as the primary conversion path.
 *
 * Key behaviors:
 *   • Renders as a fixed full-viewport overlay (z-50) with body-scroll lock,
 *     so the user can't scroll past it on first load. Content below still
 *     exists in the DOM (Googlebot crawls everything).
 *   • One-tap to start — "Tap to Talk" button opens mic, starts Vapi call,
 *     agent speaks first.
 *   • Live transcript types onto the screen in sync with the assistant's
 *     speech (driven by Vapi's real-time `transcript` events, not a fake
 *     setTimeout — stays in sync naturally).
 *   • On mic denial: friendly nudge explaining how to grant it; plus a
 *     quiet fallback link to the form for users who genuinely can't use mic.
 *   • On call end: clean success state (thanks + "we'll call within 24 hrs"),
 *     then auto-dismiss the overlay after ~5s so users land on the rest
 *     of the page naturally.
 *   • "Learn more" link dismisses the overlay manually — surface the rest
 *     of the page to anyone who wants to read more.
 */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Vapi from "@vapi-ai/web";
import { content, type Locale } from "@/lib/content";
import BrandLogo from "@/components/BrandLogo";
import {
  createMetaEventId,
  getMetaBrowserContext,
  trackLeadComplete,
  trackLeadStarted,
} from "@/lib/meta-pixel";
import { assistantFor } from "@/lib/vapi/assistants";

type Phase =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "thinking"
  | "mic-blocked"
  | "error"
  | "success";

type VoiceErrorCode =
  | "missing_public_key"
  | "microphone_blocked"
  | "vapi_start_failed"
  | "vapi_runtime_error"
  | "send_typed_message_failed"
  | "send_queued_message_failed"
  | "call_ended_early"
  | "unknown_call_end";

type Turn = {
  role: "user" | "assistant";
  text: string;
  // transcriptType: "partial" emits a running update we can merge onto the last
  // turn; "final" commits it. We track the latest partial per role separately.
  partial?: boolean;
};

type LeadSummary = {
  address?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  condition?: string;
  timeline?: string;
  reason?: string;
};

type Props = {
  lang?: Locale;
  /** When true, the agent renders as a fixed full-viewport overlay and
   *  locks body scroll until it's dismissed. Default: true. Set false to
   *  render inline (e.g. if you ever add a /chat page). */
  shellMode?: boolean;
  /** When the overlay is dismissed (via "learn more" link or auto-dismiss
   *  after success), this callback fires so the host page can e.g. scroll
   *  the legacy form into view. */
  onDismiss?: () => void;
  /** Render the legacy form as the fallback when the user clicks
   *  "Prefer to type?". We pass this in from the page so we don't
   *  hard-couple VoiceAgent to LeadForm/LeadFormMobile. */
  fallbackForm?: React.ReactNode;
};

function normalizeMessageText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizedForIntent(value: string) {
  return normalizeMessageText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s']/gi, "");
}

function isWrapUpReply(value: string) {
  const text = normalizedForIntent(value);
  if (!text) return false;

  return (
    /\b(bye|goodbye|see you|talk to you later|i'?m done|all done|that'?s all|nothing else|no thanks|no thank you)\b/i.test(
      text,
    ) ||
    /\b(adios|hasta luego|nos vemos|ya termine|ya terminamos|listo|nada mas|no gracias|eso es todo)\b/i.test(
      text,
    ) ||
    /^(no|nope|nah|done|listo|adios|bye)$/i.test(text)
  );
}

function isAssistantClosingCheck(value: string) {
  const text = normalizedForIntent(value);

  return (
    /\b(anything else|something else|else i can help|here if you need)\b/i.test(
      text,
    ) ||
    /\b(algo mas|pueda ayudar|puedo ayudar|aqui estoy)\b/i.test(text)
  );
}

function isAssistantFinalFarewell(value: string) {
  const text = normalizedForIntent(value);

  return (
    isAssistantCompletedFarewell(value) ||
    /\b(have a great day|goodbye)\b/i.test(text) ||
    /\b(hasta luego|que tengas buen dia)\b/i.test(text)
  );
}

function isAssistantCompletedFarewell(value: string) {
  const text = normalizedForIntent(value);

  return (
    /\b(you'?re all set|you are all set|within 24 hours)\b/i.test(text) ||
    /\b(todo listo|dentro de 24 horas)\b/i.test(
      text,
    )
  );
}

function cleanSummaryValue(value?: string) {
  if (!value || value === "(pending)") return undefined;
  return value;
}

function formatSummaryEnum(
  value: string | undefined,
  labels: Record<string, string>,
  fallback: string,
) {
  const cleanValue = cleanSummaryValue(value);
  if (!cleanValue) return fallback;
  return labels[cleanValue] ?? cleanValue.replace(/_/g, " ");
}

function isMicrophoneError(value: string) {
  return (
    /permission|denied|notallowed|microphone|getusermedia/i.test(value) ||
    value.includes("NotAllowedError")
  );
}

function sanitizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message.slice(0, 500),
    };
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return {
      name:
        typeof record.name === "string"
          ? record.name.slice(0, 120)
          : undefined,
      description: String(error).slice(0, 500),
      message:
        typeof record.message === "string"
          ? record.message.slice(0, 500)
          : undefined,
      code:
        typeof record.code === "string"
          ? record.code.slice(0, 120)
          : undefined,
      status:
        typeof record.status === "string" || typeof record.status === "number"
          ? record.status
          : undefined,
      keys: Object.keys(record).slice(0, 20),
    };
  }

  return { message: String(error).slice(0, 500) };
}

function voiceErrorMessage(code: VoiceErrorCode | null, lang: Locale) {
  const messages = {
    en: {
      missing_public_key:
        "The voice service is missing its browser key. Please use the form while we fix it.",
      microphone_blocked:
        "Your browser blocked the microphone. Allow microphone access, refresh, and try again.",
      vapi_start_failed:
        "The voice service did not start. Please try again, or use the form if it keeps happening.",
      vapi_runtime_error:
        "The voice service disconnected unexpectedly. Please try again, or use the form.",
      send_typed_message_failed:
        "Your typed reply could not be sent to the voice assistant. Please try again.",
      send_queued_message_failed:
        "Your typed reply could not be sent after the call connected. Please try again.",
      call_ended_early:
        "The call ended before the conversation started. Please try again, or use the form.",
      unknown_call_end:
        "The call ended unexpectedly. Please try again, or use the form.",
    },
    es: {
      missing_public_key:
        "Al servicio de voz le falta su clave del navegador. Usa el formulario mientras lo corregimos.",
      microphone_blocked:
        "Tu navegador bloqueó el micrófono. Permite el acceso, recarga la página e intenta de nuevo.",
      vapi_start_failed:
        "El servicio de voz no inició. Intenta de nuevo, o usa el formulario si sigue pasando.",
      vapi_runtime_error:
        "El servicio de voz se desconectó inesperadamente. Intenta de nuevo, o usa el formulario.",
      send_typed_message_failed:
        "No se pudo enviar tu respuesta escrita al asistente. Intenta de nuevo.",
      send_queued_message_failed:
        "No se pudo enviar tu respuesta escrita después de conectar la llamada. Intenta de nuevo.",
      call_ended_early:
        "La llamada terminó antes de iniciar la conversación. Intenta de nuevo, o usa el formulario.",
      unknown_call_end:
        "La llamada terminó inesperadamente. Intenta de nuevo, o usa el formulario.",
    },
  } satisfies Record<Locale, Record<VoiceErrorCode, string>>;

  if (!code) return undefined;
  return messages[lang][code];
}

export default function VoiceAgent({
  lang = "en",
  shellMode = true,
  onDismiss,
  fallbackForm,
}: Props) {
  const c = content[lang].voice;
  const successName = content[lang].form.successTitle; // "You're all set," / "Todo listo,"

  const [phase, setPhase] = useState<Phase>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [volume, setVolume] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [capturedFirstName, setCapturedFirstName] = useState<string | null>(
    null,
  );
  const [typedInput, setTypedInput] = useState("");
  const [leadSummary, setLeadSummary] = useState<LeadSummary>({});
  const [errorCode, setErrorCode] = useState<VoiceErrorCode | null>(null);

  const vapiRef = useRef<Vapi | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const pendingTypedMessagesRef = useRef<string[]>([]);
  const optimisticTypedMessagesRef = useRef<string[]>([]);
  const callEndedReasonRef = useRef<string | null>(null);
  const callStartedAtRef = useRef<number | null>(null);
  const callConnectedRef = useRef(false);
  const leadCompletedRef = useRef(false);
  const leadPixelTrackedRef = useRef(false);
  const voiceLeadEventIdRef = useRef<string | null>(null);
  const manualStopRef = useRef(false);
  const gracefulStopRef = useRef(false);
  const handledCallEndRef = useRef(false);
  const assistantOfferedClosingRef = useRef(false);
  const assistantFinalFarewellRef = useRef(false);
  const assistantCompletedFarewellRef = useRef(false);
  const successDismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const callEndFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reportClientEvent = useCallback(
    (event: string, details?: Record<string, unknown>) => {
      const payload = {
        event,
        source: "voice-agent",
        lang,
        phase: phaseRef.current,
        path:
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : undefined,
        eventId: voiceLeadEventIdRef.current,
        timestamp: new Date().toISOString(),
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        details,
      };

      void fetch("/api/client-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch((error) => {
        console.warn("[VoiceAgent] client event report failed", error);
      });
    },
    [lang],
  );

  const enterErrorState = useCallback(
    (code: VoiceErrorCode, details?: Record<string, unknown>) => {
      setErrorCode(code);
      setPhase(code === "microphone_blocked" ? "mic-blocked" : "error");
      reportClientEvent(`voice_error_${code}`, details);
    },
    [reportClientEvent],
  );

  // ─── Body-scroll lock while the overlay is mounted ──────────────────────
  useEffect(() => {
    if (!shellMode || dismissed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [shellMode, dismissed]);

  // ─── Auto-scroll transcript to bottom as new turns arrive ───────────────
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const flushPendingTypedMessages = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi || pendingTypedMessagesRef.current.length === 0) return;

    const queuedMessages = [...pendingTypedMessagesRef.current];
    pendingTypedMessagesRef.current = [];
    setPhase("thinking");

    for (const message of queuedMessages) {
      try {
        vapi.send({
          type: "add-message",
          message: { role: "user", content: message },
          triggerResponseEnabled: true,
        });
      } catch (error) {
        console.error("[VoiceAgent] send queued typed message failed", error);
        pendingTypedMessagesRef.current.unshift(message);
        enterErrorState("send_queued_message_failed", {
          error: sanitizeError(error),
        });
        break;
      }
    }
  }, [enterErrorState]);

  const clearCallTimers = useCallback(() => {
    if (successDismissTimeoutRef.current) {
      clearTimeout(successDismissTimeoutRef.current);
      successDismissTimeoutRef.current = null;
    }

    if (callEndFallbackTimeoutRef.current) {
      clearTimeout(callEndFallbackTimeoutRef.current);
      callEndFallbackTimeoutRef.current = null;
    }
  }, []);

  const finishCall = useCallback(
    (endedReason?: string) => {
      if (handledCallEndRef.current) return;
      handledCallEndRef.current = true;

      if (callEndFallbackTimeoutRef.current) {
        clearTimeout(callEndFallbackTimeoutRef.current);
        callEndFallbackTimeoutRef.current = null;
      }

      pendingTypedMessagesRef.current = [];
      optimisticTypedMessagesRef.current = [];

      const reason = endedReason ?? callEndedReasonRef.current ?? undefined;

      if (
        reason === "customer-did-not-give-microphone-permission" ||
        reason === "call.in-progress.error-assistant-did-not-receive-customer-audio"
      ) {
        enterErrorState("microphone_blocked", { endedReason: reason });
        return;
      }

      if (leadCompletedRef.current || assistantCompletedFarewellRef.current) {
        setPhase("success");
        successDismissTimeoutRef.current = setTimeout(() => {
          setDismissed(true);
          onDismiss?.();
        }, 5000);
        return;
      }

      const gracefulAssistantEnd =
        reason === "assistant-ended-call" ||
        reason === "assistant-ended-call-after-message-spoken" ||
        reason === "assistant-said-end-call-phrase";

      if (
        manualStopRef.current ||
        gracefulStopRef.current ||
        gracefulAssistantEnd ||
        reason === "customer-ended-call" ||
        reason === "silence-timed-out"
      ) {
        setPhase("idle");
        setHasStartedConversation(false);
        setTurns([]);
        return;
      }

      const elapsedMs = callStartedAtRef.current
        ? Date.now() - callStartedAtRef.current
        : undefined;
      enterErrorState(
        callConnectedRef.current ? "unknown_call_end" : "call_ended_early",
        {
          endedReason: reason,
          elapsedMs,
          connected: callConnectedRef.current,
        },
      );
    },
    [enterErrorState, onDismiss],
  );

  const syncLeadSummary = useCallback(
    (
      calls: Array<{
        function?: { name?: string; arguments?: unknown };
      }>,
    ) => {
      setLeadSummary((prev) => {
        const next = { ...prev };

        for (const call of calls) {
          const raw = call.function?.arguments;
          const name = call.function?.name;
          let args: Record<string, unknown> = {};

          try {
            args =
              typeof raw === "string"
                ? ((JSON.parse(raw) as Record<string, unknown>) ?? {})
                : ((raw as Record<string, unknown>) ?? {});
          } catch {
            args = {};
          }

          if (name === "save_address") {
            const address = args.address;
            if (typeof address === "string" && address.trim()) {
              next.address = address.trim();
            }
            continue;
          }

          if (name === "save_contact") {
            const firstName = args.firstName;
            const lastName = args.lastName;
            const phone = args.phone;
            const email = args.email;

            if (typeof firstName === "string" && firstName.trim()) {
              next.firstName = firstName.trim();
            }
            if (typeof lastName === "string" && lastName.trim()) {
              next.lastName = lastName.trim();
            }
            if (typeof phone === "string" && phone.trim()) {
              next.phone = phone.trim();
            }
            if (typeof email === "string" && email.trim()) {
              next.email = email.trim();
            }
            continue;
          }

          if (name === "save_details") {
            const condition = args.condition;
            const timeline = args.timeline;
            const reason = args.reason;

            if (typeof condition === "string" && condition.trim()) {
              next.condition = condition.trim();
            }
            if (typeof timeline === "string" && timeline.trim()) {
              next.timeline = timeline.trim();
            }
            if (typeof reason === "string" && reason.trim()) {
              next.reason = reason.trim();
            }
          }
        }

        return next;
      });
    },
    [],
  );

  // ─── Vapi wire-up ────────────────────────────────────────────────────────
  const setupVapi = useCallback(() => {
    if (vapiRef.current) return vapiRef.current;

    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      console.error(
        "[VoiceAgent] NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set — add it to .env.local",
      );
      reportClientEvent("voice_missing_public_key");
      return null;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      callConnectedRef.current = true;
      reportClientEvent("voice_call_started", {
        elapsedMs: callStartedAtRef.current
          ? Date.now() - callStartedAtRef.current
          : undefined,
      });
      setPhase("listening");
    });

    vapi.on("call-end", () => {
      reportClientEvent("voice_call_end_event", {
        endedReason: callEndedReasonRef.current,
        connected: callConnectedRef.current,
        elapsedMs: callStartedAtRef.current
          ? Date.now() - callStartedAtRef.current
          : undefined,
      });
      callEndFallbackTimeoutRef.current = setTimeout(() => {
        finishCall(
          callEndedReasonRef.current ??
            (manualStopRef.current ? "customer-ended-call" : undefined),
        );
      }, 250);
    });

    vapi.on("speech-start", () => setPhase("speaking"));
    vapi.on("speech-end", () => {
      setPhase("listening");
      flushPendingTypedMessages();

      if (assistantFinalFarewellRef.current) {
        gracefulStopRef.current = true;
        vapi.stop();
      }
    });

    vapi.on("volume-level", (v: number) => setVolume(v));

    vapi.on("error", (err: unknown) => {
      console.error("[VoiceAgent] vapi error", err);
      const msg = err instanceof Error ? err.message : String(err);
      // Daily / Vapi surface mic-permission failures as generic errors.
      // Detect the common shapes and route to the mic-blocked screen.
      enterErrorState(
        isMicrophoneError(msg) ? "microphone_blocked" : "vapi_runtime_error",
        {
          error: sanitizeError(err),
          connected: callConnectedRef.current,
          endedReason: callEndedReasonRef.current,
          elapsedMs: callStartedAtRef.current
            ? Date.now() - callStartedAtRef.current
            : undefined,
        },
      );
    });

    vapi.on("message", (msg: Record<string, unknown>) => {
      if (msg.type === "status-update") {
        const status = msg.status as string | undefined;
        const endedReason =
          typeof msg.endedReason === "string" ? msg.endedReason : undefined;

        if (endedReason) {
          callEndedReasonRef.current = endedReason;
        }

        reportClientEvent("voice_status_update", {
          status,
          endedReason,
          connected: callConnectedRef.current,
        });

        if (status === "ended") {
          finishCall(endedReason);
        }
        return;
      }

      // Live transcript streaming — render on screen in sync with audio.
      if (msg.type === "transcript") {
        const role = msg.role as "user" | "assistant";
        const text = (msg.transcript as string | undefined) ?? "";
        const transcriptType = msg.transcriptType as
          | "partial"
          | "final"
          | undefined;
        if (!text) return;
        const normalizedText = normalizeMessageText(text);

        if (transcriptType === "final") {
          if (role === "assistant") {
            if (isAssistantClosingCheck(text)) {
              assistantOfferedClosingRef.current = true;
            }

            if (isAssistantCompletedFarewell(text)) {
              assistantCompletedFarewellRef.current = true;
            }

            if (isAssistantFinalFarewell(text)) {
              assistantFinalFarewellRef.current = true;
            }
          } else if (
            assistantOfferedClosingRef.current &&
            isWrapUpReply(text)
          ) {
            gracefulStopRef.current = true;
            vapi.stop();
          }
        }

        setTurns((prev) => {
          const optimisticText = optimisticTypedMessagesRef.current[0];
          // Merge partials: if the last turn is the same role and partial,
          // replace its text; otherwise append a new turn.
          const last = prev[prev.length - 1];
          if (
            role === "user" &&
            transcriptType === "final" &&
            optimisticText &&
            normalizeMessageText(optimisticText) === normalizedText &&
            last &&
            last.role === "user" &&
            !last.partial &&
            normalizeMessageText(last.text) === normalizedText
          ) {
            optimisticTypedMessagesRef.current.shift();
            return prev;
          }
          if (last && last.role === role && last.partial) {
            const next = [...prev];
            next[next.length - 1] = {
              role,
              text,
              partial: transcriptType !== "final",
            };
            return next;
          }
          return [
            ...prev,
            { role, text, partial: transcriptType !== "final" },
          ];
        });
      }

      // Capture firstName from the save_contact tool call so the success
      // screen can personalize ("Thanks, Maria.").
      if (msg.type === "tool-calls") {
        const calls =
          (msg.toolCallList as Array<{
            function?: { name?: string; arguments?: unknown };
          }>) ||
          (msg.toolCalls as Array<{
            function?: { name?: string; arguments?: unknown };
          }>) ||
          [];
        reportClientEvent("voice_tool_calls", {
          names: calls
            .map((call) => call.function?.name)
            .filter((name): name is string => Boolean(name)),
        });
        syncLeadSummary(calls);
        for (const call of calls) {
          if (call.function?.name === "complete_lead") {
            leadCompletedRef.current = true;
            if (!leadPixelTrackedRef.current) {
              leadPixelTrackedRef.current = true;
              trackLeadComplete({
                eventId:
                  voiceLeadEventIdRef.current ??
                  createMetaEventId(`lead_voice_${lang}`),
                source: lang === "es" ? "voice-es" : "voice-en",
                lang,
              });
            }
          }

          if (call.function?.name === "save_contact") {
            const raw = call.function.arguments;
            try {
              const args =
                typeof raw === "string"
                  ? (JSON.parse(raw) as Record<string, unknown>)
                  : ((raw as Record<string, unknown>) ?? {});
              const fn = args.firstName;
              if (typeof fn === "string" && fn.trim()) {
                setCapturedFirstName(fn.trim());
              }
            } catch {
              // ignore parse errors — not fatal
            }
          }
        }
      }
    });

    return vapi;
  }, [
    enterErrorState,
    finishCall,
    flushPendingTypedMessages,
    reportClientEvent,
    syncLeadSummary,
  ]);

  // ─── Start the call (one-tap) ────────────────────────────────────────────
  const startCall = useCallback(async (initialTypedMessage?: string) => {
    const initialMessage = normalizeMessageText(initialTypedMessage ?? "");

    clearCallTimers();
    callEndedReasonRef.current = null;
    callStartedAtRef.current = Date.now();
    callConnectedRef.current = false;
    setErrorCode(null);
    leadCompletedRef.current = false;
    leadPixelTrackedRef.current = false;
    manualStopRef.current = false;
    gracefulStopRef.current = false;
    handledCallEndRef.current = false;
    assistantOfferedClosingRef.current = false;
    assistantFinalFarewellRef.current = false;
    assistantCompletedFarewellRef.current = false;
    voiceLeadEventIdRef.current = createMetaEventId(`lead_voice_${lang}`);
    setHasStartedConversation(true);
    setPhase("connecting");
    setTurns(initialMessage ? [{ role: "user", text: initialMessage }] : []);
    setCapturedFirstName(null);
    setLeadSummary({});
    pendingTypedMessagesRef.current = initialMessage ? [initialMessage] : [];
    optimisticTypedMessagesRef.current = initialMessage ? [initialMessage] : [];
    trackLeadStarted(lang === "es" ? "voice-es" : "voice-en", lang);
    reportClientEvent("voice_start_attempt", {
      hasInitialTypedMessage: Boolean(initialMessage),
    });

    const vapi = setupVapi();
    if (!vapi) {
      enterErrorState("missing_public_key");
      return;
    }

    try {
      const baseAssistant = assistantFor(lang) as Record<string, unknown> & {
        metadata?: Record<string, unknown>;
      };
      const assistant = {
        ...baseAssistant,
        metadata: {
          ...(baseAssistant.metadata ?? {}),
          ...(getMetaBrowserContext() ?? {}),
          metaEventId: voiceLeadEventIdRef.current,
        },
      };

      await vapi.start(
        assistant as unknown as Parameters<Vapi["start"]>[0],
      );
    } catch (err) {
      console.error("[VoiceAgent] start failed", err);
      const msg = err instanceof Error ? err.message : String(err);
      enterErrorState(
        isMicrophoneError(msg) ? "microphone_blocked" : "vapi_start_failed",
        { error: sanitizeError(err) },
      );
    }
  }, [clearCallTimers, enterErrorState, reportClientEvent, setupVapi, lang]);

  // ─── Stop the call manually ──────────────────────────────────────────────
  const endCall = useCallback(() => {
    manualStopRef.current = true;
    vapiRef.current?.stop();
  }, []);

  const toggleMute = useCallback(() => {
    const v = vapiRef.current;
    if (!v) return;
    const next = !muted;
    v.setMuted(next);
    setMuted(next);
  }, [muted]);

  // ─── Cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearCallTimers();
      vapiRef.current?.stop();
    };
  }, [clearCallTimers]);

  // ─── Derived UI state ────────────────────────────────────────────────────
  const statusLabel = (() => {
    switch (phase) {
      case "connecting":
        return c.connectingLabel;
      case "listening":
        return c.listeningLabel;
      case "speaking":
        return c.speakingLabel;
      case "thinking":
        return c.thinkingLabel;
      default:
        return "";
    }
  })();

  const isLive =
    phase === "listening" || phase === "speaking" || phase === "thinking";
  const showTypedComposer =
    hasStartedConversation && phase !== "success";
  const typedHint = phase === "connecting" ? c.typeQueuedHint : c.typeHint;
  const summaryValues = c.summaryValues as {
    condition: Record<string, string>;
    timeline: Record<string, string>;
  };
  const summaryRows = [
    {
      label: c.summaryLabels.address,
      value: cleanSummaryValue(leadSummary.address) ?? c.summaryEmpty,
    },
    {
      label: c.summaryLabels.name,
      value:
        cleanSummaryValue(
          [leadSummary.firstName, leadSummary.lastName]
            .map((part) => cleanSummaryValue(part))
            .filter(Boolean)
            .join(" "),
        ) ?? c.summaryEmpty,
    },
    {
      label: c.summaryLabels.phone,
      value: cleanSummaryValue(leadSummary.phone) ?? c.summaryEmpty,
    },
    {
      label: c.summaryLabels.email,
      value: cleanSummaryValue(leadSummary.email) ?? c.summaryEmpty,
    },
    {
      label: c.summaryLabels.condition,
      value: formatSummaryEnum(
        leadSummary.condition,
        summaryValues.condition,
        c.summaryEmpty,
      ),
    },
    {
      label: c.summaryLabels.timeline,
      value: formatSummaryEnum(
        leadSummary.timeline,
        summaryValues.timeline,
        c.summaryEmpty,
      ),
    },
    {
      label: c.summaryLabels.reason,
      value: cleanSummaryValue(leadSummary.reason) ?? c.summaryEmpty,
    },
  ];

  // ─── Swap to form fallback ───────────────────────────────────────────────
  const handleTypedSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      const nextMessage = normalizeMessageText(typedInput);
      if (!nextMessage) return;

      setTypedInput("");

      if (phase === "listening" && vapiRef.current) {
        optimisticTypedMessagesRef.current.push(nextMessage);
        setTurns((prev) => [...prev, { role: "user", text: nextMessage }]);

        try {
          setPhase("thinking");
          vapiRef.current.send({
            type: "add-message",
            message: { role: "user", content: nextMessage },
            triggerResponseEnabled: true,
          });
        } catch (error) {
          console.error("[VoiceAgent] send typed message failed", error);
          setTypedInput(nextMessage);
          enterErrorState("send_typed_message_failed", {
            error: sanitizeError(error),
          });
        }
        return;
      }

      if (
        phase === "connecting" ||
        phase === "speaking" ||
        phase === "thinking"
      ) {
        optimisticTypedMessagesRef.current.push(nextMessage);
        pendingTypedMessagesRef.current.push(nextMessage);
        setTurns((prev) => [...prev, { role: "user", text: nextMessage }]);
        return;
      }

      await startCall(nextMessage);
    },
    [enterErrorState, phase, startCall, typedInput],
  );
  const handleStartCall = useCallback(() => {
    void startCall();
  }, [startCall]);

  if (showFallback && fallbackForm) {
    return <>{fallbackForm}</>;
  }

  if (dismissed) return null;

  // ─── Render ──────────────────────────────────────────────────────────────
  const shell = shellMode
    ? "fixed inset-0 z-50"
    : "relative w-full min-h-[640px]";

  return (
    <div
      className={`${shell} bg-obsidian-900 overflow-hidden`}
      role="dialog"
      aria-modal={shellMode}
      aria-label="Voice agent"
    >
      {/* Ambient gold glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(13,109,102,0.12) 0%, transparent 65%)",
        }}
      />

      {/* Top-left brand / top-right dismiss */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-6 lg:px-10 py-5">
        <BrandLogo compact />

        {/* Learn more ↓ — dismisses overlay so user can scroll the SEO content */}
        <button
          onClick={() => {
            if (vapiRef.current && isLive) vapiRef.current.stop();
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-cream/40 hover:text-cream/80 font-body text-xs uppercase tracking-widest transition-colors"
        >
          {c.learnMoreLink}
        </button>
      </div>

      {/* Main content — switches on phase */}
      <div className="relative z-10 h-full w-full flex items-center justify-center px-6 py-20 pb-40">
        <AnimatePresence mode="wait">
          {/* ── IDLE: the tap-to-talk entry point ─────────────────────── */}
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-xl w-full text-center flex flex-col items-center"
            >
              <h1
                className="font-display font-light text-cream mb-5 leading-[1.05]"
                style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)" }}
              >
                {c.idleTitle}
              </h1>
              <p className="text-cream/55 font-body font-light text-base lg:text-lg leading-relaxed mb-12 max-w-lg">
                {c.idleSub}
              </p>

              <TapToTalkButton onClick={handleStartCall} label={c.startButton} />

              {/* Fallback link */}
              {fallbackForm && (
                <button
                  onClick={() => setShowFallback(true)}
                  className="mt-10 text-cream/35 hover:text-cream/60 font-body text-xs underline decoration-cream/15 underline-offset-4 transition-colors"
                >
                  {c.fallbackLink}
                </button>
              )}

              {/* Trust row */}
              <TrustRow items={c.trustRow} />
            </motion.div>
          )}

          {/* ── CONNECTING ─────────────────────────────────────────────── */}
          {phase === "connecting" && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full border-2 border-gold/30 border-t-gold animate-spin mb-6" />
              <p className="text-cream/60 font-body text-sm uppercase tracking-widest">
                {c.connectingLabel}
              </p>
            </motion.div>
          )}

          {/* ── LIVE CALL ──────────────────────────────────────────────── */}
          {isLive && (
            <motion.div
              key="live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl flex flex-col items-center gap-10"
            >
              {/* Status + waveform */}
              <div className="flex flex-col items-center gap-5">
                <Waveform volume={volume} active={phase === "speaking"} />
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      phase === "speaking"
                        ? "bg-gold animate-pulse"
                        : phase === "listening"
                          ? "bg-emerald-400/80 animate-pulse"
                          : "bg-cream/30"
                    }`}
                  />
                  <span className="text-cream/60 font-body text-xs uppercase tracking-[0.25em]">
                    {statusLabel}
                  </span>
                </div>
              </div>

              {/* Live transcript */}
              <div className="w-full max-h-[40vh] overflow-y-auto px-1 space-y-3 pr-2">
                {turns.length === 0 && (
                  <p className="text-cream/25 font-body text-sm italic text-center py-4">
                    {lang === "es"
                      ? "La conversación aparecerá aquí mientras hablan…"
                      : "The conversation will appear here as you speak…"}
                  </p>
                )}
                {turns.map((t, i) => (
                  <TranscriptTurn key={i} turn={t} />
                ))}
                <div ref={transcriptEndRef} />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="px-5 py-3 rounded-sm border border-surface-border hover:border-cream/30 text-cream/70 hover:text-cream text-xs uppercase tracking-widest font-body transition-colors"
                >
                  {muted ? c.unmuteLabel : c.muteLabel}
                </button>
                <button
                  onClick={endCall}
                  className="px-6 py-3 rounded-sm bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 text-xs uppercase tracking-widest font-body transition-colors"
                >
                  {c.endCallLabel}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── MIC BLOCKED ────────────────────────────────────────────── */}
          {phase === "mic-blocked" && (
            <motion.div
              key="mic-blocked"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-lg w-full text-center flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z"
                    stroke="#fca5a5"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M19 11a7 7 0 01-14 0M12 18v4M3 3l18 18"
                    stroke="#fca5a5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h2 className="font-display text-2xl lg:text-3xl text-cream mb-4">
                {c.micBlockedTitle}
              </h2>
              <p className="text-cream/55 font-body text-sm leading-relaxed mb-8">
                {c.micBlockedSub}
              </p>
              <div className="flex flex-col items-center gap-4">
                <button onClick={handleStartCall} className="btn-gold px-8 py-3.5 rounded-sm text-sm">
                  {c.micBlockedRetry}
                </button>
                {fallbackForm && (
                  <button
                    onClick={() => setShowFallback(true)}
                    className="text-cream/40 hover:text-cream/70 font-body text-xs underline decoration-cream/15 underline-offset-4 transition-colors"
                  >
                    {c.micBlockedFallback}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── ERROR ──────────────────────────────────────────────────── */}
          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-md w-full text-center flex flex-col items-center"
            >
              <h2 className="font-display text-2xl lg:text-3xl text-cream mb-4">
                {c.errorTitle}
              </h2>
              <p className="text-cream/55 font-body text-sm leading-relaxed mb-8">
                {voiceErrorMessage(errorCode, lang) ?? c.errorSub}
              </p>
              <div className="flex flex-col items-center gap-4">
                <button onClick={handleStartCall} className="btn-gold px-8 py-3.5 rounded-sm text-sm">
                  {c.errorRetry}
                </button>
                {fallbackForm && (
                  <button
                    onClick={() => setShowFallback(true)}
                    className="text-cream/40 hover:text-cream/70 font-body text-xs underline decoration-cream/15 underline-offset-4 transition-colors"
                  >
                    {c.fallbackLink}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SUCCESS ────────────────────────────────────────────────── */}
          {phase === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl w-full text-center flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-7">
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                >
                  <motion.path
                    d="M6 16l7 7 13-13"
                    stroke="#0D6D66"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  />
                </motion.svg>
              </div>
              <h2 className="font-display text-3xl lg:text-4xl text-cream mb-4">
                {successName}
                {capturedFirstName ? ` ${capturedFirstName}.` : "."}
              </h2>
              <p className="text-cream/55 font-body text-base leading-relaxed mb-7 max-w-sm">
                {c.successSub}
              </p>
              <div className="w-full max-w-2xl rounded-2xl border border-surface-border bg-surface-hover/40 px-5 py-5 text-left mb-7">
                <p className="text-[11px] font-body uppercase tracking-[0.25em] text-cream/45 mb-4">
                  {c.summaryTitle}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {summaryRows.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-xl border border-surface-border bg-obsidian-900/55 px-4 py-3"
                    >
                      <p className="text-[11px] font-body uppercase tracking-[0.2em] text-cream/35 mb-1">
                        {row.label}
                      </p>
                      <p className="text-sm font-body leading-relaxed text-cream/85">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-xs font-body text-cream/30 uppercase tracking-widest">
                {c.successMicro.map((m, i) => (
                  <span key={m} className="flex items-center gap-3">
                    <span>{m}</span>
                    {i < c.successMicro.length - 1 && (
                      <span className="text-cream/20">·</span>
                    )}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showTypedComposer && (
        <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-4 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-3xl rounded-2xl border border-surface-border bg-obsidian-900/88 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="border-b border-surface-border px-4 py-3">
              <p className="text-center text-[11px] font-body uppercase tracking-[0.22em] text-cream/45">
                {typedHint}
              </p>
            </div>
            <form onSubmit={handleTypedSubmit} className="flex gap-3 p-3">
              <input
                value={typedInput}
                onChange={(event) => setTypedInput(event.target.value)}
                placeholder={c.typePlaceholder}
                aria-label={c.typePlaceholder}
                className="min-w-0 flex-1 rounded-xl border border-surface-border bg-obsidian-900 px-4 py-3 text-sm font-body text-cream placeholder:text-cream/30 focus:border-gold/50 focus:outline-none"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!typedInput.trim()}
                className="shrink-0 rounded-xl bg-gold px-5 py-3 text-xs font-body uppercase tracking-[0.22em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {c.typeSend}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TapToTalkButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="relative group focus:outline-none"
      aria-label={label}
    >
      {/* Outer pulsing ring */}
      <span className="absolute inset-0 rounded-full bg-gold/20 blur-xl animate-pulse" />
      <span className="absolute inset-0 rounded-full bg-gold/10 scale-110 animate-ping" />

      {/* Button body */}
      <span className="relative inline-flex items-center justify-center w-32 h-32 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-gold to-gold-300 text-white shadow-2xl shadow-gold/30 transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z"
            fill="currentColor"
          />
          <path
            d="M19 11a7 7 0 01-14 0M12 18v4M8 22h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>

      {/* Label */}
      <span className="block mt-5 text-cream/80 font-body text-sm uppercase tracking-[0.3em] group-hover:text-cream transition-colors">
        {label}
      </span>
    </button>
  );
}

function Waveform({ volume, active }: { volume: number; active: boolean }) {
  // 16 vertical bars that pulse with the assistant's current volume level.
  // `volume` is 0..1 from Vapi. When `active` is false (user turn), bars
  // stay mostly still with a faint breathing animation.
  const bars = Array.from({ length: 16 });
  return (
    <div className="flex items-center gap-1.5 h-16">
      {bars.map((_, i) => {
        const distanceFromCenter = Math.abs(i - 7.5) / 7.5;
        const falloff = 1 - distanceFromCenter * 0.6;
        const base = 6;
        const max = 56;
        const height = active
          ? base + Math.max(0, volume * max * falloff) + Math.random() * 6
          : base + 4 * falloff;
        return (
          <span
            key={i}
            className="w-[3px] rounded-full bg-gold/70 transition-all duration-100 ease-out"
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}

function TranscriptTurn({ turn }: { turn: Turn }) {
  const isUser = turn.role === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] px-4 py-2.5 rounded-lg text-sm font-body leading-relaxed ${
          isUser
            ? "bg-surface-hover text-cream/85 border border-surface-border"
            : "bg-gold/10 text-cream/90 border border-gold/20"
        } ${turn.partial ? "opacity-70" : "opacity-100"}`}
      >
        {turn.text}
      </div>
    </div>
  );
}

function TrustRow({ items }: { items: readonly string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-6 mt-14 pt-8 border-t border-surface-border w-full max-w-sm">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1L2 3.5v5.5c0 3.04 2.59 5.44 6 6.5 3.41-1.06 6-3.46 6-6.5V3.5L8 1z"
              stroke="#0D6D66"
              strokeWidth="1.2"
              fill="rgba(13,109,102,0.08)"
            />
          </svg>
          <span className="text-cream/40 text-[11px] font-body uppercase tracking-wider">
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}
