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
    expect(result.latitude).toBe(34.015);
    expect(result.longitude).toBe(71.53);
  });

  it('reveals full detailed address to customer owner', async () => {
    const service = makeDetailService({ customerId: 'c1' });
    const customerUser = { sub: 'c1', phone: '+923001234567', role: 'CUSTOMER' as any };

    const result = await service.getJobDetail('job-101', customerUser);

    expect(result.address).toBe(fullAddress);
    expect(result.customer?.phone).toBe('+923001234567');
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
