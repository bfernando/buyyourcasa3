# BuyYourCasa — Project Handoff Document

**Last updated:** April 2026  
**Live URL:** https://buyyourcasa3.vercel.app  
**GitHub:** https://github.com/bfernando/buyyourcasa3  
**Vercel project:** bradley-fernandos-projects/buyyourcasa3

---

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
