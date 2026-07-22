# BuyYourCasa — Setup & Customization Guide

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve production build
```

---

## Customization Checklist

### Branding
| File | What to change |
|------|----------------|
| `app/layout.tsx` | `<title>`, meta description, OG tags |
| `components/Navigation.tsx` | Company name, logo letter, phone/links |
| `components/Footer.tsx` | Phone number, email address, legal entity name |
| `app/globals.css` | `--color-gold` to change accent color |
| `tailwind.config.ts` | `gold.*` palette values |

### Copy (all inline — no CMS required)
- **Hero headline/subheadline** → `components/Hero.tsx` lines ~70–90
- **Stats bar** → `components/Hero.tsx` — the `stats` array
- **Trust bar items** → `components/TrustBar.tsx` — the `items` array
- **How it works steps** → `components/HowItWorks.tsx` — the `steps` array
- **Situation cards** → `components/PainToRelief.tsx` — the `situations` array
- **Comparison rows** → `components/Comparison.tsx` — the `rows` array
- **Testimonials** → `components/Testimonials.tsx` — the `testimonials` array
- **FAQ answers** → `components/FAQ.tsx` — the `faqs` array
- **Service cities** → `components/ServiceArea.tsx` — the `cities` array
- **Final CTA** → `components/FinalCTA.tsx`

### Form Submission
Open `components/LeadForm.tsx` and find the `handleSubmit` function:

```tsx
const handleSubmit = () => {
  // ─── Replace this with your actual form submission logic ─────────
  // Option A: POST to a Next.js API route
  // fetch('/api/leads', { method: 'POST', body: JSON.stringify(formData) })

  // Option B: Send to a webhook (Zapier, Make, etc.)
  // fetch('https://hooks.zapier.com/...', { method: 'POST', body: JSON.stringify(formData) })

  // Option C: Use a CRM SDK (HubSpot, Salesforce, etc.)
  console.log("Form submission:", formData);
  setSubmitted(true);
};
```

### Adding a Real Hero Background Image
In `components/Hero.tsx`, replace the gradient placeholder with an `<Image>` or `<video>`:

```tsx
// Image option (recommended)
import Image from "next/image";
<Image
  src="/hero-bg.jpg"   // put image in /public/
  alt=""
  fill
  priority
  className="object-cover opacity-30"
/>

// Video option
<video
  autoPlay muted loop playsInline
  className="absolute inset-0 w-full h-full object-cover opacity-25"
>
  <source src="/hero.mp4" type="video/mp4" />
</video>
```

### Service Area
Edit the `cities` array in `components/ServiceArea.tsx` and update the copy to reflect your actual coverage.

### Analytics & Tracking
Add your tracking snippet to `app/layout.tsx` inside the `<head>` or use Next.js Script component for GA4, GTM, etc.

### Voice Agent Voices
If you want to use a specific ElevenLabs voice with the browser voice agent:

1. Add your ElevenLabs API key in Vapi Dashboard → Integrations → ElevenLabs.
2. Set one or both of these env vars:

```bash
NEXT_PUBLIC_VAPI_VOICE_EN_ID=<your-english-voice-id>
NEXT_PUBLIC_VAPI_VOICE_ES_ID=<your-spanish-voice-id>
```

Optional model overrides:

```bash
NEXT_PUBLIC_VAPI_VOICE_EN_MODEL=eleven_turbo_v2_5
NEXT_PUBLIC_VAPI_VOICE_ES_MODEL=eleven_turbo_v2_5
```

If those env vars are omitted, the app falls back to the current built-in ElevenLabs voice IDs.

### Vapi Inbound SMS Lead Capture

The Mi Casa Twilio number can use Vapi SMS Chat for customer-initiated text
conversations. The number must be SMS-capable, 10DLC approved, imported into
Vapi with SMS enabled, and attached to the Mi Casa assistant.

The assistant uses the `save_mi_casa_sms_lead` function tool on the first
seller-intent text, before requiring a property address. The tool posts to
`/api/vapi/webhook`, trusts the server-side Vapi customer number, and stores one
lead per Vapi session with `source=sms-vapi`, `channel=SMS`, the inbound text,
Vapi Chat ID, first/last inbound timestamps, and available attribution. The
Vapi Chat ID is the immutable provider message ID exposed to this webhook (with
the tool-call ID as a fallback); Vapi does not forward the original Twilio
`MessageSid` in tool calls.

The first valid external sender atomically claims one email alert and one
internal SMS alert even when the lead remains `completed=false`. A later tool
call can add the property address and complete the lead without repeating those
owner/team alerts. Automated QA calls must set `isTest=true`; those rows use
`test-sms-vapi` and do not send notifications. The advertised number,
`TWILIO_FROM_NUMBER`, and every `NOTIFICATION_PHONE_NUMBERS` recipient are
server-side exclusions so owner/team/system traffic cannot create alerts.

Before deploying this code, apply the additive database SQL once against the
production database:

```bash
npx prisma db execute \
  --file prisma/manual-migrations/20260722_inbound_sms_first_message.sql \
  --schema prisma/schema.prisma
