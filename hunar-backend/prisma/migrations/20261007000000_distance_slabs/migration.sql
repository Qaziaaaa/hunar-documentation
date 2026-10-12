-- Configurable delivery and distance charges per category (feat/shafqatullah 47ada0a).
-- Idempotent: this column was applied to some environments out-of-band (prisma db push)
-- before the migration was committed; IF NOT EXISTS keeps `migrate deploy` safe there.
ALTER TABLE "ServiceCategory" ADD COLUMN IF NOT EXISTS "distanceSlabs" JSONB;
