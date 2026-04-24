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

### Lead Email Notifications
If you want an internal email alert whenever someone completes the funnel:

1. Add the Resend integration from the Vercel Marketplace. This creates `RESEND_API_KEY` on the project automatically.
2. Add these env vars in Vercel:

```bash
LEAD_ALERT_TO=<your-inbox@example.com>
LEAD_ALERT_FROM=BuyYourCasa Leads <onboarding@resend.dev>
```

The app sends one internal alert when a lead transitions to `completed=true`, across both the form and voice funnels.

When you're ready to use a custom sender instead of `onboarding@resend.dev`, verify a Resend sending domain first. Use a subdomain like `send.buyyour.casa` so you do not disturb any existing root-domain mail setup.

If `buyyour.casa` DNS is managed in Bluehost, add the Resend records in Bluehost:

1. Log in to Bluehost.
2. Open `Domains`.
3. Select `buyyour.casa`.
4. Open the `DNS` tab.
5. In `Manage Advanced DNS Records`, add the exact MX/TXT/CNAME records Resend gives you for the sending domain or subdomain.
6. After the records propagate, switch `LEAD_ALERT_FROM` to your verified sender, for example:

```bash
LEAD_ALERT_FROM=BuyYourCasa Leads <alerts@send.buyyour.casa>
```

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
