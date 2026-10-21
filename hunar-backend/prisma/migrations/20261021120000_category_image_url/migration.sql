-- Category cover images chosen by admins (Admin flow §11).
ALTER TABLE "ServiceCategory" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
