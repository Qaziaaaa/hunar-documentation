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
      $queryRaw: jest.fn(async (sql) => {
        const rendered = Array.isArray(sql?.strings) ? sql.strings.join('') : String(sql);
        expect(rendered).toContain('"categoryId" = ANY');
        expect(rendered).toContain('"ServiceArea"');
        expect(rendered).toContain('sa."userId"');
        return [{
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
        }];
      }),
    } as any;

    const service = new JobsService(prisma, { emit: jest.fn() } as any, { emitToRoom: jest.fn() } as any);

    const result = await service.getAvailableJobs(
      { sub: 'w1', role: 'WORKER' } as any,
      { lat: 33.98, lng: 71.43, radiusKm: 25, page: 1, limit: 10 },
    );

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
          expect(rendered).not.toContain('"categoryId" = ANY');
          expect(rendered).not.toContain('"ServiceArea"');
          return [{
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
          }];
        }),
      } as any;

      const service = new JobsService(prisma, { emit: jest.fn() } as any, { emitToRoom: jest.fn() } as any);
      const result = await service.getAvailableJobs(
        { sub: 'w1', role: 'WORKER' } as any,
        { lat: 33.98, lng: 71.43, radiusKm: 25, page: 1, limit: 10 },
      );

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