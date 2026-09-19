import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OffersService } from './offers.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { JobsService } from '../jobs/jobs.service';
import { RealtimeService } from '../realtime/realtime.service';

class Db {
  users = new Map<string, any>();
  workerProfiles = new Map<string, any>();
  serviceAreas: any[] = [];
  verificationDocuments: any[] = [];
  serviceRequests = new Map<string, any>();
  jobOffers = new Map<string, any>();
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
    },
    jobOffer: {
      async findUnique({
        where,
      }: {
        where: { jobId_workerId: { jobId: string; workerId: string } };
      }) {
        const offer = Array.from(db.jobOffers.values()).find(
          (o) =>
            o.jobId === where.jobId_workerId.jobId && o.workerId === where.jobId_workerId.workerId,
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
      async updateMany(_: any) {
        return { count: 0 };
      },
      async findMany() {
        return [];
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

  return { prisma, eventBus, jobsService, realtime, config };
}

describe('OffersService eligibility', () => {
  it('blocks a rejected worker from submitting an offer', async () => {
    const db = new Db();
    const fakes = makeFakes(db);
    const service = new OffersService(
      fakes.prisma,
      fakes.eventBus,
      fakes.jobsService,
      fakes.realtime,
      fakes.config,
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

  it('emits offer.accepted on acceptance so the chat conversation is auto-created', async () => {
    const db = new Db();
    const fakes = makeFakes(db);
    const service = new OffersService(
      fakes.prisma,
      fakes.eventBus,
      fakes.jobsService,
      fakes.realtime,
      fakes.config,
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
});
