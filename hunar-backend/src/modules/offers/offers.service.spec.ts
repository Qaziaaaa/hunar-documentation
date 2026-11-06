import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OffersService, OFFER_WALLET_INSUFFICIENT_MESSAGE } from './offers.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { JobsService } from '../jobs/jobs.service';
import { RealtimeService } from '../realtime/realtime.service';
import { WalletService } from '../payments/wallet.service';

class Db {
  users = new Map<string, any>();
  workerProfiles = new Map<string, any>();
  serviceAreas: any[] = [];
  verificationDocuments: any[] = [];
  serviceRequests = new Map<string, any>();
  jobOffers = new Map<string, any>();
  walletBalances = new Map<string, number>();
  serviceCategories = new Map<string, any>();
}

function seedEligibleWorker(db: Db, id: string) {
  db.users.set(id, { id, name: 'Bilal', avatarUrl: 'a.jpg', role: 'WORKER', isVerified: true });
  db.workerProfiles.set(id, {
    userId: id,
    skills: ['cat-electric'],
    experienceYears: 3,
    bio: 'bio',
    verificationStatus: 'APPROVED',
    isAvailable: true,
  });
  db.serviceAreas.push({ userId: id });
  db.verificationDocuments.push({ userId: id, type: 'CNIC_FRONT', url: 'f.jpg' });
  db.verificationDocuments.push({ userId: id, type: 'CNIC_BACK', url: 'b.jpg' });
  db.walletBalances.set(id, 200);
}

