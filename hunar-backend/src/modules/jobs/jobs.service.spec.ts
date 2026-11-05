import { JobsService } from './jobs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RealtimeService } from '../realtime/realtime.service';

function makeJob(id: string, status: string, workerId: string) {
  return {
    id,
    title: `Job ${id}`,
    description: null,
    status,
    urgency: 'NORMAL',
    categoryId: 'cat1',
    category: { id: 'cat1', name: 'Plumbing' },
    address: 'Hayatabad',
    city: 'Peshawar',
    area: 'Phase 4',
    suggestedVisitCharge: 1500,
    lockedVisitCharge: 1400,
    preferredVisitTime: new Date('2026-09-25T10:00:00Z'),
    images: ['https://s3/img.jpg'],
    voiceNoteUrl: null,
    customer: { id: 'c1', name: 'Customer One', phone: '+923001111111' },
    visits: [{ id: 'v1', status: 'SCHEDULED', scheduledDate: new Date('2026-09-25T10:00:00Z') }],
    _count: { offers: 3 },
    createdAt: new Date('2026-09-20T10:00:00Z'),
    selectedWorkerId: workerId,
  };
}

function makeService(mode: 'active' | 'empty') {
  const rows =
    mode === 'active'
      ? [
          makeJob('j1', 'VISIT_IN_PROGRESS', 'w1'),
          makeJob('j2', 'REPAIR_NEGOTIATING', 'w1'),
          makeJob('j3', 'COMPLETED', 'w1'),
        ]
      : [];
  const prisma = {
    serviceRequest: {
      findMany: jest.fn(async () => rows.filter((j) => j.status !== 'COMPLETED')),
      count: jest.fn(async () => rows.filter((j) => j.status !== 'COMPLETED').length),
      groupBy: jest.fn(async () => []),
    },
    serviceArea: {
      findMany: jest.fn(async () => []),
    },
    review: {
      groupBy: jest.fn(async () => []),
    },
    $transaction: jest.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
  } as unknown as PrismaService;
  const eventBus = { emit: jest.fn() } as unknown as EventBusService;
  const realtime = { emitToRoom: jest.fn() } as unknown as RealtimeService;
  return new JobsService(prisma, eventBus, realtime);
}

describe('JobsService — getActiveJobs (Task 23)', () => {
  it('returns only the assigned worker’s non-terminal jobs with the card shape', async () => {
    const service = makeService('active');
    const result = await service.getActiveJobs('w1', { page: 1, limit: 10 });

    expect(result.meta.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items.map((j: { id: string }) => j.id)).toEqual(['j1', 'j2']);
    const first = result.items[0] as unknown as Record<string, unknown>;
    expect(first.categoryName).toBe('Plumbing');
    expect(first.urgency).toBe('NORMAL');
    expect(first.lockedVisitCharge).toBe(1400);
    expect(first.offerCount).toBe(3);
    expect((first.nextVisit as { status: string }).status).toBe('SCHEDULED');
    expect((first.customer as { name: string }).name).toBe('Customer One');
  });

  it('returns an empty page for a worker with no active jobs', async () => {
    const service = makeService('empty');
    const result = await service.getActiveJobs('w9', { page: 1, limit: 10 });
    expect(result.items).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });
});

