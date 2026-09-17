// Typed domain events emitted by Shafqat Ullah's Module 1 modules.
// The Notifications module (Hakim Ullah) is expected to subscribe to these via the event bus.

export type NegotiationEntry = {
  by: 'worker' | 'customer';
  amount: number;
  note?: string;
  timestamp: string;
};

export interface HunarDomainEvents {
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
}

export type HunarEventName = keyof HunarDomainEvents;
