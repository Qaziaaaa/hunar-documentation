import { BadRequestException } from '@nestjs/common';
import { JobStatus } from '@prisma/client';

// Job state machine (design: "07-backend-architecture.md" §7 / "04-major-backend-modules.md" Module 3).
export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  OPEN: ['OFFERS_RECEIVED', 'CANCELLED'],
  OFFERS_RECEIVED: ['OFFER_ACCEPTED', 'CANCELLED'],
  OFFER_ACCEPTED: ['WORKER_ASSIGNED', 'CANCELLED'],
  WORKER_ASSIGNED: ['VISIT_SCHEDULED', 'OPEN', 'CANCELLED'],
  VISIT_SCHEDULED: ['VISIT_IN_PROGRESS', 'OPEN', 'CANCELLED'],
  VISIT_IN_PROGRESS: ['VISIT_COMPLETED', 'CANCELLED'],
  VISIT_COMPLETED: ['INSPECTION_DONE', 'CANCELLED'],
  INSPECTION_DONE: ['REPAIR_NEGOTIATING', 'CANCELLED'],
  REPAIR_NEGOTIATING: ['REPAIR_APPROVED', 'CANCELLED'],
  REPAIR_APPROVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['PAID', 'DISPUTED'],
  PAID: ['REVIEWED'],
  REVIEWED: [],
  CANCELLED: [],
  DISPUTED: [],
};

export class JobStateMachine {
  static assertCanTransition(from: JobStatus, to: JobStatus): void {
    const allowed = VALID_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `JOB_INVALID_STATE: cannot transition job from '${from}' to '${to}'`,
      );
    }
  }
}
