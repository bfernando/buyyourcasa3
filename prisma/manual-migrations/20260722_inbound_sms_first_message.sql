-- Apply once to the production database before deploying the corresponding
-- application code. This repository predates Prisma migration history, so use
-- `prisma db execute` (or the Neon SQL editor) instead of `migrate deploy`.

ALTER TABLE "leads"
  ADD COLUMN IF NOT EXISTS "channel" TEXT,
  ADD COLUMN IF NOT EXISTS "smsProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "providerMessageId" TEXT,
  ADD COLUMN IF NOT EXISTS "inboundMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "firstInboundAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastInboundAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "smsOptedOutAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "smsEmailAlertClaimedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "smsInternalAlertClaimedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "attribution" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "leads_callId_key"
  ON "leads"("callId");

CREATE UNIQUE INDEX IF NOT EXISTS "leads_providerMessageId_key"
  ON "leads"("providerMessageId");

