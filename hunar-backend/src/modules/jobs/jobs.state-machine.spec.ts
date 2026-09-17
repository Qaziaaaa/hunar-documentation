import { BadRequestException } from '@nestjs/common';
import { JobStateMachine, VALID_TRANSITIONS } from './jobs.state-machine';
import { JobStatus } from '@prisma/client';

describe('JobStateMachine', () => {
  it('defines a transition for every status', () => {
    const statuses: JobStatus[] = [
      'OPEN',
      'OFFERS_RECEIVED',
      'OFFER_ACCEPTED',
      'WORKER_ASSIGNED',
      'VISIT_SCHEDULED',
      'VISIT_IN_PROGRESS',
      'VISIT_COMPLETED',
      'INSPECTION_DONE',
      'REPAIR_NEGOTIATING',
      'REPAIR_APPROVED',
      'IN_PROGRESS',
      'COMPLETED',
      'PAID',
      'REVIEWED',
      'CANCELLED',
      'DISPUTED',
    ];
    for (const s of statuses) {
      expect(VALID_TRANSITIONS[s]).toBeDefined();
    }
  });

  it('allows the happy path OPEN → … → REVIEWED', () => {
    const path: JobStatus[] = [
      'OPEN',
      'OFFERS_RECEIVED',
      'OFFER_ACCEPTED',
      'WORKER_ASSIGNED',
      'VISIT_SCHEDULED',
      'VISIT_IN_PROGRESS',
      'VISIT_COMPLETED',
      'INSPECTION_DONE',
      'REPAIR_NEGOTIATING',
      'REPAIR_APPROVED',
      'IN_PROGRESS',
      'COMPLETED',
      'PAID',
      'REVIEWED',
    ];
    for (let i = 1; i < path.length; i++) {
      expect(() => JobStateMachine.assertCanTransition(path[i - 1], path[i])).not.toThrow();
    }
  });

  it('throws on an illegal jump (OPEN → COMPLETED)', () => {
    expect(() => JobStateMachine.assertCanTransition('OPEN', 'COMPLETED')).toThrow(
      BadRequestException,
    );
  });

  it('throws when transitioning from a terminal state', () => {
    expect(() => JobStateMachine.assertCanTransition('REVIEWED', 'COMPLETED')).toThrow(
      BadRequestException,
    );
    expect(() => JobStateMachine.assertCanTransition('CANCELLED', 'OPEN')).toThrow(
      BadRequestException,
    );
  });

  it('allows worker pre-visit cancellation (VISIT_SCHEDULED → OPEN)', () => {
    expect(() => JobStateMachine.assertCanTransition('VISIT_SCHEDULED', 'OPEN')).not.toThrow();
  });
});