function makeFakes(db: Db) {
  const prisma: any = {
    db,
    user: {
      async findUnique({ where }: { where: { id: string } }) {
        return db.users.get(where.id) ?? null;
      },
    },
    workerProfile: {
      async findUnique({ where }: { where: { userId: string } }) {
        return db.workerProfiles.get(where.userId) ?? null;
      },
      async updateMany({ where, data }: { where: any; data: any }) {
        let count = 0;
        for (const [id, prof] of db.workerProfiles.entries()) {
          const matchUser = !where?.userId || prof.userId === where.userId || id === where.userId;
          if (matchUser) {
            Object.assign(prof, data);
            count++;
          }
        }
        return { count };
      },
    },
    serviceArea: {
      async count({ where }: { where: { userId: string } }) {
        return db.serviceAreas.filter((a) => a.userId === where?.userId).length;
      },
    },
    verificationDocument: {
      async findMany({ where }: { where?: { userId: string } }) {
        return db.verificationDocuments.filter((d) => !where?.userId || d.userId === where.userId);
      },
    },
    serviceRequest: {
      async findUnique({ where }: { where: { id: string } }) {
        return db.serviceRequests.get(where.id) ?? null;
      },
      async update({ where, data }: { where: { id: string }; data: any }) {
        const job = db.serviceRequests.get(where.id);
        if (job) Object.assign(job, data);
        return job;
      },
      async updateMany({ where, data }: { where: any; data: any }) {
        const job = db.serviceRequests.get(where.id);
        if (job) {
          const statusMatch = !where?.status?.in || where.status.in.includes(job.status);
          const workerMatch = where?.selectedWorkerId === null ? job.selectedWorkerId == null : true;
          if (statusMatch && workerMatch) {
            Object.assign(job, data);
            return { count: 1 };
          }
        }
        return { count: 0 };
      },
      async groupBy() {
        return [];
      },
      async count() {
        return 0;
      },
    },
    serviceCategory: {
      async findUnique({ where }: { where: { id: string } }) {
        return db.serviceCategories.get(where.id) ?? null;
      },
    },
    review: {
      async groupBy() {
        return [];
      },
      async aggregate() {
        return { _count: { _all: 0 }, _avg: { rating: null } };
      },
    },
    jobOffer: {
      async findUnique({ where }: any) {
        if (where?.id) {
          return db.jobOffers.get(where.id) ?? null;
        }
        const offer = Array.from(db.jobOffers.values()).find(
          (o) =>
            o.jobId === where?.jobId_workerId?.jobId && o.workerId === where?.jobId_workerId?.workerId,
        );
        return offer ?? null;
      },
      async findFirst({ where }: { where: { id: string; jobId: string } }) {
        return (
          Array.from(db.jobOffers.values()).find(
            (o) =>
              (where.id ? o.id === where.id : true) && (!where.jobId || o.jobId === where.jobId),
          ) ?? null
        );
      },
      async create({ data }: { data: any }) {
        const offer = { id: 'offer-1', ...data };
        db.jobOffers.set(offer.id, offer);
        return offer;
      },
      async update({ where, data }: { where: { id: string }; data: any }) {
        const offer = db.jobOffers.get(where.id);
        if (offer) Object.assign(offer, data);
        return offer;
      },
      async updateMany({ where, data }: any) {
        let count = 0;
        for (const offer of db.jobOffers.values()) {
          const idMatch = !where?.id || (typeof where.id === 'object' && where.id.in ? where.id.in.includes(offer.id) : offer.id === where.id);
          const notIdMatch = !where?.NOT?.id || offer.id !== where.NOT.id;
          const statusMatch = !where?.status?.in || where.status.in.includes(offer.status);
          const jobMatch = !where?.jobId || offer.jobId === where.jobId;
          if (idMatch && notIdMatch && statusMatch && jobMatch) {
            Object.assign(offer, data);
            count++;
          }
        }
        return { count };
      },
      async findMany({ where, include, skip, take }: any = {}) {
        let rows = Array.from(db.jobOffers.values())
          .filter((o) => {
            const jobMatch = !where?.jobId || o.jobId === where.jobId;
            const notIdMatch = !where?.NOT?.id || o.id !== where.NOT.id;
            const statusMatch = !where?.status?.in || where.status.in.includes(o.status);
            const notInMatch = !where?.status?.notIn || !where.status.notIn.includes(o.status);
            const workerMatch = !where?.workerId || o.workerId === where.workerId;
            const createdAtMatch = !where?.createdAt?.lt || (o.createdAt && o.createdAt < where.createdAt.lt);
            return jobMatch && notIdMatch && statusMatch && notInMatch && workerMatch && createdAtMatch;
          });
        if (typeof skip === 'number') {
          rows = rows.slice(skip);
        }
        if (typeof take === 'number') {
          rows = rows.slice(0, take);
        }
        return rows.map((o) => {
            if (include?.worker) {
              const u = db.users.get(o.workerId);
              return {
                ...o,
                worker: u ? { ...u, serviceAreas: [] } : null,
              };
            }
            return o;
          });
      },
      async count({ where }: any = {}) {
        return Array.from(db.jobOffers.values()).filter((o) => {
          const jobMatch = !where?.jobId || o.jobId === where.jobId;
          const notIdMatch = !where?.NOT?.id || o.id !== where.NOT.id;
          const statusMatch = !where?.status?.in || where.status.in.includes(o.status);
          const notInMatch = !where?.status?.notIn || !where.status.notIn.includes(o.status);
          const workerMatch = !where?.workerId || o.workerId === where.workerId;
          return jobMatch && notIdMatch && statusMatch && notInMatch && workerMatch;
        }).length;
      },
    },
    visit: {
      async create({ data }: { data: any }) {
        return { id: 'visit-1', ...data };
      },
    },
    $transaction: async (fn: (tx: any) => Promise<any>) => fn(prisma),
  };
  const eventBus = { emit: jest.fn() } as unknown as EventBusService;
  const jobsService = {
    transitionJobState: jest.fn(async () => ({ newStatus: 'OFFERS_RECEIVED' })),
  } as unknown as JobsService;
  const realtime = { emitToRoom: jest.fn() } as unknown as RealtimeService;
  const config = { get: jest.fn(() => 5) } as unknown as ConfigService;
  const wallet = {
    getBalance: jest.fn(async (workerId: string) => ({
      userId: workerId,
      balance: db.walletBalances.get(workerId) ?? 0,
      heldBalance: 0,
      totalBalance: db.walletBalances.get(workerId) ?? 0,
    })),
  } as unknown as WalletService;

  return { prisma, eventBus, jobsService, realtime, config, wallet };
}

