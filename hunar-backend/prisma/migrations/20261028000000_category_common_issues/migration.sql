-- Common issues list per category (Admin flow)
ALTER TABLE "ServiceCategory" ADD COLUMN IF NOT EXISTS "commonIssues" JSONB;

