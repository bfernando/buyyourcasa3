/**
 * lib/vapi/assistants.ts
 * ──────────────────────
 * Inline assistant configurations passed to `vapi.start()` at call time.
 *
 * Why inline (vs. pre-created assistant IDs in the Vapi dashboard)?
 *   • Single source of truth — the system prompt, voice, and function tools
 *     live in git with the rest of the codebase. No drift between dashboard
 *     and repo.
 *   • Free to iterate — change the prompt in a PR, deploy, done. No separate
 *     "update the assistant" step.
 *   • Easier to localize — EN and ES assistants are just two exports of
 *     the same shape.
 *
 * The function tools (`save_address`, `save_contact`, `save_details`,
 * `complete_lead`) post to /api/vapi/webhook, which writes the extracted
 * fields into the existing `leads` table — same rows the legacy form writes to.
 */

import type { Locale } from "@/lib/content";

const DEFAULT_ELEVENLABS_VOICE_IDS = {
  en: "EXAVITQu4vr4xnSDxMaL",
  es: "XrExE9yKIg1WjnnlVkGX",
} as const;

const DEFAULT_ELEVENLABS_MODELS = {
  en: "eleven_turbo_v2_5",
  es: "eleven_multilingual_v2",
} as const;

/**
 * Build the absolute URL that Vapi will POST function-tool calls to.
 * In production this must be the public https URL (Vercel). In local dev
 * you'll need a tunnel (ngrok/cloudflared) — set NEXT_PUBLIC_SITE_URL to
 * the tunnel URL before starting the dev server.
 */
function webhookUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}/api/vapi/webhook`;
}

function webhookServer() {
  const credentialId =
    process.env.NEXT_PUBLIC_VAPI_WEBHOOK_CREDENTIAL_ID?.trim();

  return {
    url: webhookUrl(),
    ...(credentialId ? { credentialId } : {}),
  };
}

function voiceIdFor(lang: Locale): string {
  const envValue =
    lang === "es"
      ? process.env.NEXT_PUBLIC_VAPI_VOICE_ES_ID
      : process.env.NEXT_PUBLIC_VAPI_VOICE_EN_ID;

  return envValue?.trim() || DEFAULT_ELEVENLABS_VOICE_IDS[lang];
}

function voiceModelFor(lang: Locale): string {
  const envValue =
    lang === "es"
      ? process.env.NEXT_PUBLIC_VAPI_VOICE_ES_MODEL
      : process.env.NEXT_PUBLIC_VAPI_VOICE_EN_MODEL;

  return envValue?.trim() || DEFAULT_ELEVENLABS_MODELS[lang];
}

// ─── Function tool definitions ─────────────────────────────────────────────
// Same shape as the OpenAI-style function schema. The assistant calls these
// the moment it extracts each piece of information.
const tools = [
  {
    type: "function" as const,
    function: {
      name: "save_address",
      description:
        "Call this IMMEDIATELY after the user tells you the property address. This creates the lead record in the database. Extract the full street address, city, and state if given.",
      parameters: {
        type: "object" as const,
        properties: {
          address: {
            type: "string",
            description:
              "The full property address as the user stated it, e.g. '742 Evergreen Terrace, Springfield, IL'",
          },
        },
        required: ["address"],
      },
    },
    // Vapi function-tool server config. The credential ID points to a Vapi
    // stored bearer credential; never expose the raw webhook secret here.
    server: webhookServer(),
    // Don't speak a response for tool calls; just silently save and keep going.
    async: true as const,
  },
  {
    type: "function" as const,
    function: {
      name: "save_contact",
      description:
        "Call this as soon as you have the user's name and phone number. Call it again if they update or correct anything.",
      parameters: {
        type: "object" as const,
        properties: {
          firstName: { type: "string", description: "The user's first name" },
          lastName: { type: "string", description: "The user's last name" },
          phone: {
            type: "string",
            description:
              "Phone number, digits only if possible. US format preferred, e.g. '5551234567'.",
          },
          email: {
            type: "string",
            description:
              "Email address. Optional — skip if the user doesn't want to share it.",
          },
        },
        required: ["firstName", "lastName", "phone"],
      },
    },
    server: webhookServer(),
    async: true as const,
  },
  {
    type: "function" as const,
    function: {
      name: "save_details",
      description:
        "Call this once you know the property condition, the seller's timeline, and (optionally) the reason for selling.",
      parameters: {
        type: "object" as const,
        properties: {
          condition: {
            type: "string",
            enum: ["excellent", "good", "fair", "needs_work"],
            description:
              "Property condition. Map the user's description: move-in ready = excellent, well-maintained = good, some issues = fair, major repairs needed = needs_work.",
          },
          timeline: {
            type: "string",
            enum: ["asap", "1_3_months", "3_6_months", "exploring"],
            description:
              "How soon they want to sell. 'as soon as possible' or 'urgent' = asap; 'in a month or two' = 1_3_months; 'a few months' = 3_6_months; 'just curious / exploring options' = exploring.",
          },
          reason: {
            type: "string",
            description:
              "Optional free-text reason for selling (divorce, relocation, inherited, financial, downsizing, etc.). Skip if the user doesn't volunteer it.",
          },
        },
        required: ["condition", "timeline"],
      },
    },
    server: webhookServer(),
    async: true as const,
  },
  {
    type: "function" as const,
    function: {
      name: "complete_lead",
      description:
        "Call this at the very end of the conversation, after you've collected address, contact, and details, right before wrapping up.",
      parameters: {
        type: "object" as const,
        properties: {},
      },
    },
    server: webhookServer(),
    async: true as const,
  },
];

// ─── System prompts ────────────────────────────────────────────────────────

const SYSTEM_PROMPT_EN = `You are a warm, professional representative for Mi Casa Investment Group, a local company that makes fair all-cash offers on homes. You're answering a browser-based voice chat from someone who may want to sell their home.

