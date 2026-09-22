// Typed domain events emitted by Shafqat Ullah's Module 1 modules.
// The Notifications module (Hakim Ullah) is expected to subscribe to these via the event bus.
import type { WorkerVerificationStatus } from '@prisma/client';

export type NegotiationEntry = {
  by: 'worker' | 'customer';
  amount: number;
  note?: string;
  timestamp: string;
};

export interface HunarDomainEvents {
  // Payment workflow (Module 3 Ã¯Â¿Â½?" Payments Backend, Shafqat). Emitted by
  // PaymentsService as the house screenshot-verification flow advances a row
  // INITIATED -> PROCESSING -> COMPLETED/FAILED -> REFUNDED. The worker-ledger
  // ("I have been promised X, where is the rest?") is a read-only projection
  // over the same rows Ã¯Â¿Â½?" the event bus is how the wallet/notification modules

  'job.created': {
    jobId: string;
    customerId: string;
    categoryId: string;
    latitude: number;
    longitude: number;
  };
  'job.statusChanged': { jobId: string; oldStatus: string; newStatus: string };
  'job.cancelled': { jobId: string; reason?: string };

  'offer.submitted': { offerId: string; jobId: string; workerId: string; visitCharge: number };
  'offer.countered': {
    offerId: string;
    jobId: string;
    by: 'worker' | 'customer';
    amount: number;
    round: number;
  };
  'offer.accepted': {
    offerId: string;
    jobId: string;
    workerId: string;
    customerId: string;
    lockedVisitCharge: number;
  };
  'offer.rejected': { offerId: string; jobId: string; workerId: string };

  'visit.started': { visitId: string; jobId: string; workerId: string; customerId: string };
  'visit.arrived': { visitId: string; jobId: string; workerId: string; customerId: string };
  'visit.inspectionSubmitted': { visitId: string; jobId: string; repairEstimate: number };

  'repair.proposed': { repairId: string; jobId: string; amount: number };
  'repair.counterOffered': {
    repairId: string;
    jobId: string;
    by: 'worker' | 'customer';
    amount: number;
    round: number;
  };
  'repair.approved': { repairId: string; jobId: string; lockedAmount: number };
  'repair.revisionRequested': {
    repairId: string;
    jobId: string;
    proposedAmount: number;
    reason: string;
  };
  'repair.completed': { repairId: string; jobId: string };

  'commission.recorded': { commissionId: string; jobId: string; workerId: string; amount: number };
  'commission.statusChanged': { commissionId: string; jobId: string; status: string };

  'review.submitted': { reviewId: string; jobId: string; revieweeId: string; rating: number };

  // Chat message source for the "new message" notification (worker recipient only).
  'chat.message': {
    messageId: string;
    conversationId: string;
    senderId: string;
    customerId: string;
    workerId: string;
    text?: string;
    imageUrl?: string;
  };

  // Verification decision source (admin approves/rejects/requests changes).
  'worker.verification.decided': {
    userId: string;
    verificationStatus: WorkerVerificationStatus;
    rejectionReason?: string | null;
    adminNote?: string | null;
  };

  // Wallet flows (Task 7 Ã¢â‚¬â€ wallet module emits these; Notifications subscribes).
  'commission.held': { commissionId: string; jobId: string; workerId: string; amount: number };
  // Payment workflow (Module 3 -?"? Payments Backend, Shafqat). Emitted by
  // PaymentsService as the house screenshot-verification flow advances a row
  // INITIATED -> PROCESSING -> COMPLETED/FAILED -> REFUNDED, with erifiedAt
  // set when the house verifier confirms the screenshot. Notifications and the
  // wallet projection subscribe off this bus (the ledger never re-emits these).
  'payment:initiated': {
    paymentId: string;
    jobId: string;
    customerId: string;
    workerId: string;
    amount: number;
  };
  'payment:processing': {
    paymentId: string;
    jobId: string;
    customerId: string;
    workerId: string;
    amount: number;
  };
  'payment:completed': {
    paymentId: string;
    jobId: string;
    customerId: string;
    workerId: string;
    amount: number;
  };
  'payment:failed': {
    paymentId: string;
    jobId: string;
    customerId: string;
    workerId: string;
    amount: number;
  };
  'payment:refunded': {
    paymentId: string;
    jobId: string;
    customerId: string;
    workerId: string;
    amount: number;
  };
  'commission.deducted': { commissionId: string; jobId: string; workerId: string; amount: number };
  'commission.reversed': { commissionId: string; jobId: string; workerId: string; amount: number };
  'wallet.insufficientBalance': {
    workerId: string;
    balance: number;
    required: number;
    maxNegativeBalance: number;
  };
  'topup.submitted': { topUpId: string; workerId: string; amount: number };
  'topup.approved': { topUpId: string; workerId: string; amount: number };
  'topup.rejected': { topUpId: string; workerId: string; amount: number; reason?: string };
  'earnings.recorded': { jobId: string; workerId: string; amount: number };
}

export type HunarEventName = keyof HunarDomainEvents;