describe('JobsService — getAvailableJobs (worker relevance)', () => {
  const envSnapshot = process.env.ALLOW_WORKER_JOB_TEST_MODE;
  beforeEach(() => {
    delete process.env.ALLOW_WORKER_JOB_TEST_MODE;
  });
  afterAll(() => {
    if (envSnapshot !== undefined) {
      process.env.ALLOW_WORKER_JOB_TEST_MODE = envSnapshot;
    } else {
      delete process.env.ALLOW_WORKER_JOB_TEST_MODE;
    }
  });

  it('filters nearby jobs by the worker skill set and service-area radius', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'w1',
          name: 'Worker One',
          isVerified: true,
          avatarUrl: 'https://cdn.example.com/avatar.png',
        }),
      },
      workerProfile: {
        findUnique: jest.fn().mockResolvedValue({
          skills: ['cat-electric'],
          verificationStatus: 'APPROVED',
          serviceRadiusKm: 15,
          experienceYears: 3,
          bio: 'Keeps it neat',
        }),
      },
      serviceArea: {
        count: jest.fn().mockResolvedValue(1),
      },
      verificationDocument: {
        findMany: jest.fn().mockResolvedValue([
          { type: 'CNIC_FRONT', url: 'front.png' },
          { type: 'CNIC_BACK', url: 'back.png' },
        ]),
      },
      serviceCategory: {
        findMany: jest.fn().mockResolvedValue([{ id: 'cat-electric', name: 'Electrician' }]),
      },
      $queryRaw: jest.fn(async (sql) => {
        const rendered = Array.isArray(sql?.strings) ? sql.strings.join('') : String(sql);
        expect(rendered).toContain('sr."categoryId" = ANY');
        expect(rendered).toContain('"ServiceArea"');
        expect(rendered).toContain('sa."userId"');
        return [
          {
            id: 'job-1',
            title: 'Fan not working',
            description: 'Need a fix',
            categoryId: 'cat-electric',
            categoryName: 'Electrician',
            latitude: 33.98,
            longitude: 71.43,
            address: 'Hayatabad',
            city: 'Peshawar',
            area: 'Phase 4',
            status: 'OPEN',
            suggestedVisitCharge: 1200,
            preferredVisitTime: null,
            createdAt: new Date('2026-10-01T12:00:00Z'),
            images: [],
            voiceNoteUrl: null,
            offerCount: 0,
            distanceKm: 2.4,
          },
        ];
      }),
    } as any;

    const service = new JobsService(
      prisma,
      { emit: jest.fn() } as any,
      { emitToRoom: jest.fn() } as any,
    );

    const result = await service.getAvailableJobs({ sub: 'w1', role: 'WORKER' } as any, {
      lat: 33.98,
      lng: 71.43,
      radiusKm: 25,
      page: 1,
      limit: 10,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].categoryId).toBe('cat-electric');
    expect(result.items[0].distanceKm).toBe(2.4);
  });

  it('allows a temporary test override to bypass the worker relevance filters', async () => {
    const previous = process.env.ALLOW_WORKER_JOB_TEST_MODE;
    process.env.ALLOW_WORKER_JOB_TEST_MODE = 'true';

    try {
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'w1',
            name: 'Worker One',
            isVerified: true,
            avatarUrl: 'https://cdn.example.com/avatar.png',
          }),
        },
        workerProfile: {
          findUnique: jest.fn().mockResolvedValue({
            skills: ['cat-electric'],
            verificationStatus: 'APPROVED',
            serviceRadiusKm: 15,
            experienceYears: 3,
            bio: 'Keeps it neat',
          }),
        },
        serviceArea: {
          count: jest.fn().mockResolvedValue(1),
        },
        verificationDocument: {
          findMany: jest.fn().mockResolvedValue([
            { type: 'CNIC_FRONT', url: 'front.png' },
            { type: 'CNIC_BACK', url: 'back.png' },
          ]),
        },
        $queryRaw: jest.fn(async (sql) => {
          const rendered = Array.isArray(sql?.strings) ? sql.strings.join('') : String(sql);
          expect(rendered).not.toContain('sr."categoryId" IN (');
          expect(rendered).not.toContain('"ServiceArea"');
          return [
            {
              id: 'job-2',
              title: 'Temporary test job',
              description: 'Visible during test override',
              categoryId: 'cat-plumbing',
              categoryName: 'Plumbing',
              latitude: 33.98,
              longitude: 71.43,
              address: 'Hayatabad',
              city: 'Peshawar',
              area: 'Phase 4',
              status: 'OPEN',
              suggestedVisitCharge: 1000,
              preferredVisitTime: null,
              createdAt: new Date('2026-10-01T12:00:00Z'),
              images: [],
              voiceNoteUrl: null,
              offerCount: 0,
              distanceKm: 2.4,
            },
          ];
        }),
      } as any;

      const service = new JobsService(
        prisma,
        { emit: jest.fn() } as any,
        { emitToRoom: jest.fn() } as any,
      );
      const result = await service.getAvailableJobs({ sub: 'w1', role: 'WORKER' } as any, {
        lat: 33.98,
        lng: 71.43,
        radiusKm: 25,
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('job-2');
    } finally {
      if (previous === undefined) {
        delete process.env.ALLOW_WORKER_JOB_TEST_MODE;
      } else {
        process.env.ALLOW_WORKER_JOB_TEST_MODE = previous;
      }
    }
  });
});

