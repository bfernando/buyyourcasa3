"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { content, Locale } from "@/lib/content";

// ─── Types ────────────────────────────────────────────────────────────────────
type FormData = {
  address: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  condition: string;
  timeline: string;
  reason: string;
};

const initialData: FormData = {
  address: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  condition: "",
  timeline: "",
  reason: "",
};

// ─── Step config (static numbers only, labels from content) ──────────────────
const STEP_NUMBERS = [1, 2, 3, 4];

// ─── Sub-components ───────────────────────────────────────────────────────────
function ProgressBar({ currentStep, stepLabels }: { currentStep: number; stepLabels: string[] }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        {STEP_NUMBERS.map((num, i) => (
          <div key={num} className="flex items-center gap-0">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium font-body transition-all duration-500 ${
                  i + 1 < currentStep
                    ? "bg-gold text-obsidian-900"
                    : i + 1 === currentStep
                    ? "bg-gold/15 border-2 border-gold text-gold"
                    : "bg-surface-hover border border-surface-border text-cream/30"
                }`}
              >
                {i + 1 < currentStep ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-body hidden sm:block transition-colors duration-300 ${
                i + 1 === currentStep ? "text-gold" : i + 1 < currentStep ? "text-cream/60" : "text-cream/25"
              }`}>
                {stepLabels[i]}
              </span>
            </div>

            {i < STEP_NUMBERS.length - 1 && (
              <div className="flex-1 h-px mx-2 mt-[-11px] overflow-hidden bg-surface-border min-w-[20px] sm:min-w-[40px]">
                <motion.div
                  className="h-full bg-gold/60"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i + 1 < currentStep ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: "left" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InputField({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs uppercase tracking-widest text-cream/50 font-body">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={`form-input w-full px-4 py-3.5 rounded-sm text-base focus:outline-none transition-all duration-300 ${
          error ? "border-red-500/60 bg-red-500/5" : ""
        }`}
      />
      {error && <p className="text-red-400/80 text-xs font-body">{error}</p>}
    </div>
  );
}

function OptionCard({
  value,
  label,
  sub,
  selected,
  onClick,
}: {
  value: string;
  label: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left p-4 rounded-sm border transition-all duration-300 group ${
        selected
          ? "border-gold/50 bg-gold/8"
          : "border-surface-border bg-surface-hover hover:border-gold/25 hover:bg-gold/4"
      }`}
      style={{ background: selected ? "rgba(201,169,110,0.07)" : undefined }}
    >
      {/* Check */}
      <div className={`absolute top-3.5 right-3.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
        selected ? "border-gold bg-gold" : "border-surface-border group-hover:border-gold/30"
      }`}>
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5 4-4" stroke="#08080C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <p className={`font-body text-sm font-medium mb-0.5 transition-colors duration-300 ${selected ? "text-cream" : "text-cream/70"}`}>
        {label}
      </p>
      <p className={`font-body text-xs transition-colors duration-300 ${selected ? "text-cream/50" : "text-cream/35"}`}>
        {sub}
      </p>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LeadForm({ lang = "en" }: { lang?: Locale }) {
  const c = content[lang].form;
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitted, setSubmitted] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  const update = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ─── Progressive capture helpers ──────────────────────────────────────────
  const createLead = async (address: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, source: "desktop" }),
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

  // ─── Validation ────────────────────────────────────────────────────────
  const validateStep = () => {
    const newErrors: Partial<FormData> = {};

    if (step === 1) {
      if (!formData.address.trim()) newErrors.address = "Please enter your property address";
    }

    if (step === 2) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name required";
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number required";
      } else if (!/^[\d\s\-().+]{7,}$/.test(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number";
      }
      if (!formData.email.trim()) {
        newErrors.email = "Email address required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email";
      }
    }

    if (step === 3) {
      if (!formData.condition) newErrors.condition = "Please select a condition";
      if (!formData.timeline) newErrors.timeline = "Please select a timeline";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = async () => {
    if (!validateStep()) return;

    // Step 1 complete → create lead record immediately
    if (step === 1) {
      const id = await createLead(formData.address);
      if (id) setLeadId(id);
    }

    // Step 2 complete → save contact info
    if (step === 2 && leadId) {
      updateLead(leadId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        step: 2,
      });
    }

    // Step 3 complete → save property details
    if (step === 3 && leadId) {
      updateLead(leadId, {
        condition: formData.condition,
        timeline: formData.timeline,
        reason: formData.reason || undefined,
        step: 3,
      });
      setStep(4);
      setDirection(1);
      return;
    }

    setDirection(1);
    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    if (leadId) {
      await updateLead(leadId, { completed: true, step: 4 });
    }
    setSubmitted(true);
  };

  // ─── Step content ───────────────────────────────────────────────────────
  const stepVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 32 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -32 }),
  };

  return (
    <section
      id="form"
      ref={sectionRef}
      className="relative py-28 lg:py-40 bg-surface overflow-hidden"
    >
      {/* Background glow centered */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(201,169,110,0.06) 0%, transparent 65%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-start">

          {/* Left: Context copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-28"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-px bg-gold/40" />
              <span className="text-gold/70 uppercase tracking-[0.25em] text-[11px] font-body">
                {c.eyebrow}
              </span>
            </div>

            <h2
              className="font-display font-light text-cream mb-6 leading-[1.0]"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
            >
              {c.headline}{" "}
              <span className="italic text-gradient-gold">{c.headlineItalic}</span>
              <br />
              {c.headlineSuffix}
            </h2>

            <p className="text-cream/50 font-body font-light text-base leading-relaxed mb-10">
              {c.sub}
            </p>

            {/* Reassurance bullets */}
            <div className="flex flex-col gap-4 mb-12">
              {c.reassurances.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5 4-4" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-cream/55 font-body text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 pt-8 border-t border-surface-border">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L2 3.5v5.5c0 3.04 2.59 5.44 6 6.5 3.41-1.06 6-3.46 6-6.5V3.5L8 1z" stroke="#C9A96E" strokeWidth="1.2" fill="rgba(201,169,110,0.08)"/>
                  <path d="M5.5 8l2 2 3-3" stroke="#C9A96E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-cream/40 text-xs font-body">SSL Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="#C9A96E" strokeWidth="1.2"/>
                  <path d="M5.5 8l2 2 3-3" stroke="#C9A96E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-cream/40 text-xs font-body">No Spam Policy</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="#C9A96E" strokeWidth="1.2"/>
                  <path d="M5 4V3.5a3 3 0 016 0V4" stroke="#C9A96E" strokeWidth="1.2"/>
                </svg>
                <span className="text-cream/40 text-xs font-body">Data Protected</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Form card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="relative bg-obsidian-900 border border-surface-border rounded-sm overflow-hidden"
              style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04)" }}
            >
              {/* Gold top line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

              {/* Form inner */}
              <div className="p-8 lg:p-10">
                {!submitted ? (
                  <>
                    <ProgressBar currentStep={step} stepLabels={c.summaryLabels ? [c.summaryLabels.property, c.summaryLabels.contact, c.summaryLabels.details, c.steps[3].title] : ["Property", "Contact", "Details", "Confirm"]} />

                    {/* Step content */}
                    <div className="overflow-hidden" style={{ minHeight: 280 }}>
                      <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                          key={step}
                          custom={direction}
                          variants={stepVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {/* ── STEP 1: Address ──────────────── */}
                          {step === 1 && (
                            <div className="flex flex-col gap-6">
                              <div>
                                <h3 className="font-display text-2xl text-cream mb-2">
                                  {c.steps[0].title}
                                </h3>
                                <p className="text-cream/40 font-body text-sm">
                                  {c.steps[0].sub}
                                </p>
                              </div>
                              <InputField
                                id="address"
                                label={c.steps[0].label}
                                placeholder={c.steps[0].placeholder}
                                value={formData.address}
                                onChange={(v) => update("address", v)}
                                error={errors.address}
                                autoComplete="street-address"
                              />
                            </div>
                          )}

                          {/* ── STEP 2: Contact ──────────────── */}
                          {step === 2 && (
                            <div className="flex flex-col gap-5">
                              <div>
                                <h3 className="font-display text-2xl text-cream mb-2">
                                  {c.steps[1].title}
                                </h3>
                                <p className="text-cream/40 font-body text-sm">
                                  {c.steps[1].sub}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <InputField
                                  id="firstName"
                                  label={c.steps[1].labels!.firstName}
                                  placeholder={c.steps[1].placeholders!.firstName}
                                  value={formData.firstName}
                                  onChange={(v) => update("firstName", v)}
                                  error={errors.firstName}
                                  autoComplete="given-name"
                                />
                                <InputField
                                  id="lastName"
                                  label={c.steps[1].labels!.lastName}
                                  placeholder={c.steps[1].placeholders!.lastName}
                                  value={formData.lastName}
                                  onChange={(v) => update("lastName", v)}
                                  error={errors.lastName}
                                  autoComplete="family-name"
                                />
                              </div>
                              <InputField
                                id="phone"
                                label={c.steps[1].labels!.phone}
                                type="tel"
                                placeholder={c.steps[1].placeholders!.phone}
                                value={formData.phone}
                                onChange={(v) => update("phone", v)}
                                error={errors.phone}
                                autoComplete="tel"
                              />
                              <InputField
                                id="email"
                                label={c.steps[1].labels!.email}
                                type="email"
                                placeholder={c.steps[1].placeholders!.email}
                                value={formData.email}
                                onChange={(v) => update("email", v)}
                                error={errors.email}
                                autoComplete="email"
                              />
                            </div>
                          )}

                          {/* ── STEP 3: Details ──────────────── */}
                          {step === 3 && (
                            <div className="flex flex-col gap-6">
                              <div>
                                <h3 className="font-display text-2xl text-cream mb-2">
                                  {c.steps[2].title}
                                </h3>
                                <p className="text-cream/40 font-body text-sm">
                                  {c.steps[2].sub}
                                </p>
                              </div>

                              {/* Condition */}
                              <div>
                                <p className="text-xs uppercase tracking-widest text-cream/50 font-body mb-3">
                                  {c.conditionLabel}
                                </p>
                                <div className="grid grid-cols-2 gap-2.5">
                                  {c.conditions.map((opt) => (
                                    <OptionCard
                                      key={opt.value}
                                      value={opt.value}
                                      label={opt.label}
                                      sub={opt.sub}
                                      selected={formData.condition === opt.value}
                                      onClick={() => update("condition", opt.value)}
                                    />
                                  ))}
                                </div>
                                {errors.condition && (
                                  <p className="text-red-400/80 text-xs font-body mt-1">{errors.condition}</p>
                                )}
                              </div>

                              {/* Timeline */}
                              <div>
                                <p className="text-xs uppercase tracking-widest text-cream/50 font-body mb-3">
                                  {c.timelineLabel}
                                </p>
                                <div className="grid grid-cols-2 gap-2.5">
                                  {c.timelines.map((opt) => (
                                    <OptionCard
                                      key={opt.value}
                                      value={opt.value}
                                      label={opt.label}
                                      sub={opt.sub}
                                      selected={formData.timeline === opt.value}
                                      onClick={() => update("timeline", opt.value)}
                                    />
                                  ))}
                                </div>
                                {errors.timeline && (
                                  <p className="text-red-400/80 text-xs font-body mt-1">{errors.timeline}</p>
                                )}
                              </div>

                              {/* Reason */}
                              <div>
                                <label
                                  htmlFor="reason"
                                  className="text-xs uppercase tracking-widest text-cream/50 font-body block mb-2"
                                >
                                  {c.reasonLabel}{" "}
                                  <span className="text-cream/25 normal-case">{c.reasonOptional}</span>
                                </label>
                                <select
                                  id="reason"
                                  value={formData.reason}
                                  onChange={(e) => update("reason", e.target.value)}
                                  className="form-input w-full px-4 py-3.5 rounded-sm text-base appearance-none"
                                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23C9A96E' stroke-width='1.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
                                >
                                  <option value="" className="bg-[#16161E]">{c.reasonDefault}</option>
                                  {c.reasons.map((r) => (
                                    <option key={r} value={r} className="bg-[#16161E]">{r}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          {/* ── STEP 4: Review ───────────────── */}
                          {step === 4 && (
                            <div className="flex flex-col gap-6">
                              <div>
                                <h3 className="font-display text-2xl text-cream mb-2">
                                  {c.steps[3].title}
                                </h3>
                                <p className="text-cream/40 font-body text-sm">
                                  {c.steps[3].sub}
                                </p>
                              </div>

                              {/* Summary card */}
                              <div className="bg-surface border border-surface-border rounded-sm p-5 space-y-4">
                                <div className="flex justify-between items-start border-b border-surface-border pb-4">
                                  <div>
                                    <p className="text-xs text-cream/40 uppercase tracking-wider font-body mb-1">{c.summaryLabels.property}</p>
                                    <p className="text-cream/85 font-body text-sm">{formData.address}</p>
                                  </div>
                                  <button onClick={() => { setDirection(-1); setStep(1); }} className="text-gold/60 text-xs font-body hover:text-gold transition-colors">{c.editLabel}</button>
                                </div>
                                <div className="flex justify-between items-start border-b border-surface-border pb-4">
                                  <div>
                                    <p className="text-xs text-cream/40 uppercase tracking-wider font-body mb-1">{c.summaryLabels.contact}</p>
                                    <p className="text-cream/85 font-body text-sm">{formData.firstName} {formData.lastName}</p>
                                    <p className="text-cream/50 font-body text-xs mt-0.5">{formData.phone} · {formData.email}</p>
                                  </div>
                                  <button onClick={() => { setDirection(-1); setStep(2); }} className="text-gold/60 text-xs font-body hover:text-gold transition-colors">{c.editLabel}</button>
                                </div>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-xs text-cream/40 uppercase tracking-wider font-body mb-1">{c.summaryLabels.details}</p>
                                    <p className="text-cream/85 font-body text-sm capitalize">{formData.condition?.replace("_", " ")} · {formData.timeline?.replace("_", " ")}</p>
                                    {formData.reason && <p className="text-cream/50 font-body text-xs mt-0.5">{formData.reason}</p>}
                                  </div>
                                  <button onClick={() => { setDirection(-1); setStep(3); }} className="text-gold/60 text-xs font-body hover:text-gold transition-colors">{c.editLabel}</button>
                                </div>
                              </div>

                              <p className="text-cream/30 text-xs font-body leading-relaxed">
                                {c.privacyNote}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-border">
                      {step > 1 ? (
                        <button
                          onClick={goBack}
                          className="text-cream/40 hover:text-cream/70 font-body text-sm flex items-center gap-2 transition-colors duration-200"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M11.5 7H2.5M6.5 3L2.5 7L6.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {c.backLabel}
                        </button>
                      ) : (
                        <div />
                      )}

                      {step < 4 ? (
                        <button
                          onClick={goNext}
                          className="btn-gold px-8 py-3.5 rounded-sm flex items-center gap-2 text-sm"
                        >
                          {c.cta}
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmit}
                          className="btn-gold px-8 py-3.5 rounded-sm flex items-center gap-2.5 text-sm"
                        >
                          {c.submitCta}
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  /* ── SUCCESS STATE ─────────────────────────────── */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center py-8"
                  >
                    {/* Success icon */}
                    <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-7">
                      <motion.svg
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        width="32" height="32" viewBox="0 0 32 32" fill="none"
                      >
                        <motion.path
                          d="M6 16l7 7 13-13"
                          stroke="#C9A96E"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        />
                      </motion.svg>
                    </div>

                    <h3 className="font-display text-3xl text-cream mb-4">
                      {c.successTitle} {formData.firstName}.
                    </h3>
                    <p className="text-cream/50 font-body font-light text-base leading-relaxed mb-6 max-w-sm mx-auto">
                      {c.successSub}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-xs font-body text-cream/30 uppercase tracking-widest">
                      {c.successMicro.map((m, i) => (
                        <>
                          <span key={m}>{m}</span>
                          {i < c.successMicro.length - 1 && <span key={`d${i}`}>·</span>}
                        </>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