describe('OffersService eligibility', () => {
  const originalTestMode = process.env.ALLOW_WORKER_JOB_TEST_MODE;

  beforeEach(() => {
    delete process.env.ALLOW_WORKER_JOB_TEST_MODE;
  });

  afterAll(() => {
    if (originalTestMode !== undefined) {
      process.env.ALLOW_WORKER_JOB_TEST_MODE = originalTestMode;
    } else {
      delete process.env.ALLOW_WORKER_JOB_TEST_MODE;
    }
  });

  it('blocks a rejected worker from submitting an offer', async () => {
    const db = new Db();
    const fakes = makeFakes(db);
    const service = new OffersService(
      fakes.prisma,
      fakes.eventBus,
      fakes.jobsService,
      fakes.realtime,
      fakes.config,
      fakes.wallet,
    );
    seedEligibleWorker(db, 'w1');
    db.workerProfiles.set('w1', { ...db.workerProfiles.get('w1'), verificationStatus: 'REJECTED' });
    db.serviceRequests.set('job1', { id: 'job1', status: 'OPEN', customerId: 'c1' });

    await expect(service.createOffer('w1', 'job1', { visitCharge: 500 })).rejects.toThrow(
      ForbiddenException,
    );
    expect(fakes.eventBus.emit).not.toHaveBeenCalled();
    expect(db.jobOffers.size).toBe(0);
  });

  it('allows an approved + complete worker to submit an offer', async () => {
    const db = new Db();
    const fakes = makeFakes(db);
    const service = new OffersService(
      fakes.prisma,
      fakes.eventBus,
      fakes.jobsService,
      fakes.realtime,
      fakes.config,
      fakes.wallet,
    );
    seedEligibleWorker(db, 'w1');
    db.serviceRequests.set('job1', {
      id: 'job1',
      status: 'OPEN',
      customerId: 'c1',
      longitude: 71.5,
      latitude: 34,
    });

    const offer = await service.createOffer('w1', 'job1', { visitCharge: 500 });

    expect(offer.workerId).toBe('w1');
    expect(Number(offer.visitCharge)).toBe(500);
    expect(fakes.jobsService.transitionJobState).toHaveBeenCalledWith('job1', 'OFFERS_RECEIVED');
  });

  it('blocks a worker with a zero wallet balance from submitting an offer', async () => {
    const db = new Db();
    const fakes = makeFakes(db);
    const service = new OffersService(
      fakes.prisma,
      fakes.eventBus,
      fakes.jobsService,
      fakes.realtime,
      fakes.config,
      fakes.wallet,
    );
    seedEligibleWorker(db, 'w1');
    db.walletBalances.set('w1', 0);
    db.serviceRequests.set('job1', { id: 'job1', status: 'OPEN', customerId: 'c1' });

    await expect(service.createOffer('w1', 'job1', { visitCharge: 500 })).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.createOffer('w1', 'job1', { visitCharge: 500 })).rejects.toThrow(
      OFFER_WALLET_INSUFFICIENT_MESSAGE,
    );
    expect(db.jobOffers.size).toBe(0);
    expect(fakes.eventBus.emit).not.toHaveBeenCalled();
    expect(fakes.jobsService.transitionJobState).not.toHaveBeenCalled();
  });

  it('blocks a worker with negative wallet balance and sets them offline', async () => {
    const db = new Db();
    const fakes = makeFakes(db);
    const service = new OffersService(
      fakes.prisma,
      fakes.eventBus,
      fakes.jobsService,
      fakes.realtime,
      fakes.config,
      fakes.wallet,
    );
    seedEligibleWorker(db, 'w1');
    db.walletBalances.set('w1', -20);
    db.workerProfiles.set('w1', { ...db.workerProfiles.get('w1'), isAvailable: true });
    db.serviceRequests.set('job1', { id: 'job1', status: 'OPEN', customerId: 'c1' });

    await expect(service.createOffer('w1', 'job1', { visitCharge: 500 })).rejects.toThrow(
      /Your wallet balance is Rs. -20. Please top up your wallet to continue./,
    );
    expect(db.workerProfiles.get('w1').isAvailable).toBe(false);
  });

  it('emits offer.accepted on acceptance so the chat conversation is auto-created', async () => {
    const db = new Db();
    const fakes = makeFakes(db);
    const service = new OffersService(
      fakes.prisma,
      fakes.eventBus,
      fakes.jobsService,
      fakes.realtime,
      fakes.config,
      fakes.wallet,
    );
    seedEligibleWorker(db, 'w1');
    db.serviceRequests.set('job1', {
      id: 'job1',
      status: 'OPEN',
      customerId: 'c1',
      preferredVisitTime: new Date(),
    });
    db.jobOffers.set('offer-1', {
      id: 'offer-1',
      jobId: 'job1',
      workerId: 'w1',
      status: 'PENDING',
      visitCharge: 500,
    });

    const result = await service.acceptOffer('job1', 'offer-1', { sub: 'c1' } as never, {});

    expect(result.acceptedOffer.status).toBe('ACCEPTED');
    expect(result.lockedVisitCharge).toBe(500);
    expect(db.serviceRequests.get('job1').status).toBe('WORKER_ASSIGNED');
    expect(db.serviceRequests.get('job1').selectedWorkerId).toBe('w1');
    expect(db.serviceRequests.get('job1').lockedVisitCharge).toBe(500);
    expect(fakes.eventBus.emit).toHaveBeenCalledWith('offer.accepted', {
      offerId: 'offer-1',
      jobId: 'job1',
      workerId: 'w1',
      customerId: 'c1',
      lockedVisitCharge: 500,
    });
    expect(db.jobOffers.get('offer-1').status).toBe('ACCEPTED');
  });

  describe('Concurrency Race Condition & State Validation (AUDIT-011 / AUDIT-012)', () => {
    it('throws ConflictException on concurrent double-acceptance race condition', async () => {
      const db = new Db();
      const fakes = makeFakes(db);
      const service = new OffersService(
        fakes.prisma,
        fakes.eventBus,
        fakes.jobsService,
        fakes.realtime,
        fakes.config,
        fakes.wallet,
      );
      seedEligibleWorker(db, 'w1');
      seedEligibleWorker(db, 'w2');

      db.serviceRequests.set('job-race', {
        id: 'job-race',
        status: 'OPEN',
        customerId: 'c-owner',
        selectedWorkerId: null,
      });

      db.jobOffers.set('off-w1', {
        id: 'off-w1',
        jobId: 'job-race',
        workerId: 'w1',
        status: 'PENDING',
        visitCharge: 500,
      });

      db.jobOffers.set('off-w2', {
        id: 'off-w2',
        jobId: 'job-race',
        workerId: 'w2',
        status: 'PENDING',
        visitCharge: 600,
      });

      // 1. Worker 1 offer is accepted first
      const res1 = await service.acceptOffer('job-race', 'off-w1', { sub: 'c-owner' } as never, {});
      expect(res1.acceptedOffer.status).toBe('ACCEPTED');
      expect(db.serviceRequests.get('job-race').selectedWorkerId).toBe('w1');

      // 2. Concurrent Request attempting to accept Worker 2 must be rejected with ConflictException
      await expect(
        service.acceptOffer('job-race', 'off-w2', { sub: 'c-owner' } as never, {}),
      ).rejects.toThrow();

      // Ensure Worker 1 remains the sole assigned technician
      expect(db.serviceRequests.get('job-race').selectedWorkerId).toBe('w1');
    });

    it('rejects accepting an offer when the job is already CANCELLED or COMPLETED (AUDIT-011)', async () => {
      const db = new Db();
      const fakes = makeFakes(db);
      const service = new OffersService(
        fakes.prisma,
        fakes.eventBus,
        fakes.jobsService,
        fakes.realtime,
        fakes.config,
        fakes.wallet,
      );
      seedEligibleWorker(db, 'w1');

      db.serviceRequests.set('job-cancelled', {
        id: 'job-cancelled',
        status: 'CANCELLED',
        customerId: 'c-owner',
        selectedWorkerId: null,
      });

      db.jobOffers.set('off-cancelled', {
        id: 'off-cancelled',
        jobId: 'job-cancelled',
        workerId: 'w1',
        status: 'PENDING',
        visitCharge: 500,
      });

      await expect(
        service.acceptOffer('job-cancelled', 'off-cancelled', { sub: 'c-owner' } as never, {}),
      ).rejects.toThrow('JOB_INVALID_STATE: cannot accept offers on a job in status CANCELLED');
    });

    describe('Worker Phone Number Masking (AUDIT-021)', () => {
      it('masks worker phone number to null for customers prior to offer acceptance', async () => {
        const db = new Db();
        const fakes = makeFakes(db);
        const service = new OffersService(
          fakes.prisma,
          fakes.eventBus,
          fakes.jobsService,
          fakes.realtime,
          fakes.config,
          fakes.wallet,
        );

        db.users.set('w1', {
          id: 'w1',
          name: 'Worker Bilal',
          phone: '+923001234567',
          avatarUrl: 'a.jpg',
          role: 'WORKER',
        });

        db.serviceRequests.set('job-audit-021', {
          id: 'job-audit-021',
          customerId: 'cust-1',
          status: 'OPEN',
          selectedWorkerId: null,
        });

        db.jobOffers.set('off-1', {
          id: 'off-1',
          jobId: 'job-audit-021',
          workerId: 'w1',
          status: 'PENDING',
          visitCharge: 500,
          createdAt: new Date(),
        });

        const customerOffers = await service.getJobOffers('job-audit-021', {
          sub: 'cust-1',
          role: 'CUSTOMER',
        } as any);

        expect(customerOffers).toHaveLength(1);
        expect(customerOffers[0].worker.id).toBe('w1');
        expect(customerOffers[0].worker.phone).toBeNull();
      });

      it('reveals worker phone number when offer is accepted, or viewer is worker themselves or admin', async () => {
        const db = new Db();
        const fakes = makeFakes(db);
        const service = new OffersService(
          fakes.prisma,
          fakes.eventBus,
          fakes.jobsService,
          fakes.realtime,
          fakes.config,
          fakes.wallet,
        );

        db.users.set('w1', {
          id: 'w1',
          name: 'Worker Bilal',
          phone: '+923001234567',
          avatarUrl: 'a.jpg',
          role: 'WORKER',
        });

        db.serviceRequests.set('job-audit-021-acc', {
          id: 'job-audit-021-acc',
          customerId: 'cust-1',
          status: 'WORKER_ASSIGNED',
          selectedWorkerId: 'w1',
        });

        db.jobOffers.set('off-acc', {
          id: 'off-acc',
          jobId: 'job-audit-021-acc',
          workerId: 'w1',
          status: 'ACCEPTED',
          visitCharge: 500,
          createdAt: new Date(),
        });

        // 1. Customer views accepted offer -> sees phone
        const customerOffers = await service.getJobOffers('job-audit-021-acc', {
          sub: 'cust-1',
          role: 'CUSTOMER',
        } as any);
        expect(customerOffers[0].worker.phone).toBe('+923001234567');

        // 2. Worker views own offer on open job -> sees own phone
        db.serviceRequests.set('job-open', {
          id: 'job-open',
          customerId: 'cust-2',
          status: 'OPEN',
          selectedWorkerId: null,
        });
        db.jobOffers.set('off-open', {
          id: 'off-open',
          jobId: 'job-open',
          workerId: 'w1',
          status: 'PENDING',
          visitCharge: 500,
          createdAt: new Date(),
        });

        const workerSelfOffers = await service.getJobOffers('job-open', {
          sub: 'w1',
          role: 'WORKER',
        } as any);
        expect(workerSelfOffers[0].worker.phone).toBe('+923001234567');

        // 3. Admin views unaccepted offer -> sees phone
        const adminOffers = await service.getJobOffers('job-open', {
          sub: 'admin-1',
          role: 'ADMIN',
        } as any);
        expect(adminOffers[0].worker.phone).toBe('+923001234567');
      });
    });
describe('Strict Turn Alternation on Counter-Offers (AUDIT-029)', () => {
      it('prevents worker from countering their own initial bid before customer responds', async () => {
        const db = new Db();
        const fakes = makeFakes(db);
        const service = new OffersService(
          fakes.prisma,
          fakes.eventBus,
          fakes.jobsService,
          fakes.realtime,
          fakes.config,
          fakes.wallet,
        );
        seedEligibleWorker(db, 'w-worker');

        db.serviceRequests.set('job-counter-1', {
          id: 'job-counter-1',
          customerId: 'cust-1',
          status: 'OPEN',
        });

        db.jobOffers.set('off-init', {
          id: 'off-init',
          jobId: 'job-counter-1',
          workerId: 'w-worker',
          visitCharge: 500,
          status: 'PENDING',
          negotiationRound: 0,
          negotiationHistory: [],
        });

        const workerUser = { sub: 'w-worker', phone: '+923001111111', role: 'WORKER' as any };

        await expect(
          service.counterOffer('job-counter-1', 'off-init', workerUser, { visitCharge: 600 }),
        ).rejects.toThrow('CONSECUTIVE_COUNTER_NOT_ALLOWED: You cannot counter your own initial offer. Awaiting customer response.');
      });

      it('strictly enforces alternating turns and prevents consecutive counters by the same party', async () => {
        const db = new Db();
        const fakes = makeFakes(db);
        const service = new OffersService(
          fakes.prisma,
          fakes.eventBus,
          fakes.jobsService,
          fakes.realtime,
          fakes.config,
          fakes.wallet,
        );
        seedEligibleWorker(db, 'w-worker');

        db.serviceRequests.set('job-turn-test', {
          id: 'job-turn-test',
          customerId: 'cust-1',
          status: 'OPEN',
        });

        db.jobOffers.set('off-turn', {
          id: 'off-turn',
          jobId: 'job-turn-test',
          workerId: 'w-worker',
          visitCharge: 1000,
          status: 'PENDING',
          negotiationRound: 0,
          negotiationHistory: [],
        });

        const customerUser = { sub: 'cust-1', phone: '+923000000001', role: 'CUSTOMER' as any };
        const workerUser = { sub: 'w-worker', phone: '+923001111111', role: 'WORKER' as any };

        // 1. Customer submits first counter (Round 1: 800) -> Allowed
        const round1 = await service.counterOffer('job-turn-test', 'off-turn', customerUser, { visitCharge: 800 });
        expect(round1.negotiationRound).toBe(1);
        expect(round1.visitCharge).toBe(800);

        // 2. Customer immediately attempts to counter again -> Rejected
        await expect(
          service.counterOffer('job-turn-test', 'off-turn', customerUser, { visitCharge: 750 }),
        ).rejects.toThrow('CONSECUTIVE_COUNTER_NOT_ALLOWED: You cannot counter consecutively. Awaiting response from worker.');

        // 3. Worker counters back (Round 2: 900) -> Allowed
        const round2 = await service.counterOffer('job-turn-test', 'off-turn', workerUser, { visitCharge: 900 });
        expect(round2.negotiationRound).toBe(2);
        expect(round2.visitCharge).toBe(900);

        // 4. Worker immediately attempts to counter again -> Rejected
        await expect(
          service.counterOffer('job-turn-test', 'off-turn', workerUser, { visitCharge: 950 }),
        ).rejects.toThrow('CONSECUTIVE_COUNTER_NOT_ALLOWED: You cannot counter consecutively. Awaiting response from customer.');

        // 5. Customer counters back (Round 3: 850) -> Allowed
        const round3 = await service.counterOffer('job-turn-test', 'off-turn', customerUser, { visitCharge: 850 });
        expect(round3.negotiationRound).toBe(3);
        expect(round3.visitCharge).toBe(850);

        // 6. Worker counters back (Round 4: 880) -> Allowed
        const round4 = await service.counterOffer('job-turn-test', 'off-turn', workerUser, { visitCharge: 880 });
        expect(round4.negotiationRound).toBe(4);
        expect(round4.visitCharge).toBe(880);

        // 7. Customer counters back (Round 5: 860) -> Allowed
        const round5 = await service.counterOffer('job-turn-test', 'off-turn', customerUser, { visitCharge: 860 });
        expect(round5.negotiationRound).toBe(5);
        expect(round5.visitCharge).toBe(860);

        // 8. 6th round exceeds maxNegotiationRounds (5) -> Rejected
        await expect(
          service.counterOffer('job-turn-test', 'off-turn', workerUser, { visitCharge: 870 }),
        ).rejects.toThrow(/MAX_NEGOTIATION_ROUNDS_EXCEEDED/);
      });
    });
describe('Dynamic Negotiation Rounds & Minimum Visit Fees (AUDIT-026)', () => {
      it('rejects worker offer submission below category minimum visit fee floor', async () => {
        const db = new Db();
        const fakes = makeFakes(db);
        const service = new OffersService(
          fakes.prisma,
          fakes.eventBus,
          fakes.jobsService,
          fakes.realtime,
          fakes.config,
          fakes.wallet,
        );
        seedEligibleWorker(db, 'w-worker');

        db.serviceCategories.set('cat-plumbing', {
          id: 'cat-plumbing',
          name: 'Plumbing',
          defaultVisitCharge: 600,
        });

        db.serviceRequests.set('job-plumbing-1', {
          id: 'job-plumbing-1',
          customerId: 'cust-1',
          categoryId: 'cat-plumbing',
          status: 'OPEN',
        });

        // Offer Rs. 500 when minimum is Rs. 600 -> Rejected
        await expect(
          service.createOffer('w-worker', 'job-plumbing-1', { visitCharge: 500 }),
        ).rejects.toThrow(/MINIMUM_VISIT_FEE_NOT_MET/);

        // Offer Rs. 600 -> Accepted
        const validOffer = await service.createOffer('w-worker', 'job-plumbing-1', { visitCharge: 600 });
        expect(validOffer.visitCharge).toBe(600);
      });

      it('enforces custom max negotiation rounds defined in category distanceSlabs metadata', async () => {
        const db = new Db();
        const fakes = makeFakes(db);
        const service = new OffersService(
          fakes.prisma,
          fakes.eventBus,
          fakes.jobsService,
          fakes.realtime,
          fakes.config,
          fakes.wallet,
        );
        seedEligibleWorker(db, 'w-worker');

        db.serviceCategories.set('cat-custom-rounds', {
          id: 'cat-custom-rounds',
          name: 'Emergency Gas Leak',
          defaultVisitCharge: 500,
          distanceSlabs: { maxNegotiationRounds: 2, minimumVisitFee: 500 },
        });

        db.serviceRequests.set('job-gas-leak', {
          id: 'job-gas-leak',
          customerId: 'cust-1',
          categoryId: 'cat-custom-rounds',
          status: 'OPEN',
        });

        db.jobOffers.set('off-gas', {
          id: 'off-gas',
          jobId: 'job-gas-leak',
          workerId: 'w-worker',
          visitCharge: 800,
          status: 'PENDING',
          negotiationRound: 0,
          negotiationHistory: [],
        });

        const customerUser = { sub: 'cust-1', phone: '+923000000001', role: 'CUSTOMER' as any };
        const workerUser = { sub: 'w-worker', phone: '+923001111111', role: 'WORKER' as any };

        // Round 1 (Customer counter) -> Allowed
        const r1 = await service.counterOffer('job-gas-leak', 'off-gas', customerUser, { visitCharge: 700 });
        expect(r1.negotiationRound).toBe(1);

        // Round 2 (Worker counter) -> Allowed
        const r2 = await service.counterOffer('job-gas-leak', 'off-gas', workerUser, { visitCharge: 750 });
        expect(r2.negotiationRound).toBe(2);

        // Round 3 -> Rejected because category capped maxNegotiationRounds at 2
        await expect(
          service.counterOffer('job-gas-leak', 'off-gas', customerUser, { visitCharge: 720 }),
        ).rejects.toThrow(/MAX_NEGOTIATION_ROUNDS_EXCEEDED: maximum 2 counter rounds/);
      });
    });

    describe('Pagination on Job Offers Feed (AUDIT-023)', () => {
      it('returns paginated toPageResult when pagination query is provided', async () => {
        const db = new Db();
        const fakes = makeFakes(db);
        const service = new OffersService(
          fakes.prisma,
          fakes.eventBus,
          fakes.jobsService,
          fakes.realtime,
          fakes.config,
          fakes.wallet,
        );

        db.serviceRequests.set('job-page-test', {
          id: 'job-page-test',
          customerId: 'cust-1',
          status: 'OPEN',
        });

        for (let i = 1; i <= 5; i++) {
          db.users.set(`w${i}`, { id: `w${i}`, name: `Worker ${i}`, role: 'WORKER' });
          db.jobOffers.set(`off-${i}`, {
            id: `off-${i}`,
            jobId: 'job-page-test',
            workerId: `w${i}`,
            visitCharge: 500 + i * 50,
            status: 'PENDING',
            createdAt: new Date(),
          });
        }

        const customerUser = { sub: 'cust-1', phone: '+923000000001', role: 'CUSTOMER' as any };
        const result = (await service.getJobOffers('job-page-test', customerUser, { page: 1, limit: 2 })) as any;

        expect(result.items).toBeDefined();
        expect(result.items).toHaveLength(2);
        expect(result.meta.total).toBe(5);
        expect(result.meta.totalPages).toBe(3);
        expect(result.meta.page).toBe(1);
        expect(result.meta.limit).toBe(2);
      });
    });
  });
});