describe('JobsService — getJobDetail location privacy', () => {
  const fullAddress = 'House 123, Street 5, Hayatabad Phase 3, Near XYZ Market, Peshawar';

  function makeDetailService(jobOverrides: Record<string, unknown> = {}) {
    const job = {
      id: 'job-101',
      customerId: 'c1',
      selectedWorkerId: null,
      title: 'Wiring fault',
      description: 'Living room socket issue',
      status: 'OPEN',
      categoryId: 'cat1',
      category: { id: 'cat1', name: 'Electrical' },
      address: fullAddress,
      city: 'Peshawar',
      area: 'Hayatabad Phase 3',
      latitude: 34.015,
      longitude: 71.53,
      suggestedVisitCharge: 500,
      lockedVisitCharge: null,
      preferredVisitTime: null,
      images: [],
      voiceNoteUrl: null,
      customer: { id: 'c1', name: 'Ahmad Khan', phone: '+923001234567' },
      offers: [],
      ...jobOverrides,
    };
    const prisma = {
      serviceRequest: {
        findUnique: jest.fn(async () => job),
        groupBy: jest.fn(async () => []),
      },
      // getJobDetail batches these three relation loads in one Promise.all
      // (perf sprint) instead of resolving them via include on the parent.
      serviceCategory: {
        findUnique: jest.fn(async () => job.category ?? { id: 'cat1', name: 'Electrical' }),
      },
      user: {
        findUnique: jest.fn(
          async () => job.customer ?? { id: 'c1', name: 'Ahmad Khan', phone: '+923001234567' },
        ),
      },
      jobOffer: {
        findMany: jest.fn(async () => job.offers ?? []),
      },
      serviceArea: {
        findMany: jest.fn(async () => []),
      },
      review: {
        groupBy: jest.fn(async () => []),
      },
      // Fire-and-forget VIEWING-status update in getJobDetail
      $executeRaw: jest.fn(async () => 0),
    } as unknown as PrismaService;
    const eventBus = { emit: jest.fn() } as unknown as EventBusService;
    const realtime = { emitToRoom: jest.fn() } as unknown as RealtimeService;
    return new JobsService(prisma, eventBus, realtime);
  }

  it('masks address to Area/Sector and hides phone/GPS for worker before acceptance', async () => {
    const service = makeDetailService({ selectedWorkerId: null });
    const workerUser = { sub: 'w-unassigned', phone: '+923000000001', role: 'WORKER' as any };

    const result = await service.getJobDetail('job-101', workerUser);

    expect(result.address).toBe('Hayatabad Phase 3');
    expect(result.area).toBe('Hayatabad Phase 3');
    expect(result.address).not.toContain('House');
    expect(result.address).not.toContain('Street');
    expect(result.address).not.toContain('Near XYZ');
    expect(result.customer?.phone).toBeNull();
    expect(result.latitude).toBe(0);
    expect(result.longitude).toBe(0);
  });

  it('reveals full detailed address, phone, and GPS after worker is accepted/assigned', async () => {
    const service = makeDetailService({ selectedWorkerId: 'w-assigned' });
    const assignedWorkerUser = { sub: 'w-assigned', phone: '+923000000002', role: 'WORKER' as any };

    const result = await service.getJobDetail('job-101', assignedWorkerUser);

    expect(result.address).toBe(fullAddress);
    expect(result.customer?.phone).toBe('+923001234567');
    expect(result.customer?.rating).toBe(0);
    expect(result.customer?.totalReviews).toBe(0);
    expect(result.latitude).toBe(34.015);
    expect(result.longitude).toBe(71.53);
  });

it('masks worker phone number in offers until offer acceptance (AUDIT-021)', async () => {
    const pendingOffers = [
      {
        id: 'off-1',
        jobId: 'job-101',
        workerId: 'w-1',
        visitCharge: 500,
        status: 'PENDING',
        worker: { id: 'w-1', name: 'Worker One', phone: '+923009999999', serviceAreas: [] },
      },
    ];

    // 1. Unaccepted offer viewed by customer owner -> phone masked to null
    const serviceUnaccepted = makeDetailService({ customerId: 'c1', selectedWorkerId: null, offers: pendingOffers });
    const customerUser = { sub: 'c1', phone: '+923001234567', role: 'CUSTOMER' as any };
    const resUnaccepted = await serviceUnaccepted.getJobDetail('job-101', customerUser);
    expect(resUnaccepted.offers).toHaveLength(1);
    expect(resUnaccepted.offers[0].worker.phone).toBeNull();

    // 2. Once accepted or worker assigned -> phone revealed
    const serviceAccepted = makeDetailService({
      customerId: 'c1',
      selectedWorkerId: 'w-1',
      offers: [
        {
          ...pendingOffers[0],
          status: 'ACCEPTED',
        },
      ],
    });
    const resAccepted = await serviceAccepted.getJobDetail('job-101', customerUser);
    expect(resAccepted.offers[0].worker.phone).toBe('+923009999999');
  });

    it('reveals full detailed address to customer owner', async () => {
    const service = makeDetailService({ customerId: 'c1' });
    const customerUser = { sub: 'c1', phone: '+923001234567', role: 'CUSTOMER' as any };

    const result = await service.getJobDetail('job-101', customerUser);

    expect(result.address).toBe(fullAddress);
    expect(result.customer?.phone).toBe('+923001234567');
    expect(result.customer?.rating).toBe(0);
    expect(result.customer?.totalReviews).toBe(0);
  });

  describe('IDOR Authorization Enforcement (AUDIT-018)', () => {
    it('throws ForbiddenException when a customer attempts to view another customer\'s job', async () => {
      const service = makeDetailService({ customerId: 'c-owner' });
      const attackerCustomer = { sub: 'c-attacker', phone: '+923000000003', role: 'CUSTOMER' as any };

      await expect(service.getJobDetail('job-101', attackerCustomer)).rejects.toThrow(
        'You do not have permission to view this job record',
      );
    });

    it('throws ForbiddenException when an unrelated worker views an in-progress job without an offer', async () => {
      const service = makeDetailService({
        status: 'IN_PROGRESS',
        selectedWorkerId: 'w-assigned',
        offers: [],
      });
      const outsiderWorker = { sub: 'w-outsider', phone: '+923000000004', role: 'WORKER' as any };

      await expect(service.getJobDetail('job-101', outsiderWorker)).rejects.toThrow(
        'You do not have permission to view this job record',
      );
    });

    it('allows a worker with an offer to view an in-progress job', async () => {
      const service = makeDetailService({
        status: 'IN_PROGRESS',
        selectedWorkerId: 'w-assigned',
        offers: [
          {
            id: 'off-1',
            jobId: 'job-101',
            workerId: 'w-bidder',
            visitCharge: 500,
            status: 'REJECTED',
            worker: { id: 'w-bidder', name: 'Bidder Worker' },
          },
        ],
      });
      const bidderWorker = { sub: 'w-bidder', phone: '+923000000005', role: 'WORKER' as any };

      const result = await service.getJobDetail('job-101', bidderWorker);
      expect(result).toBeDefined();
      expect(result.id).toBe('job-101');
      expect(result.visits).toEqual([]); // Stripped for non-assigned bidder
    });

    it('strips sensitive visits and diagnosis photos for an unassigned worker on OPEN jobs', async () => {
      const service = makeDetailService({
        status: 'OPEN',
        selectedWorkerId: null,
        visits: [
          {
            id: 'v-1',
            status: 'COMPLETED',
            diagnosis: 'Internal confidential diagnosis',
            inspectionPhotos: ['https://leak.example.com/p1.jpg'],
          },
        ],
      });
      const browsingWorker = { sub: 'w-browser', phone: '+923000000006', role: 'WORKER' as any };

      const result = await service.getJobDetail('job-101', browsingWorker);
      expect(result.visits).toEqual([]);
    });

    it('allows an ADMIN to view any job regardless of ownership or status', async () => {
      const service = makeDetailService({
        customerId: 'c-someone',
        status: 'IN_PROGRESS',
        selectedWorkerId: 'w-assigned',
      });
      const adminUser = { sub: 'admin-1', phone: '+923000000099', role: 'ADMIN' as any };

      const result = await service.getJobDetail('job-101', adminUser);
      expect(result.id).toBe('job-101');
      expect(result.address).toBe(fullAddress);
    });
  });
});


