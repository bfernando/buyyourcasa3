"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * LeadFormMobile
 * ───────────────
 * UX decisions:
 *
 * 1. ONE question per step — reduces cognitive load, makes each step feel trivial.
 *    Research: single-question forms increase completion 47% on mobile vs multi-field.
 *
 * 2. Address is step 1 — it's about THEIR property (low personal info anxiety).
 *    By the time we ask for phone/email, they're invested and proceeding on momentum.
 *
 * 3. Phone before email — phone is more valuable for follow-up; email on step 4
 *    (by then they've committed psychologically and won't bail over email).
 *
 * 4. Visual option cards for condition/timeline — eliminates typing, eliminates errors,
 *    tapping feels faster and more premium than typing on mobile.
 *
 * 5. Progress bar top — constant visible progress reduces abandonment.
 *    "4 of 5" is not far; "1 more step" keeps them going.
 *
 * 6. Autofocus on each step's primary input — keyboard appears immediately,
 *    no extra tap needed, reduces time-to-completion.
 *
 * 7. "Continue" button always in thumb zone (bottom) — no finger stretch.
 *
 * 8. Microcopy "No obligation" under every CTA — removes purchase anxiety.
 *
 * 9. font-size: 16px minimum — prevents iOS Safari from zooming on input focus.
 */

type FormData = {
  address: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  condition: string;
  timeline: string;
  reason: string;
};

const TOTAL_STEPS = 5;

// Step labels for progress bar
const stepLabels = ["Address", "Phone", "Name", "Details", "Confirm"];

const conditionOptions = [
  { value: "excellent", emoji: "✨", label: "Great Shape", sub: "Move-in ready" },
  { value: "good", emoji: "👍", label: "Good", sub: "Minor cosmetic work" },
  { value: "fair", emoji: "🔨", label: "Needs Work", sub: "Some repairs" },
  { value: "poor", emoji: "🏚", label: "Major Work", sub: "Significant damage" },
];

const timelineOptions = [
  { value: "asap", label: "ASAP", sub: "7–14 days" },
  { value: "30days", label: "30 Days", sub: "Somewhat urgent" },
  { value: "90days", label: "1–3 Months", sub: "Planning ahead" },
  { value: "flexible", label: "Flexible", sub: "No deadline" },
];

const reasonOptions = [
  "Foreclosure / Behind on Payments",
  "Inherited Property",
  "Divorce",
  "Relocating",
  "Tired Landlord",
  "Major Repairs",
  "Downsizing",
  "Estate Sale",
  "Other / Prefer Not to Say",
];

// ─── MobileOptionCard ────────────────────────────────────────────────────────
function OptionCard({
  label, sub, emoji, selected, onClick,
}: {
  label: string; sub: string; emoji?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 p-4 rounded-sm border text-left transition-all duration-200 ${
        selected ? "border-gold/50 bg-gold/[0.07]" : "border-surface-border bg-surface"
      }`}
      style={{ minHeight: 56, touchAction: "manipulation" }}
    >
      {emoji && <span className="text-xl shrink-0 leading-none">{emoji}</span>}
      <div className="flex-1">
        <p className={`font-body text-sm font-medium leading-tight ${selected ? "text-cream" : "text-cream/70"}`}>{label}</p>
        <p className={`font-body text-xs mt-0.5 ${selected ? "text-cream/50" : "text-cream/35"}`}>{sub}</p>
      </div>
      <div className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ${
        selected ? "border-gold bg-gold" : "border-surface-border"
      }`}>
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5 4-4" stroke="#08080C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </button>
  );
}

