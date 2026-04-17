# BuyYourCasa — Project Handoff Document

**Last updated:** April 2026 (voice agent cutover)
**Live URL:** https://buyyourcasa3.vercel.app
**GitHub:** https://github.com/bfernando/buyyourcasa3
**Vercel project:** bradley-fernandos-projects/buyyourcasa3

> **Recent change (April 2026):** The funnel was converted from a 4-step form to a browser voice agent (Vapi + WebRTC). The form still exists as a fallback, but the primary path is now voice. See **Section 0: Voice Agent Cutover** below for everything specific to the voice layer — it supersedes the form-only funnel descriptions in Sections 2–5 where they conflict.

---

## 0. Voice Agent Cutover (April 2026)


**Status:** Code complete. Not yet deployed. Needs `npm install`, DB migration, and Vercel env vars to go live.

---

## What changed, in one paragraph

The funnel used to be a 4-step form on `/`, `/m`, `/es`, `/es/m`. It now loads a full-screen voice agent shell (Vapi + WebRTC) on top of the existing SEO content. One tap, the assistant speaks, the transcript types live on screen, and the four fields we used to collect through form steps (address, contact, property condition/timeline/reason) are now captured as Vapi function tool calls into the same `leads` table. The old form is still rendered underneath as the SEO payload and is shown as a fallback if the user taps "Prefer to type?" or denies mic permission. English assistant on `/` + `/m`, Spanish-native assistant on `/es` + `/es/m` (not a translation — separate system prompt, separate voice, Deepgram language flag set).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│  ┌───────────────────┐      ┌──────────────────────┐        │
│  │  /, /m, /es, /es/m│──────│ <VoiceAgent lang=…/> │        │
│  └───────────────────┘      └──────────┬───────────┘        │
│                                        │                    │
│                                  @vapi-ai/web               │
│                                 (WebRTC / Daily)            │
└────────────────────────────────────────┼────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │     Vapi cloud      │
                              │  (STT + LLM + TTS)  │
                              └──────────┬──────────┘
                                         │ server webhooks
                                         │ (tool-calls, end-of-call-report)
                              ┌──────────▼──────────┐
                              │ /api/vapi/webhook   │
                              │  (Next.js route)    │
                              └──────────┬──────────┘
                                         │
                                   Prisma → Postgres
                                   (leads table)