describe('JobsService — getCustomerJobs scheduleType filter', () => {
  it('filters out EMERGENCY jobs when scheduleType=scheduled', async () => {
    let capturedWhere: any = null;
    let capturedCountsWhere: any = null;
    const prisma = {
      serviceRequest: {
        findMany: jest.fn(async (args) => {
          capturedWhere = args?.where;
          return [
            {
              id: 'sr-1',
              title: 'Scheduled AC Service',
              description: 'Routine check',
              status: 'OPEN',
              urgency: 'NORMAL',
              categoryId: 'cat1',
              category: { name: 'AC' },
              address: 'Hayatabad',
              city: 'Peshawar',
              area: 'Phase 3',
              latitude: 34.0,
              longitude: 71.5,
              suggestedVisitCharge: 1000,
              preferredVisitTime: new Date('2026-11-01T10:00:00Z'),
              _count: { offers: 1 },
              images: [],
              voiceNoteUrl: null,
              createdAt: new Date(),
              cancelReason: null,
              cancelledAt: null,
              selectedWorkerId: null,
              lockedVisitCharge: null,
              repairs: [],
              reviews: [],
              selectedWorker: null,
              offers: [],
            },
          ];
        }),
        count: jest.fn(async () => 1),
        groupBy: jest.fn(async (args) => {
          capturedCountsWhere = args?.where;
          return [
            { status: 'OPEN', urgency: 'NORMAL', _count: { _all: 1 } },
            { status: 'WORKER_ASSIGNED', urgency: 'EMERGENCY', _count: { _all: 1 } },
          ];
        }),
      },
      review: { groupBy: jest.fn(async () => []) },
    } as unknown as PrismaService;

    const eventBus = { emit: jest.fn() } as unknown as EventBusService;
    const realtime = { emitToRoom: jest.fn() } as unknown as RealtimeService;
    const service = new JobsService(prisma, eventBus, realtime);

    const result = await service.getCustomerJobs('cust-1', {
      tab: 'offers',
      scheduleType: 'scheduled',
      page: 1,
      limit: 10,
    });

    expect(capturedWhere).toBeDefined();
    expect(capturedWhere.urgency).toEqual({ not: 'EMERGENCY' });
    expect(capturedCountsWhere).toBeDefined();
    expect(capturedCountsWhere.customerId).toBe('cust-1');
    expect(result.counts.offers).toBe(1);
    expect(result.counts.scheduled).toBe(0);
    expect(result.items[0].urgency).toBe('NORMAL');
  });
});
describe('JobsService — cancelJob (AUDIT-013)', () => {
  it('restores archived offers to pending but keeps manually rejected offers rejected upon pre-visit cancellation', async () => {
    const jobRecord: any = {
      id: 'job-cancel-test',
      status: 'WORKER_ASSIGNED',
      selectedWorkerId: 'w-assigned',
      customerId: 'cust-1',
      lockedVisitCharge: 500,
      visits: [{ id: 'v-1', status: 'SCHEDULED' }],
    };

    const offersDb = new Map<string, any>([
      ['off-assigned', { id: 'off-assigned', jobId: 'job-cancel-test', workerId: 'w-assigned', status: 'ACCEPTED' }],
      ['off-archived', { id: 'off-archived', jobId: 'job-cancel-test', workerId: 'w-archived', status: 'ARCHIVED' }],
      ['off-rejected', { id: 'off-rejected', jobId: 'job-cancel-test', workerId: 'w-rejected', status: 'REJECTED' }],
    ]);

    const prismaMock: any = {
      serviceRequest: {
        findUnique: jest.fn(async () => ({ ...jobRecord })),
        update: jest.fn(async ({ data }: any) => {
          Object.assign(jobRecord, data);
          return { ...jobRecord };
        }),
      },
      jobOffer: {
        updateMany: jest.fn(async ({ where, data }: any) => {
          let count = 0;
          for (const offer of offersDb.values()) {
            const jobMatch = offer.jobId === where.jobId;
            const workerMatch = !where.workerId || offer.workerId === where.workerId;
            const statusMatch = !where.status || offer.status === where.status;
            if (jobMatch && workerMatch && statusMatch) {
              offer.status = data.status;
              count++;
            }
          }
          return { count };
        }),
      },
      visit: {
        updateMany: jest.fn(async () => ({ count: 1 })),
      },
      $transaction: jest.fn(async (callback: any) => callback(prismaMock)),
    };

    const eventBus = { emit: jest.fn() } as unknown as EventBusService;
    const realtime = { emitToRoom: jest.fn() } as unknown as RealtimeService;
    const service = new JobsService(prismaMock, eventBus, realtime);

    const workerUser = { sub: 'w-assigned', phone: '+923000000000', role: 'WORKER' as any };
    const updated = await service.cancelJob('job-cancel-test', workerUser, {});

    // Job returns to OPEN
    expect(updated.status).toBe('OPEN');
    expect(updated.selectedWorkerId).toBeNull();

    // Assigned worker's offer is marked WITHDRAWN
    expect(offersDb.get('off-assigned')?.status).toBe('WITHDRAWN');

    // Auto-archived competitor offer is restored to PENDING
    expect(offersDb.get('off-archived')?.status).toBe('PENDING');

    // Explicitly rejected offer remains REJECTED (AUDIT-013)
    expect(offersDb.get('off-rejected')?.status).toBe('REJECTED');
  });

  describe('createJob Base64 media prevention (AUDIT-003)', () => {
    it('rejects job creation when images contain Base64 data URLs', async () => {
      const prismaMock = {
        serviceCategory: { findFirst: jest.fn() },
      } as any;
      const eventBus = { emit: jest.fn() } as any;
      const realtime = { emitToRoom: jest.fn() } as any;
      const service = new JobsService(prismaMock, eventBus, realtime);

      await expect(
        service.createJob('cust-1', {
          categoryId: 'cat-1',
          title: 'AC repair',
          latitude: 34.0,
          longitude: 71.0,
          address: 'Peshawar',
          city: 'Peshawar',
          images: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...'],
        }),
      ).rejects.toThrow(/Direct Base64 image storage is not permitted/);
    });

    it('rejects job creation when voice note contains Base64 data URL', async () => {
      const prismaMock = {
        serviceCategory: { findFirst: jest.fn() },
      } as any;
      const eventBus = { emit: jest.fn() } as any;
      const realtime = { emitToRoom: jest.fn() } as any;
      const service = new JobsService(prismaMock, eventBus, realtime);

      await expect(
        service.createJob('cust-1', {
          categoryId: 'cat-1',
          title: 'AC repair',
          latitude: 34.0,
          longitude: 71.0,
          address: 'Peshawar',
          city: 'Peshawar',
          voiceNoteUrl: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQETH4ABG...',
        }),
      ).rejects.toThrow(/Direct Base64 audio storage is not permitted/);
    });
  });

});
