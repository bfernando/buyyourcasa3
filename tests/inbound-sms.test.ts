import assert from "node:assert/strict";
import test from "node:test";

import {
  ADVERTISED_SMS_NUMBER,
  evaluateInboundSms,
  extractLatestUserMessage,
  normalizePhoneNumber,
  notificationDispatchPlan,
  notificationExcludedNumbers,
} from "../lib/sms/inbound.ts";

const OWNER_NUMBER = "+16195550123";
const PROSPECT_NUMBER = "+16195550999";

test("normalizes US sender numbers and rejects unresolved templates", () => {
  assert.equal(normalizePhoneNumber("(619) 555-0999"), PROSPECT_NUMBER);
  assert.equal(normalizePhoneNumber("sms:+1 619 555 0999"), PROSPECT_NUMBER);
  assert.equal(normalizePhoneNumber("{{customer.number}}"), undefined);
  assert.equal(normalizePhoneNumber("provider"), undefined);
});

test("extracts the exact latest customer message from Vapi chat input", () => {
  assert.equal(
    extractLatestUserMessage([
      { role: "user", content: "I might sell." },
      { role: "assistant", content: "What is the address?" },
      {
        role: "user",
        content: [{ type: "text", text: "123 Main St, San Diego" }],
      },
    ]),
    "123 Main St, San Diego",
  );
});

test("accepts the first seller-intent SMS without requiring an address", () => {
  const decision = evaluateInboundSms({
    sender: PROSPECT_NUMBER,
    message: "Hi, I may need to sell my house quickly.",
    source: "sms-vapi",
    isTest: false,
    excludedNumbers: [ADVERTISED_SMS_NUMBER, OWNER_NUMBER],
  });

  assert.equal(decision.kind, "prospect");
  assert.equal(decision.normalizedSender, PROSPECT_NUMBER);
  assert.equal(decision.shouldPersist, true);
  assert.equal(decision.shouldAlert, true);
  assert.match(decision.replyInstruction ?? "", /property address/i);
});

test("keeps the legacy address-first tool payload working", () => {
  const decision = evaluateInboundSms({
    sender: PROSPECT_NUMBER,
    address: "123 Main St, San Diego, CA",
    source: "sms-vapi",
    isTest: false,
    excludedNumbers: [ADVERTISED_SMS_NUMBER, OWNER_NUMBER],
  });

  assert.equal(decision.kind, "prospect");
  assert.equal(decision.shouldAlert, true);
  assert.match(decision.replyInstruction ?? "", /follow up/i);
});

test("does not persist or alert on owner, company, or system senders", () => {
  const excludedNumbers = notificationExcludedNumbers(
    ADVERTISED_SMS_NUMBER,
    OWNER_NUMBER,
  );

  for (const sender of [OWNER_NUMBER, ADVERTISED_SMS_NUMBER, "short-code"]) {
    const decision = evaluateInboundSms({
      sender,
      message: "test",
      source: "sms-vapi",
      isTest: false,
      excludedNumbers,
    });
    assert.equal(decision.kind, "ignored");
    assert.equal(decision.shouldPersist, false);
    assert.equal(decision.shouldAlert, false);
  }
});

test("persists explicit QA messages but suppresses every alert", () => {
  for (const input of [
    { source: "test-sms-vapi", isTest: false },
    { source: "sms-vapi", isTest: true },
  ]) {
    const decision = evaluateInboundSms({
      sender: PROSPECT_NUMBER,
      message: "Automated QA seller message",
      excludedNumbers: [ADVERTISED_SMS_NUMBER, OWNER_NUMBER],
      ...input,
    });
    assert.equal(decision.kind, "test");
    assert.equal(decision.shouldPersist, true);
    assert.equal(decision.shouldAlert, false);
  }
});

test("recognizes STOP, HELP, and START without prospect alerts", () => {
  const cases = [
    ["STOP", "opt_out"],
    ["Please stop!", "opt_out"],
    ["help", "help"],
    ["START", "opt_in"],
  ] as const;

  for (const [message, kind] of cases) {
    const decision = evaluateInboundSms({
      sender: PROSPECT_NUMBER,
      message,
      source: "sms-vapi",
      isTest: false,
      excludedNumbers: [ADVERTISED_SMS_NUMBER, OWNER_NUMBER],
    });
    assert.equal(decision.kind, kind);
    assert.equal(decision.shouldPersist, true);
    assert.equal(decision.shouldAlert, false);
    if (kind === "help" || kind === "opt_in") {
      assert.ok(decision.replyInstruction);
    }
  }
});

test("provider retry claim counts dispatch no duplicate notifications", () => {
  assert.deepEqual(notificationDispatchPlan(1, 1), {
    email: true,
    sms: true,
    acquisition: true,
  });
  assert.deepEqual(notificationDispatchPlan(0, 0), {
    email: false,
    sms: false,
    acquisition: false,
  });
});