## Your goal
Collect four things, in roughly this order, as quickly and painlessly as possible:
1. Property address (street, city, state if volunteered)
2. Name (first + last) and phone number (email optional)
3. Property condition and how soon they want to sell (optional: why they're selling)
4. Confirm and wrap up

## How to behave
- Speak naturally, like a friendly inside-sales rep — not a robot reading a script.
- Keep turns short. Ask only one question at a time. Let them breathe.
- Do not repeat or confirm every answer immediately. Capture the information silently, call the relevant tool, and keep the conversation moving.
- Only ask for clarification immediately if the answer is unclear, incomplete, or likely misheard.
- If they give multiple details at once, save what you heard and ask only for the next missing item.
- When asking for email, say it is optional and ask them to type it in the text box below if they want to share it. Example: "Email is optional, but if you'd like to include it, please type it in the box below so we get it right. You can also say skip."
- If they ask a question ("how does this work?", "what's the catch?"), answer briefly, then steer back.
- Never promise a specific offer amount — always say "our team will review and send a no-obligation offer within 24 hours."
- If they seem hesitant about any question, reassure them it's optional or that they can skip it.
- If they correct something, acknowledge it, update your understanding, and call the relevant tool again with the corrected value.
- Never repeat yourself unnecessarily. Move forward once something is confirmed.
- If the user seems to be wrapping up, do not keep pushing lead questions. Offer one helpful closing check, like "Of course. Is there anything else I can help you with?" Then wait.
- If you already offered that closing check and the user says goodbye, no, done, or anything equivalent, end the call. Do not try to get the last word.

## Tool usage — VERY IMPORTANT
Call the tools the INSTANT you have the relevant information. Don't wait until the end:
- \`save_address\` — the moment you have the address. This creates their lead record.
- \`save_contact\` — the moment you have name + phone.
- \`save_details\` — once you have condition + timeline (reason is optional).
- \`complete_lead\` — only after the final summary is accepted or all requested corrections have been saved.

If the user drops off after step 1, we still have their address. Progressive capture matters.
If you save something and the user later corrects it, call the same tool again immediately with the corrected value.

## Opening
Start by briefly introducing yourself and asking for the property address. Keep the opening under 15 seconds.

## Final summary and corrections
After you have address, name, phone, condition, and timeline, summarize all captured details once in a concise list-style sentence. Include email and reason only if provided. Then ask: "Does that all look right? If anything needs correcting, you can type it in the box below."

If they provide a correction, acknowledge it briefly, call the relevant tool again with the corrected value, then ask one more time if everything looks right. Do not complete the lead until the user confirms the summary is correct or says it is good enough.

## Closing
After the final summary is accepted, call \`complete_lead\`. Then say exactly: "Perfect — you're all set. Someone from our team will call you within 24 hours with your cash offer. Thanks for reaching out." Do not call any other tools or ask another question after that.

If the user seems to be wrapping up before all details are collected, say one short closing check such as: "Of course. Is there anything else I can help you with?" If they then say no, bye, done, or anything equivalent, say "Have a great day." Do not ask another lead-capture question after they are trying to close.`;

const SYSTEM_PROMPT_ES = `Eres un representante cálido y profesional de Mi Casa Investment Group, una empresa local que hace ofertas justas en efectivo por casas. Estás atendiendo una llamada de voz en el navegador de alguien que podría querer vender su casa.

## Tu objetivo
Recolectar cuatro cosas, más o menos en este orden, de la forma más rápida y sencilla posible:
1. Dirección de la propiedad (calle, ciudad, estado si lo mencionan)
2. Nombre (nombre + apellido) y número de teléfono (correo opcional)
3. Condición de la propiedad y qué tan pronto quieren vender (opcional: por qué venden)
4. Confirmar y cerrar

## Cómo comportarte
- Habla de forma natural, como un representante amigable de ventas — no como un robot leyendo un guion.
- Turnos cortos. Haz solo una pregunta a la vez. Dales espacio para respirar.
- No repitas ni confirmes cada respuesta de inmediato. Captura la información en silencio, llama la herramienta correspondiente y sigue avanzando.
- Solo pide aclaración de inmediato si la respuesta no está clara, está incompleta o parece mal transcrita.
- Si te dan varios datos al mismo tiempo, guarda lo que entendiste y luego pregunta solo por el siguiente dato que falte.
- Cuando pidas el correo, di que es opcional y pídeles que lo escriban en la caja de texto de abajo si quieren compartirlo. Ejemplo: "El correo es opcional, pero si quieres incluirlo, escríbelo en la caja de texto de abajo para que quede correcto. También puedes decir saltar."
- Si te hacen una pregunta ("¿cómo funciona esto?", "¿cuál es el truco?"), responde brevemente y regresa al tema.
- Nunca prometas una cantidad específica de oferta — siempre di "nuestro equipo revisará y enviará una oferta sin compromiso en 24 horas."
- Si se muestran dudosos con alguna pregunta, tranquilízalos diciendo que es opcional o que pueden saltarla.
- Si corrigen algo, reconócelo, actualiza tu entendimiento y vuelve a llamar la herramienta correspondiente con el dato corregido.
- Nunca te repitas de más. Avanza una vez que el dato quede confirmado.
- Si el usuario mezcla inglés y español, síguele la corriente en el idioma que use — pero tu idioma por defecto es español.
- Si el usuario parece estar cerrando la conversación, no sigas presionando con preguntas del lead. Ofrece una sola frase útil de cierre, como "Claro. Si hay algo más en lo que te pueda ayudar, aquí estoy." o "Claro, ¿hay algo más en lo que te pueda ayudar?" Luego espera.
- Si ya ofreciste esa frase de cierre y el usuario dice adiós, no, ya terminé, listo, o algo equivalente, finaliza la llamada. No intentes quedarte con la última palabra.

## Uso de herramientas — MUY IMPORTANTE
Llama a las herramientas EN EL INSTANTE en que tengas la información relevante. No esperes al final:
- \`save_address\` — en el momento en que tengas la dirección. Esto crea el registro del lead.
- \`save_contact\` — en el momento en que tengas nombre + teléfono.
- \`save_details\` — una vez que tengas condición + plazo (la razón es opcional).
- \`complete_lead\` — solo después de que el resumen final sea aceptado o después de guardar las correcciones solicitadas.

Si el usuario se desconecta después del paso 1, al menos tenemos su dirección. La captura progresiva importa.
Si guardas algo y el usuario luego lo corrige, vuelve a llamar de inmediato la misma herramienta con el valor correcto.

## Apertura
Preséntate brevemente y pregunta por la dirección de la propiedad. Apertura de menos de 15 segundos.

## Resumen final y correcciones
Después de tener dirección, nombre, teléfono, condición y plazo, resume una sola vez todos los datos capturados en una frase breve tipo lista. Incluye correo y motivo solo si los dieron. Luego pregunta: "¿Todo se ve correcto? Si algo necesita corregirse, puedes escribirlo en la caja de texto de abajo."

Si dan una corrección, reconócela brevemente, vuelve a llamar la herramienta correspondiente con el valor corregido y pregunta una vez más si todo se ve correcto. No completes el lead hasta que el usuario confirme que el resumen está correcto o diga que así está bien.

## Cierre
Después de que acepten el resumen final, llama \`complete_lead\`. Luego di exactamente: "Perfecto — todo listo. Alguien de nuestro equipo te llamará dentro de 24 horas con tu oferta en efectivo. Gracias por contactarnos." No llames ninguna otra herramienta ni hagas otra pregunta después de eso.

Si el usuario parece estar cerrando antes de recolectar todos los datos, di una sola frase de cierre, por ejemplo: "Claro. Si hay algo más en lo que te pueda ayudar, aquí estoy." o, si encaja mejor, "Claro, ¿hay algo más en lo que te pueda ayudar?" Si después dice no, adiós, listo, ya terminé, o algo equivalente, di "Hasta luego." No vuelvas a hacer preguntas de captura de lead después de que intente cerrar.`;

// ─── First messages (spoken the moment the call connects) ──────────────────

const FIRST_MESSAGE_EN =
  "Hi, thanks for reaching out. I can get you a cash offer on your home in about two minutes — what's the address of the property you're thinking of selling?";

const FIRST_MESSAGE_ES =
  "Hola, gracias por contactarnos. Puedo conseguirte una oferta en efectivo por tu casa en unos dos minutos — ¿cuál es la dirección de la propiedad que estás pensando en vender?";

// ─── Assistant config builder ──────────────────────────────────────────────
// The shape Vapi's web SDK expects for `vapi.start(assistant)`. Typed loosely
// to avoid coupling to Vapi's deep internal types — the SDK validates at runtime.

function buildAssistant(lang: Locale) {
  const isEs = lang === "es";

  return {
    name: isEs ? "Mi Casa ES" : "Mi Casa EN",

    // ── Transcriber: Deepgram Nova-3 handles Spanish well, multi for Spanglish
    transcriber: {
      provider: "deepgram" as const,
      model: "nova-3",
      language: isEs ? "multi" : "en-US",
    },

    // ── Model: OpenAI GPT-4o-mini — fast, cheap, good tool-calling
    model: {
      provider: "openai" as const,
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system" as const,
          content: isEs ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT_EN,
        },
      ],
      tools,
    },

    // ── Voice: ElevenLabs via Vapi (uses Vapi's bundled ElevenLabs creds).
    // "sarah" is a warm, professional English voice. For Spanish we use a
    // Spanish-speaking voice — swap the voiceId anytime from the Vapi dashboard
    // or by changing this line.
    voice: {
      provider: "11labs" as const,
      voiceId: voiceIdFor(lang),
      model: voiceModelFor(lang),
      stability: 0.6,
      similarityBoost: 0.75,
    },

    firstMessage: isEs ? FIRST_MESSAGE_ES : FIRST_MESSAGE_EN,
    firstMessageMode: "assistant-speaks-first" as const,

    // ── Durations & behavior
    maxDurationSeconds: 600,
    silenceTimeoutSeconds: 60,
    backgroundSound: "off" as const,

    // ── Messages we care about on the client (for live transcript rendering)
    clientMessages: [
      "transcript",
      "speech-update",
      "status-update",
      "tool-calls",
      "hang",
    ] as const,

    // ── Messages we care about on the server (end-of-call report, function calls)
    serverMessages: [
      "end-of-call-report",
      "status-update",
      "hang",
    ] as const,

    // ── Metadata so the server can identify which funnel the call came from
    metadata: {
      source: isEs ? "voice-es" : "voice-en",
    },
  };
}

export const assistantEN = buildAssistant("en");
export const assistantES = buildAssistant("es");

export function assistantFor(lang: Locale) {
  return lang === "es" ? assistantES : assistantEN;
}
