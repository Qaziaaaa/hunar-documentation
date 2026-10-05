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