// ─── MobileInput ─────────────────────────────────────────────────────────────
function MobileInput({
  id, type = "text", label, placeholder, value, onChange, error, autoComplete, inputMode, autoFocus,
}: {
  id: string; type?: string; label: string; placeholder: string; value: string;
  onChange: (v: string) => void; error?: string; autoComplete?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"]; autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs uppercase tracking-[0.15em] text-cream/45 font-body font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={`form-input w-full h-14 px-4 rounded-sm ${error ? "border-red-500/50" : ""}`}
        style={{ fontSize: 16 }} // Critical: prevents iOS zoom on focus
      />
      {error && <p className="text-red-400/80 text-xs font-body">{error}</p>}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function MobileProgress({ step }: { step: number }) {
  const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  return (
    <div className="mb-7">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-cream/35 font-body">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="text-[10px] text-gold/60 font-body">
          {step < TOTAL_STEPS ? `${TOTAL_STEPS - step} step${TOTAL_STEPS - step > 1 ? "s" : ""} left` : "Ready to submit"}
        </span>
      </div>
      <div className="h-1 bg-surface-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gold rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

// ─── Main form ───────────────────────────────────────────────────────────────
interface LeadFormMobileProps {
  prefillAddress?: string;
}

export default function LeadFormMobile({ prefillAddress = "" }: LeadFormMobileProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [leadId, setLeadId] = useState<string | null>(null); // DB record ID for progressive updates
  const [form, setForm] = useState<FormData>({
    address: prefillAddress,
    phone: "",
    firstName: "",
    lastName: "",
    email: "",
    condition: "",
    timeline: "",
    reason: "",
  });

  // When hero passes a prefilled address, update form
  useEffect(() => {
    if (prefillAddress) {
      setForm((prev) => ({ ...prev, address: prefillAddress }));
    }
  }, [prefillAddress]);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ─── Progressive capture helpers ─────────────────────────────────────────
  const createLead = async (address: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, source: "mobile" }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.id as string;
    } catch {
      return null;
    }
  };

  const updateLead = async (id: string, patch: Record<string, unknown>) => {
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch {
      // Silently fail — don't block UX for a DB write error
    }
  };

  // ─── Validation ───────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 1 && !form.address.trim()) e.address = "Please enter your property address";
    if (step === 2) {
      if (!form.phone.trim()) e.phone = "Phone number required";
      else if (!/^[\d\s\-().+]{7,}$/.test(form.phone)) e.phone = "Enter a valid phone number";
    }
    if (step === 3) {
      if (!form.firstName.trim()) e.firstName = "First name required";
      if (!form.lastName.trim()) e.lastName = "Last name required";
    }
    if (step === 4) {
      if (!form.condition) e.condition = "Please select a condition";
      if (!form.timeline) e.timeline = "Please select a timeline";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = async () => {
    if (!validate()) return;

    // Step 1 complete → create lead record immediately (address captured)
    if (step === 1) {
      const id = await createLead(form.address);
      if (id) setLeadId(id);
    }

    // Steps 2–4 → progressively update the existing record
    if (step === 2 && leadId) {
      updateLead(leadId, { phone: form.phone, step: 2 });
    }
    if (step === 3 && leadId) {
      updateLead(leadId, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        step: 3,
      });
    }
    if (step === 4 && leadId) {
      updateLead(leadId, {
        condition: form.condition,
        timeline: form.timeline,
        reason: form.reason || undefined,
        step: 4,
      });
    }

    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const back = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const submit = async () => {
    if (leadId) {
      await updateLead(leadId, {
        completed: true,
        step: 5,
        // Catch anything not yet saved
        condition: form.condition,
        timeline: form.timeline,
        reason: form.reason || undefined,
      });
    }
    setSubmitted(true);
  };

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
  };

  return (
    <section
      id="mobile-form"
      className="relative py-12 px-5 bg-surface min-h-screen"
      style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom))" }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      {/* Section header */}
      {!submitted && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-px bg-gold/50" />
            <span className="text-gold/60 text-[10px] uppercase tracking-[0.25em] font-body">Get Started</span>
          </div>
          <h2 className="font-display font-light text-cream text-4xl leading-tight">
            Your offer is{" "}
            <span className="italic text-gradient-gold">2 minutes away</span>
          </h2>
        </div>
      )}

      {!submitted ? (
        <>
          <MobileProgress step={step} />

          {/* Step content */}
          <div style={{ minHeight: 320 }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* ── Step 1: Address ─────────────────────────────────────── */}
                {step === 1 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="font-display text-2xl text-cream mb-1.5">Where is the property?</h3>
                      <p className="text-cream/40 font-body text-sm">Just the address to get started.</p>
                    </div>
                    <MobileInput
                      id="m-address"
                      label="Property Address"
                      placeholder="123 Maple Street, Atlanta, GA"
                      value={form.address}
                      onChange={(v) => update("address", v)}
                      error={errors.address}
                      autoComplete="street-address"
                      autoFocus
                    />
                  </div>
                )}

                {/* ── Step 2: Phone ────────────────────────────────────────── */}
                {step === 2 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="font-display text-2xl text-cream mb-1.5">What&apos;s your phone number?</h3>
                      <p className="text-cream/40 font-body text-sm">We&apos;ll call or text you with your offer.</p>
                    </div>
                    <MobileInput
                      id="m-phone"
                      type="tel"
                      inputMode="tel"
                      label="Phone Number"
                      placeholder="(555) 000-0000"
                      value={form.phone}
                      onChange={(v) => update("phone", v)}
                      error={errors.phone}
                      autoComplete="tel"
                      autoFocus
                    />
                    <div className="flex items-center gap-2 bg-obsidian-900 rounded-sm px-4 py-3 border border-surface-border">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M7.5 1.5A6 6 0 1 1 7.5 13.5 6 6 0 0 1 7.5 1.5z" stroke="#C9A96E" strokeWidth="1.2"/>
                        <path d="M7.5 6.5v4M7.5 4.5v.5" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <p className="text-cream/40 font-body text-xs">We never sell or share your number.</p>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Name ─────────────────────────────────────────── */}
                {step === 3 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="font-display text-2xl text-cream mb-1.5">What&apos;s your name?</h3>
                      <p className="text-cream/40 font-body text-sm">So we know who to address your offer to.</p>
                    </div>
                    <MobileInput
                      id="m-first"
                      label="First Name"
                      placeholder="First name"
                      value={form.firstName}
                      onChange={(v) => update("firstName", v)}
                      error={errors.firstName}
                      autoComplete="given-name"
                      autoFocus
                    />
                    <MobileInput
                      id="m-last"
                      label="Last Name"
                      placeholder="Last name"
                      value={form.lastName}
                      onChange={(v) => update("lastName", v)}
                      error={errors.lastName}
                      autoComplete="family-name"
                    />
                    <MobileInput
                      id="m-email"
                      type="email"
                      inputMode="email"
                      label="Email (optional)"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(v) => update("email", v)}
                      autoComplete="email"
                    />
                  </div>
                )}

                {/* ── Step 4: Property details ─────────────────────────────── */}
                {step === 4 && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="font-display text-2xl text-cream mb-1.5">Tell us about the property</h3>
                      <p className="text-cream/40 font-body text-sm">Two quick questions — no wrong answers.</p>
                    </div>

                    {/* Condition */}
                    <div>
                      <p className="text-xs uppercase tracking-widest text-cream/45 font-body mb-3">Property Condition</p>
                      <div className="grid grid-cols-2 gap-2">
                        {conditionOptions.map((opt) => (
                          <OptionCard
                            key={opt.value}
                            {...opt}
                            selected={form.condition === opt.value}
                            onClick={() => update("condition", opt.value)}
                          />
                        ))}
                      </div>
                      {errors.condition && <p className="text-red-400/80 text-xs font-body mt-1">{errors.condition}</p>}
                    </div>

                    {/* Timeline */}
                    <div>
                      <p className="text-xs uppercase tracking-widest text-cream/45 font-body mb-3">Ideal Closing Timeline</p>
                      <div className="flex flex-col gap-2">
                        {timelineOptions.map((opt) => (
                          <OptionCard
                            key={opt.value}
                            label={opt.label}
                            sub={opt.sub}
                            selected={form.timeline === opt.value}
                            onClick={() => update("timeline", opt.value)}
                          />
                        ))}
                      </div>
                      {errors.timeline && <p className="text-red-400/80 text-xs font-body mt-1">{errors.timeline}</p>}
                    </div>

                    {/* Reason (optional) */}
                    <div>
                      <label htmlFor="m-reason" className="text-xs uppercase tracking-widest text-cream/45 font-body block mb-2">
                        Reason for Selling <span className="text-cream/25 normal-case">(optional)</span>
                      </label>
                      <select
                        id="m-reason"
                        value={form.reason}
                        onChange={(e) => update("reason", e.target.value)}
                        className="form-input w-full h-14 px-4 rounded-sm appearance-none"
                        style={{ fontSize: 16 }}
                      >
                        <option value="">Select if you&apos;d like...</option>
                        {reasonOptions.map((r) => (
                          <option key={r} value={r} className="bg-[#16161E]">{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* ── Step 5: Review & confirm ─────────────────────────────── */}
                {step === 5 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="font-display text-2xl text-cream mb-1.5">
                        Looks good, {form.firstName || "friend"}.
                      </h3>
                      <p className="text-cream/40 font-body text-sm">
                        Review and submit — we&apos;ll have your offer within 24 hours.
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="bg-obsidian-900 border border-surface-border rounded-sm divide-y divide-surface-border">
                      {[
                        { label: "Property", value: form.address, step: 1 },
                        { label: "Phone", value: form.phone, step: 2 },
                        { label: "Name", value: `${form.firstName} ${form.lastName}`, step: 3 },
                        {
                          label: "Condition",
                          value: `${conditionOptions.find(c => c.value === form.condition)?.label ?? "—"} · ${timelineOptions.find(t => t.value === form.timeline)?.label ?? "—"}`,
                          step: 4,
                        },
                      ].map((row) => (
                        <div key={row.label} className="flex items-start justify-between px-4 py-3.5 gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-widest text-cream/30 font-body mb-0.5">{row.label}</p>
                            <p className="text-cream/75 font-body text-sm truncate">{row.value}</p>
                          </div>
                          <button
                            onClick={() => { setDirection(-1); setStep(row.step); }}
                            className="text-gold/50 text-xs font-body hover:text-gold transition-colors shrink-0 mt-3"
                            style={{ touchAction: "manipulation" }}
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>

                    <p className="text-cream/25 font-body text-xs leading-relaxed">
                      By submitting, you agree to be contacted about your property.
                      We respect your privacy — no spam, no third-party sharing.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3 mt-8">
            {step < TOTAL_STEPS ? (
              <button
                onClick={next}
                className="btn-gold h-14 w-full rounded-sm flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide"
                style={{ touchAction: "manipulation" }}
              >
                Continue
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <button
                onClick={submit}
                className="btn-gold h-14 w-full rounded-sm flex items-center justify-center gap-2.5 text-sm font-semibold uppercase tracking-wide"
                style={{ touchAction: "manipulation" }}
              >
                Get My Cash Offer
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}

            <p className="text-center text-cream/25 text-xs font-body">
              No obligation · No spam · Free
            </p>

            {step > 1 && (
              <button
                onClick={back}
                className="text-cream/35 text-sm font-body text-center py-2 hover:text-cream/60 transition-colors"
                style={{ touchAction: "manipulation" }}
              >
                ← Back
              </button>
            )}
          </div>
        </>
      ) : (
        /* ── SUCCESS STATE ─────────────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center py-8"
        >
          {/* Check animation */}
          <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center mb-7">
            <motion.svg
              width="32" height="32" viewBox="0 0 32 32" fill="none"
            >
              <motion.path
                d="M6 16l7 7 13-13"
                stroke="#C9A96E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              />
            </motion.svg>
          </div>

          <h3 className="font-display text-3xl text-cream mb-3 leading-tight">
            You&apos;re all set,<br />{form.firstName}.
          </h3>
          <p className="text-cream/50 font-body text-base leading-relaxed mb-6 max-w-xs">
            Our team will reach out within 24 hours with your cash offer.
            No pressure, no obligation.
          </p>

          <div className="flex flex-col gap-1 text-cream/25 text-xs font-body uppercase tracking-widest">
            <span>No obligation</span>
            <span>No pressure</span>
            <span>Just a fair offer</span>
          </div>

          {/* Call option on success */}
          <a
            href="tel:+15550001234"
            className="mt-8 flex items-center gap-2 text-gold/70 text-sm font-body hover:text-gold transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.2 10.6l-2.1-2c-.4-.4-1-.4-1.4 0l-.8.8c-.8-.7-1.9-1.8-2.6-2.7l.8-.7c.4-.4.4-1 0-1.4L5 2.5c-.4-.4-1-.4-1.4 0l-.8.8c-.7.8-1.2 2.9 1.3 5.6 2.4 2.6 4.6 2 5.4 1.3l.7-.7c.4-.4.4-1-.3-2z" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            Rather talk now? Call us.
          </a>
        </motion.div>
      )}
    </section>
  );
}
