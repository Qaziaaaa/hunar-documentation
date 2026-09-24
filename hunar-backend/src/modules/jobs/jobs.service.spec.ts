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