-- Migration: Replace Job/Order UUID system with human-readable Order Code (LLD-DDL format)
-- Format: ^[A-Z]{2}[0-9]-[0-9]{2}[A-Z]$ (e.g. AW3-90W)

-- 1. Enforce that ServiceRequest.id adheres strictly to the Order Code regex format
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_request_order_code_format_check'
  ) THEN
    ALTER TABLE "ServiceRequest"
    ADD CONSTRAINT "service_request_order_code_format_check"
    CHECK ("id" ~ '^[A-Z]{2}[0-9]-[0-9]{2}[A-Z]$');
  END IF;
END $$;