```

This repository has no baseline Prisma migration history, so do not replace
that command with `prisma migrate deploy` until the existing database has been
properly baselined.

After the database and application deploy are ready, update the Vapi tool and
assistant together:

- Fetch the complete `save_mi_casa_sms_lead` tool definition, change its
  description to call immediately on the first seller-intent SMS, add required
  `inboundMessage` (the exact current customer text), and make `address`
  optional.
- PATCH the complete tool definition. Preserve its existing `server.url` and
  `server.credentialId`; a partial tool PATCH can clear the server URL.
- Update the assistant SMS instructions to call the tool before replying to the
  first seller-intent text and follow the returned `replyInstruction` for a
  concise acknowledgment. Remove instructions that pass literal
  `{{customer.number}}`; the webhook resolves the sender from trusted Vapi
  metadata and rejects unresolved templates.
- Do not call the tool for owner/team numbers, provider/system traffic, spam,
  vendors, or unrelated inquiries. STOP/UNSUBSCRIBE/CANCEL/END/QUIT must end the
  sales conversation; HELP gets one concise help response. Twilio remains the
  carrier-level opt-out enforcement layer.
- Keep the tool response contract exactly
  `{ "results": [{ "toolCallId": "...", "result": "..." }] }`.

Required production variables:

```bash
VAPI_PRIVATE_KEY=<private Vapi API key>
VAPI_WEBHOOK_SECRET=<token stored in the Vapi webhook credential>
NEXT_PUBLIC_VAPI_WEBHOOK_CREDENTIAL_ID=<Vapi webhook credential ID>
BEYFLO_VAPI_WEBHOOK_SECRET=<Beyflo webhook secret used when forwarding voice events>
TWILIO_ACCOUNT_SID=<Twilio account SID>
TWILIO_AUTH_TOKEN=<Twilio auth token>
TWILIO_FROM_NUMBER=+16195470490
NOTIFICATION_PHONE_NUMBERS=<comma-separated owner/team mobile numbers>
RESEND_API_KEY=<Resend API key>
LEAD_ALERT_TO=<comma-separated owner/team email addresses>
LEAD_ALERT_FROM=Mi Casa Investments <hello@buyyour.casa>
```

Keep SMS responses concise and modality-aware. The shared assistant should say
"Thanks for reaching out" rather than phone-only wording such as "Thanks for
calling," because the same assistant serves voice and text conversations.

### Meta Pixel and Conversions API
Add the Pixel ID in Vercel so Meta receives browser events from the funnel:

```bash
NEXT_PUBLIC_META_PIXEL_ID=<your-meta-pixel-id>
META_PIXEL_ID=<your-meta-pixel-id>
```

The app fires `PageView`, `LeadStarted`, `Lead`, and phone-click `Contact` events. Lead completions use a shared `event_id` so the browser Pixel event can be deduplicated with the server event.

For stronger delivery signals, generate a Conversions API access token in Meta Events Manager and add:

```bash
META_ACCESS_TOKEN=<your-conversions-api-token>
META_GRAPH_API_VERSION=v25.0
```

Optional test mode:

```bash
META_TEST_EVENT_CODE=<events-manager-test-code>
```

When `META_ACCESS_TOKEN` is missing, the site still sends browser Pixel events, but server-side CAPI lead events are skipped.

### Repeatable Facebook in-app browser funnel check

Run this after funnel or ad-link changes:

```bash
npm run check:facebook-funnel
```

The check opens the live Spanish mobile funnel with a Facebook iPhone in-app
browser user agent and `https://www.facebook.com/` referrer. It verifies the
form-first funnel loads, the property address field is visible, and the old
voice-first `Toca para Hablar` prompt is not present.