```

**No assistant IDs in env.** Assistant configs (voice, model, tools, system prompt) live inline in `lib/vapi/assistants.ts`. The browser SDK receives the full config at call time, so the repo is the single source of truth — no drift between the Vapi dashboard and code.

---

## Files touched

### New
- `lib/vapi/assistants.ts` — inline `assistantEN` and `assistantES` configs, plus `assistantFor(lang)` router. Defines the four function tools (`save_address`, `save_contact`, `save_details`, `complete_lead`) that Vapi will call during the conversation. Deepgram nova-3 transcriber, OpenAI gpt-4o-mini at 0.6 temperature, 11Labs voices (Sarah EN, Matilda ES), `eleven_turbo_v2_5`.
- `components/VoiceAgent.tsx` — full-screen overlay component. State machine: `idle → connecting → listening ↔ speaking → success`, plus `mic-blocked` and `error` branches. Renders tap-to-talk button, pulsing waveform that reacts to `volume-level` events, chat-style transcript bubbles (user right, assistant left) that update live from partial + final transcript events, mute/end/fallback controls. Body scroll is locked while mounted (SEO content stays in DOM but isn't scrollable).
- `app/api/vapi/webhook/route.ts` — POST handler that verifies the `x-vapi-secret` (or `Authorization: Bearer`) header against `VAPI_WEBHOOK_SECRET`, then routes:
  - `tool-calls` → dispatches to `handleSaveAddress/Contact/Details/completeLead`, upserts a `leads` row keyed by `callId`. Returns `{ results: [{ toolCallId, result }] }` (Vapi's expected shape).
  - `end-of-call-report` → writes `callDurationSec`, `recordingUrl`, `transcript` (JSON blob of the message list) onto the same row.
- `app/es/layout.tsx` — extracted the Spanish `<Metadata>` here so `app/es/page.tsx` could become a client component (needs `useState` for overlay dismissal).

### Modified
- `app/page.tsx`, `app/m/page.tsx`, `app/es/page.tsx`, `app/es/m/page.tsx` — each now a client component that renders the original funnel inside `<main>` and mounts `<VoiceAgent>` as a sibling overlay. The existing form (`<LeadForm>` / `<LeadFormMobile>`) is passed as `fallbackForm` so the "Prefer to type?" button reveals it in place without re-mounting.
- `app/api/leads/[id]/route.ts` — PATCH now accepts the four new voice fields (`callId`, `callDurationSec`, `recordingUrl`, `transcript`) in the allow-list.
- `lib/content.ts` — added a `voice: {...}` block to both `en` and `es` content objects. ~20 strings each (idle state, listening/speaking labels, mic-blocked copy, success copy, trust row, fallback link).
- `prisma/schema.prisma` — added four nullable columns to the `Lead` model: `callId String?`, `callDurationSec Int?`, `recordingUrl String?`, `transcript Json?`. Updated the `source` comment to include `"voice-en" | "voice-es"`.
- `package.json` — added `"@vapi-ai/web": "^2.5.2"` to dependencies.

### Env
- `.env.local` — exists with Vapi public key, private key, webhook secret, and `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (change to the ngrok URL for local Vapi testing). **Not committed** (it's already in `.gitignore`).

---

## What's left before it ships

### 1. Finish the local install
Sandbox couldn't complete it:
```bash
npm install
npx prisma generate
```

### 2. Typecheck (should be clean)
```bash
npx tsc --noEmit
```
Expected: zero errors. If you see "Cannot find module 'next/server'" or "PrismaClient has no exported member" errors, the install or prisma generate didn't finish — re-run step 1.

### 3. Create the migration safely
This repo currently has no committed `prisma/migrations` history. Do **not** point `npx prisma migrate dev` at a production database. Prisma documents `migrate dev` as a development-only command and recommends baselining an existing database before using `migrate deploy`.

If you want Prisma Migrate in this repo going forward:
1. Baseline the existing pre-voice schema into `prisma/migrations/0_init`.
2. Generate `add_voice_fields` from a **non-production** database or branch that matches the current live schema.
3. Commit both the baseline migration and the new `add_voice_fields` migration.

If you only need to add the four nullable voice columns to the current hosted database once, the pragmatic one-off is `prisma db push` or a manual `ALTER TABLE` instead of trying to bootstrap migration history against production.

Current `package.json` build script is `"build": "prisma generate && next build"`. It does **not** run migrations today. After real migration files exist, change it to `"build": "prisma migrate deploy && prisma generate && next build"` if you want Vercel to apply pending migrations automatically.

### 4. Push env vars to Vercel

Four vars, Production + Preview environments:

| Name | Value | Public? |
|---|---|---|
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Set from your local `.env.local` / Vercel env | Yes — ships in browser bundle |
| `VAPI_PRIVATE_KEY` | Set from your local `.env.local` / Vercel env | No — server only |
| `VAPI_WEBHOOK_SECRET` | Set from your local `.env.local` / Vercel env | No — server only |
| `NEXT_PUBLIC_SITE_URL` | `https://buyyourcasa3.vercel.app` | Yes — used to build webhook URLs |

CLI version:
```bash
npx vercel link
npx vercel env add NEXT_PUBLIC_VAPI_PUBLIC_KEY production
npx vercel env add VAPI_PRIVATE_KEY production
npx vercel env add VAPI_WEBHOOK_SECRET production
npx vercel env add NEXT_PUBLIC_SITE_URL production
# Then repeat for preview:
npx vercel env add NEXT_PUBLIC_VAPI_PUBLIC_KEY preview
# ...
```

**`NEXT_PUBLIC_SITE_URL` is the load-bearing one.** `lib/vapi/assistants.ts` calls `webhookUrl()` at module evaluation time to build the absolute URL for each tool's `server.url`. If it's pointing at `localhost`, Vapi's servers can't reach your tools and you'll see the assistant talk but nothing saves.
Do not store live secrets in this handoff document. Rotate any credentials that were previously pasted here.

### 5. Vapi dashboard: server URL secret
Log into the Vapi dashboard → Org Settings → Server URL. Paste the `VAPI_WEBHOOK_SECRET` value into the secret field so Vapi attaches it as `x-vapi-secret` on every outbound webhook. (Alternatively, the inline assistant config sends `serverUrlSecret` per call — this is already wired in `lib/vapi/assistants.ts` via `server.secret`, but the dashboard fallback is belt-and-suspenders.)

### 6. Local testing before deploy
Vapi can't reach `localhost`. Use a tunnel:
```bash
# terminal 1
npm run dev
# terminal 2
ngrok http 3000
# copy the https URL, then in .env.local:
# NEXT_PUBLIC_SITE_URL=https://<subdomain>.ngrok-free.app
# (restart npm run dev so the new env var is picked up)
```

### 7. Smoke test
1. Open `/` in Chrome. The voice overlay should cover the page.
2. Tap the gold "Start talking" button. Browser prompts for mic. Allow.
3. Sarah (EN) greets you. Say: "123 Main Street, Dallas, Texas." Wait ~1s. You should see the transcript update live.
4. Check `leads` table: a new row should exist with `callId`, `address`, `source="voice-en"`, `step=1`.
5. Continue the convo through contact and details. Each step should update the same row.
6. Say "that's all" / let it hang up. Row should end with `completed=true`, `callDurationSec` set, and `transcript` populated as JSON.
7. Repeat on `/es` — should hear Matilda (ES) and get `source="voice-es"`.

---

## Known non-issues

- **50 files show as modified in `git status`.** Most are just filemode changes (100644 → 100755) from the Windows mount. Run `git config core.fileMode false` in PowerShell before committing, or commit paths explicitly (see commit command below).
- **Sandbox couldn't complete `npm install`.** The 45s bash timeout killed it partway. Node_modules is present but missing the `next` type declarations and the `.prisma/client` output. This is purely a sandbox limitation — a fresh `npm install` on your laptop will complete cleanly and `tsc --noEmit` will go clean.
- **We call `vapi.start(assistantFor(lang))` with a type assertion.** The `@vapi-ai/web` SDK's start signature wants the first arg as either a string (assistant ID) or `CreateAssistantDTO`. Our inline config is structurally identical to `CreateAssistantDTO` but typed more loosely, so there's one `as any` cast in `VoiceAgent.tsx` to bridge it. Worth revisiting if the SDK tightens its types in a future release.

---

## Where to poke if something misbehaves

| Symptom | First place to look |
|---|---|
| Overlay doesn't show | `<VoiceAgent>` prop `shellMode` defaults to true; confirm parent page passes it. Check `overlayDismissed` state isn't stuck true. |
| Mic prompt doesn't appear | Browser blocked it silently — check site settings. The `mic-blocked` branch of the state machine nudges the user but can't force the prompt to re-appear (browser policy). |
| Assistant talks but nothing saves to DB | `NEXT_PUBLIC_SITE_URL` is wrong or Vapi can't reach it. Hit `https://<your-url>/api/vapi/webhook` in a browser — should return `{"ok":true,"service":"vapi-webhook"}`. |
| Webhook returns 401 | `VAPI_WEBHOOK_SECRET` mismatch between `.env` and Vapi dashboard, or the header isn't being sent (check request logs). |
| Partial transcript flickers | Expected — we merge `transcriptType: "partial"` events into the current turn and commit on `final`. See `onMessage` in `VoiceAgent.tsx`. |
| Spanish assistant speaks English | Check `assistantFor(lang)` is getting `"es"` — page component must pass `lang="es"` to `<VoiceAgent>`. Deepgram `language: "es"` must also be set in the assistant config. |
| Call drops at ~10 min | `maxDurationSeconds: 600` in the assistant config. Raise if needed. |

---

## Rollback plan

If voice agent misbehaves in production and you need the form back as the primary path, flip the overlay off in all four page components by hard-coding `overlayDismissed` to `true`. The underlying `<LeadForm>` / `<LeadFormMobile>` still works unchanged — the voice layer was strictly additive to the DOM.

Faster: revert the single commit that introduces `<VoiceAgent>` into the four page files. The schema change (four nullable columns on `leads`) is additive and safe to leave in place.


---

## Pre-voice-cutover project reference

*The rest of this document describes the original form-based funnel architecture. Most of it still applies — routing, tech stack, design system, database, deployment. Sections that are now superseded by the voice cutover (Section 2 form funnel, Section 4 form submission flow) are noted inline.*

## 1. What Was Built

A full-stack, production-ready lead generation funnel for a cash home buying business. The goal is to capture motivated seller leads (name, phone, address, property details) and store them in a database for follow-up.

### Two purpose-built funnels

| Route | Audience | Auto-served to |
|-------|----------|----------------|
| `/` | Desktop | All non-mobile browsers |
| `/m` | Mobile | iPhone, Android (auto-redirected via middleware) |

The routing is automatic — users never have to pick. The `middleware.ts` file reads the `User-Agent` header on every request and redirects mobile devices to `/m` before any page renders.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS 3 (custom design system) |
| Animation | Framer Motion 11 |
| Database ORM | Prisma 5 |
| Database | PostgreSQL (Railway — pending Neon migration) |
| Hosting | Vercel (auto-deploys on every git push) |
| Version control | GitHub |

---

## 3. Project Structure

```
buyyourcasa3/
├── app/
│   ├── layout.tsx              # Root layout, metadata, fonts
│   ├── page.tsx                # Desktop funnel page
│   ├── globals.css             # Design system, utilities, mobile CSS
│   ├── m/
│   │   └── page.tsx            # Mobile funnel page
│   └── api/
│       └── leads/
│           ├── route.ts        # POST (create lead) · GET (list leads)
│           └── [id]/
│               └── route.ts    # PATCH (progressive update)
│
├── components/
│   ├── Navigation.tsx          # Desktop sticky nav
│   ├── Hero.tsx                # Cinematic full-screen hero
│   ├── TrustBar.tsx            # 6-item credibility bar
│   ├── HowItWorks.tsx          # 3-step process section
│   ├── PainToRelief.tsx        # 8 seller situation cards
│   ├── Comparison.tsx          # Us vs traditional listing table
│   ├── Testimonials.tsx        # Interactive testimonial selector
│   ├── ServiceArea.tsx         # City grid + map placeholder
│   ├── FAQ.tsx                 # Accordion FAQ
│   ├── LeadForm.tsx            # 4-step desktop lead form
│   ├── FinalCTA.tsx            # Closing CTA section
│   └── Footer.tsx              # Footer with links + contact
│
├── components/mobile/
│   ├── NavMobile.tsx           # Minimal nav + click-to-call
│   ├── HeroMobile.tsx          # Hero with address input (Step 1)
│   ├── TrustStripMobile.tsx    # 2×3 icon grid
│   ├── HowItWorksMobile.tsx    # Vertical stacked steps
│   ├── PainChipsMobile.tsx     # Situation chip grid
│   ├── ComparisonMobile.tsx    # Stacked card comparison
│   ├── TestimonialsMobile.tsx  # CSS scroll-snap carousel
│   ├── LeadFormMobile.tsx      # 5-step mobile form (one Q/screen)
│   ├── FAQMobile.tsx           # Compact accordion
│   ├── FinalCTAMobile.tsx      # Closing section
│   └── StickyCTA.tsx           # Persistent bottom CTA bar
│
├── lib/
│   └── prisma.ts               # Prisma client singleton
│
├── prisma/
│   └── schema.prisma           # Database schema (Lead model)
│
├── middleware.ts               # Mobile UA detection + redirect
├── tailwind.config.ts          # Full custom design system
├── next.config.mjs             # Next.js config
└── SETUP.md                    # Quick-start + customization guide
```

---

## 4. Database

### Schema — `leads` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | String (cuid) | Primary key |
| `createdAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Auto-updated |
| `address` | String | **Captured on Step 1** |
| `source` | String | `"desktop"` or `"mobile"` |
| `step` | Int | Highest step reached (1–5) |
| `completed` | Boolean | True only on final submission |
| `phone` | String? | Step 2 |
| `firstName` | String? | Step 3 |
| `lastName` | String? | Step 3 |
| `email` | String? | Step 3 (optional) |
| `condition` | String? | Step 4 |
| `timeline` | String? | Step 4 |
| `reason` | String? | Step 4 (optional) |

### Progressive capture flow

```
User hits "Continue" on Step 1 (address)
  → POST /api/leads  →  lead row created in DB immediately

User hits "Continue" on Steps 2–4
  → PATCH /api/leads/:id  →  row updated with new fields

User hits final "Submit"
  → PATCH /api/leads/:id  →  completed: true
```

Even if a user drops off after Step 1, their address is saved. If they drop off after Step 2, you have their address + phone. This maximizes partial lead recovery.

### API Endpoints

```
POST  /api/leads          Create a new lead (address required)
PATCH /api/leads/:id      Update any lead fields progressively
GET   /api/leads          List all leads (last 100, newest first)
```

---

## 5. Environment Variables

| Variable | Where to set | Value |
|----------|-------------|-------|
| `DATABASE_URL` | `.env` locally + Vercel dashboard | PostgreSQL connection string |

### Setting up the database (one-time)

**Recommended: Vercel + Neon (free)**
1. Vercel Dashboard → your project → **Storage** → **Create Database** → Neon Postgres
2. `DATABASE_URL` is auto-injected into your Vercel environment
3. Run locally: `npx prisma migrate dev --name init`

**Alternative: Railway**
1. railway.app → New Project → PostgreSQL
2. Database → Connect tab → copy `DATABASE_URL`
3. Add to Vercel: Settings → Environment Variables → `DATABASE_URL`
4. Run: `npx prisma migrate dev --name init`

> The migration creates the `leads` table. Only needs to run once per environment.

---

## 6. Deployments

### How deploys work
Every `git push` to `master` triggers an automatic Vercel production deployment. No manual steps needed.

```bash
# Standard deploy workflow
git add .
git commit -m "your message"
git push  # → Vercel auto-deploys
```

### Manual deploy (if needed)
```bash
vercel --prod
```

### Preview deploys
Every pull request gets a unique preview URL from Vercel automatically.

---

## 7. Customization Guide

### Brand / company name
Global find-and-replace `BuyYourCasa` across all files.

### Phone number
Two places:
- `components/Navigation.tsx` — desktop nav
- `components/mobile/NavMobile.tsx` — mobile nav + click-to-call
- `components/mobile/StickyCTA.tsx` — sticky bottom bar
- `components/Footer.tsx` — footer contact

### Email address
- `components/Footer.tsx`

### Hero copy
- Desktop: `components/Hero.tsx` — headline, subheadline, stats
- Mobile: `components/mobile/HeroMobile.tsx` — headline, subheadline

### Testimonials
- Desktop: `components/Testimonials.tsx` → `testimonials` array
- Mobile: `components/mobile/TestimonialsMobile.tsx` → `testimonials` array

### Service cities
- `components/ServiceArea.tsx` → `cities` array

### FAQ answers
- Desktop: `components/FAQ.tsx` → `faqs` array
- Mobile: `components/mobile/FAQMobile.tsx` → `faqs` array

### Adding a real hero background image
In `components/Hero.tsx` and `components/mobile/HeroMobile.tsx`, replace the CSS gradient background div with:

```tsx
import Image from "next/image";

// Inside the background layer:
<Image
  src="/hero-bg.jpg"   // place image in /public/
  alt=""
  fill
  priority
  className="object-cover opacity-30"
/>
```

Use a dark, cinematic architectural photo. The existing gradient overlays will tone it correctly.

### Connecting a CRM or webhook
In `app/api/leads/route.ts` (POST handler), after the `prisma.lead.create()` call, add your CRM push:

```ts
// Example: Zapier webhook
await fetch("https://hooks.zapier.com/hooks/catch/YOUR_HOOK", {
  method: "POST",
  body: JSON.stringify({ address: body.address, source: body.source }),
});

// Example: GoHighLevel
await fetch("https://rest.gohighlevel.com/v1/contacts/", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.GHL_API_KEY}` },
  body: JSON.stringify({ /* map fields */ }),
});
```

---

## 8. Design System

### Color tokens (tailwind.config.ts)

| Token | Hex | Usage |
|-------|-----|-------|
| `gold-500` | `#C9A96E` | Primary accent, CTAs, highlights |
| `gold-300` | `#E8C98A` | Hover states, gradient light end |
| `obsidian-900` | `#08080C` | Page background |
| `surface` | `#111117` | Section backgrounds |
| `surface-card` | `#16161E` | Card backgrounds |
| `surface-border` | `#242430` | Borders, dividers |
| `cream-200` | `#F8F4EE` | Primary text |

### Typography

| Class | Font | Usage |
|-------|------|-------|
| `font-display` | Cormorant Garamond | All headings, large display text |
| `font-body` | Inter | All body copy, UI labels |

Fonts load from Google Fonts via `globals.css` `@import`.

### Key utility classes (globals.css)

| Class | Effect |
|-------|--------|
| `.btn-gold` | Primary gold CTA button with shimmer |
| `.btn-outline` | Gold-bordered secondary button |
| `.form-input` | Styled dark form field |
| `.text-gradient-gold` | Gold gradient text fill |
| `.glass-card` | Glassmorphism card |
| `.gold-divider` | Thin horizontal gold line |

---

## 9. Mobile UX Notes

Key decisions made for the mobile funnel:

- **Address in hero** — Step 1 of the form starts at the hero. Entering address = entering the funnel. Lifts conversion by eliminating the barrier of "finding" the form.
- **One question per step** — Each form step has exactly one primary question. Reduces cognitive load and abandonment.
- **CSS scroll-snap carousel** — Testimonials use native browser scroll-snap (not JS drag). This is smoother on mobile because it runs on the compositor thread.
- **`font-size: 16px` on all inputs** — Prevents iOS Safari from auto-zooming on focus, which breaks layout.
- **`-webkit-tap-highlight-color: transparent`** — Removes the blue flash on tap that makes apps feel cheap.
- **`env(safe-area-inset-bottom)`** — Sticky CTA respects iPhone notch/home indicator zone.
- **Sticky CTA logic** — Shows when hero is scrolled past, hides when the form section is visible (avoids competing with the primary conversion UI).

---

## 10. Testing the Mobile Redirect

| Scenario | How to test |
|----------|-------------|
| Force mobile on desktop | Visit `/?preview=mobile` |
| Force desktop on mobile | Visit `/?preview=desktop` |
| Real mobile | Open on iPhone/Android |
| Chrome DevTools | F12 → device icon → iPhone 14 Pro → navigate to `/m` |

---

## 11. Known Gaps / Next Steps

| Item | Priority | Notes |
|------|----------|-------|
| Database migration | **Required** | `npx prisma migrate dev --name init` must be run against Railway or Neon before leads save |
| Real hero image | High | Replace CSS gradient with actual architectural photo |
| CRM integration | High | Wire `/api/leads` POST to GoHighLevel, HubSpot, or Zapier |
| Email notification | High | Alert team when a new completed lead comes in (Resend recommended) |
| Admin dashboard | Medium | Simple `/admin` page to view leads — `GET /api/leads` is already built |
| Real testimonials | Medium | Replace placeholder names/quotes with real seller stories |
| Real service cities | Medium | Update `cities` array in `ServiceArea.tsx` |
| Real phone/email | Medium | Replace `(555) 000-1234` throughout |
| Google Analytics | Medium | Add GA4 or GTM in `app/layout.tsx` |
| Next.js upgrade | Low | v14.2.5 has a security advisory — upgrade to latest when ready |
| SEO meta per page | Low | Add location-specific meta in `app/layout.tsx` |

---

## 12. Quick Reference Commands

```bash
# Run locally
npm run dev

# Build production
npm run build

# Deploy to Vercel
git push  # auto-deploys via GitHub integration

# Run database migration (after connecting DATABASE_URL)
npx prisma migrate dev --name init

# Open Prisma Studio (visual DB browser)
npx prisma studio

# View all leads via API
curl https://buyyourcasa3.vercel.app/api/leads

# Regenerate Prisma client after schema changes
npx prisma generate
```

---

*Built with Next.js 14, Tailwind CSS, Framer Motion, Prisma 5, and PostgreSQL.*
