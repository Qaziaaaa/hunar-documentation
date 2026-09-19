-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('JOB_MATCHED', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'COUNTER_OFFER', 'COUNTER_ACCEPTED', 'VISIT_WINDOW_APPROACHING', 'NEW_MESSAGE', 'COMMISSION_HELD', 'COMMISSION_DEDUCTED', 'COMMISSION_REVERSED', 'INSUFFICIENT_BALANCE', 'TOPUP_SUBMITTED', 'TOPUP_APPROVED', 'TOPUP_REJECTED', 'EARNINGS_RECORDED', 'REVIEW_RECEIVED', 'VERIFICATION_RESULT');

-- CreateTable
CREATE TABLE "WorkerNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkerNotification_userId_isRead_createdAt_idx" ON "WorkerNotification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "WorkerNotification_userId_type_createdAt_idx" ON "WorkerNotification"("userId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkerNotification" ADD CONSTRAINT "WorkerNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;