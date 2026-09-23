-- HUNAR Customer notifications (Shafqat Ullah) — extend NotificationType with
-- customer-facing event types so the same WorkerNotification inbox (user-scoped)
-- can serve both customers and workers.

ALTER TYPE "NotificationType" ADD VALUE 'NEW_OFFER';
ALTER TYPE "NotificationType" ADD VALUE 'VISIT_SCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE 'INSPECTION_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'REPAIR_ESTIMATE_READY';
ALTER TYPE "NotificationType" ADD VALUE 'REPAIR_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'JOB_COMPLETED';