### Lead Email Notifications
If you want an internal email alert whenever someone completes the funnel:

1. Add the Resend integration from the Vercel Marketplace. This creates `RESEND_API_KEY` on the project automatically.
2. Add these env vars in Vercel:

```bash
LEAD_ALERT_TO=<your-inbox@example.com>
LEAD_ALERT_FROM=Mi Casa Investments <hello@buyyour.casa>
```

The app sends one internal alert when a form or voice lead transitions to
`completed=true`. Inbound SMS is intentionally earlier: it alerts once after
the first valid seller text/number, whether or not the scripted SMS intake is
later completed.

### Private Lead Review Endpoint

`GET /api/leads` is private. Public requests return `404` so seller contact data is not exposed.

Authorized operator reads must include one of these secrets as `x-admin-api-token` or `Authorization: Bearer ...`:

- `LEADS_ADMIN_TOKEN`, preferred if a dedicated review token is added later.
- `ADMIN_API_TOKEN`, if the project gets a general admin token.
- `PROPERTY_ACQUISITION_ENGINE_WEBHOOK_SECRET`, currently configured and used as the fallback shared integration secret.

Do not put these values in browser code, public docs, screenshots, or chat logs.

Current Resend setup for BuyYourCasa / Mi Casa Investments:

- Outbound sending domain: `buyyour.casa`
- Outbound sender: `Mi Casa Investments <hello@buyyour.casa>`
- Resend domain ID: `e8a6655e-499b-48a3-bde3-8c38ef3f03f9`
- Reply/receiving domain: `reply.buyyour.casa`
- Reply domain ID: `7c30dd77-1550-457d-a344-1f6e92eae77d`

DNS is currently managed in GoDaddy. Do not add legacy Resend subdomain records from older setup notes; use the verified root sending domain and `reply.buyyour.casa` for inbound reply capture.

---

## Tech Stack
- **Next.js 14** (App Router, static export)
- **Tailwind CSS 3** (custom design system in `tailwind.config.ts`)
- **Framer Motion 11** (scroll animations, form transitions, parallax)
- **React Hook Form** (installed, available if you want more complex validation)

## Design System Reference

### Colors
| Token | Hex | Use |
|-------|-----|-----|
| `gold-500` | `#C9A96E` | Primary accent, CTAs |
| `gold-300` | `#E8C98A` | Hover states, gradient highlights |
| `obsidian-900` | `#08080C` | Page background |
| `surface` | `#111117` | Section backgrounds |
| `surface-card` | `#16161E` | Card backgrounds |
| `cream-200` | `#F8F4EE` | Primary text |

### Typography
| Class | Font | Use |
|-------|------|-----|
| `font-display` | Cormorant Garamond | All headings |
| `font-body` | Inter | All body copy |
| `.text-gradient-gold` | — | Gold gradient text |

### Utility classes (globals.css)
- `.btn-gold` — Primary gold CTA button
- `.btn-outline` — Secondary outlined button
- `.form-input` — Styled form field
- `.glass-card` — Glassmorphism card
- `.text-gradient-gold` — Gold gradient text
- `.gold-divider` — Thin gold horizontal rule
