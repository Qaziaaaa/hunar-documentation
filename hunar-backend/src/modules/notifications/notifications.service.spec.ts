import { NotificationsService } from './notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

class Db {
  notifications = new Map<string, any>();
  workerProfiles = new Map<string, any>();
  serviceAreas = new Map<string, any>();
  visits = new Map<string, any>();
  counter = 0;
}

function makeRealtime(emitted: Array<{ userIds: string[]; event: string; data: any }>) {
  return {
    emitToUsers(userIds: string[], event: string, data: any) {
      emitted.push({ userIds, event, data });
    },
    emitToRoom: jest.fn(),
  } as unknown as RealtimeService;
}

function makeFakes(db: Db, emitted: Array<{ userIds: string[]; event: string; data: any }>) {
  const notifications = db.notifications;

  const prisma: any = {
    db,
    workerNotification: {
      async create({ data }: { data: any }) {
        const row = {
          ...data,
          id: `notif-${db.counter++}`,
          isRead: false,
          readAt: null,
          createdAt: new Date(1700000000000 + db.counter),
        };
        notifications.set(row.id, row);
        return row;
      },
      async findMany({
        where,
        orderBy,
        skip,
        take,
      }: {
        where: { userId?: string };
        orderBy?: Record<string, string>;
        skip?: number;
        take?: number;
      }) {
        let rows = Array.from(notifications.values()).filter(
          (n) => !where.userId || n.userId === where.userId,
        );
        if (orderBy?.createdAt === 'desc') {
          rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return rows.slice(skip ?? 0, (skip ?? 0) + (take ?? rows.length));
      },
      async count({ where }: { where: { userId?: string; isRead?: boolean } }) {
        return Array.from(notifications.values()).filter(
          (n) =>
            (!where.userId || n.userId === where.userId) &&
            (where.isRead === undefined || n.isRead === where.isRead),
        ).length;
      },
      async findFirst({ where }: { where: any }) {
        return Array.from(notifications.values()).find(
          (n) =>
            n.userId === where.userId &&
            n.type === where.type &&
            where.data?.path?.[0] != null &&
            n.data?.[where.data.path[0]] === where.data.equals,
        );
      },
      async updateMany({ where, data }: { where: any; data: any }) {
        let count = 0;
        for (const n of notifications.values()) {
          if (
            (where.userId === undefined || n.userId === where.userId) &&
            (where.id === undefined || n.id === where.id) &&
            (where.isRead === undefined || n.isRead === where.isRead)
          ) {
            Object.assign(n, data);
            count += 1;
          }
        }
        return { count };
      },
    },
    workerProfile: {
      async findMany({ where }: { where?: any }) {
        return Array.from(db.workerProfiles.values()).filter(
          (p) =>
            (!where?.verificationStatus || p.verificationStatus === where.verificationStatus) &&
            (where?.isAvailable === undefined || p.isAvailable === where.isAvailable) &&
            (!where?.skills?.has || (p.skills ?? []).includes(where.skills.has)),
        );
      },
    },
    serviceArea: {
      async findMany({ where }: { where?: any }) {
        const rows = Array.from(db.serviceAreas.values()).filter(
          (a) => !where?.userId?.in || where.userId.in.includes(a.userId),
        );
        return rows;
      },
    },
    visit: {
      async findMany({ where }: { where?: any }) {
        return Array.from(db.visits.values()).filter(
          (v) =>
            v.status === where.status &&
            (!where.workerId || v.workerId != null) &&
            v.scheduledDate >= where.scheduledDate.gte &&
            v.scheduledDate <= where.scheduledDate.lte,
        );
      },
    },
  };
  return Object.assign(prisma, db);
}

const REALTIME_NEW = 'notification:new';
const REALTIME_READ = 'notification:read';
const REALTIME_READ_ALL = 'notification:readAll';

describe('NotificationsService', () => {
  it('persists and realtime-pushes a new notification', async () => {
    const db = new Db();
    const emitted: Array<any> = [];
    const prisma = makeFakes(db, emitted);
    const realtime = makeRealtime(emitted);
    const service = new NotificationsService(prisma, realtime);

    await service.createNotification('w1', 'JOB_MATCHED', { jobId: 'job1', jobTitle: 'Fan fix' });

    expect(db.notifications.size).toBe(1);
    const row = Array.from(db.notifications.values())[0];
    expect(row.userId).toBe('w1');
    expect(row.type).toBe('JOB_MATCHED');
    expect(row.title).toBe('New matching job');
    expect(row.isRead).toBe(false);
    expect(emitted.find((e) => e.event === REALTIME_NEW)?.userIds).toEqual(['w1']);
  });

  it('lists a worker inbox newest first with pagination, total and unread', async () => {
    const db = new Db();
    const prisma = makeFakes(db, []);
    const service = new NotificationsService(prisma, makeRealtime([]));

    await service.createNotification('w1', 'OFFER_ACCEPTED', { jobTitle: 'Job A' });
    await service.createNotification('w1', 'NEW_MESSAGE', { jobTitle: 'Job A' });
    await service.createNotification('w2', 'TOPUP_APPROVED', { amount: 500 });
    await prisma.workerNotification.create({
      data: {
        userId: 'w1',
        type: 'VISIT_WINDOW_APPROACHING',
        title: 'Visit window approaching',
        body: 'your visit',
        data: { visitId: 'v1' },
      },
    });

    const result = await service.listForWorker('w1', { page: 1, limit: 10 });

    expect(result.items).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.unread).toBe(3);
    expect(result.items[0].title).toBe('Visit window approaching');
  });

  it('unreadCount only counts unread rows of the worker', async () => {
    const db = new Db();
    const prisma = makeFakes(db, []);
    const service = new NotificationsService(prisma, makeRealtime([]));

    await service.createNotification('w1', 'EARNINGS_RECORDED', { amount: 1200 });
    await service.createNotification('w1', 'TOPUP_SUBMITTED', { amount: 300 });

    expect(await service.unreadCount('w1')).toBe(2);
  });

  it('markRead only updates the owner read and emits the read event', async () => {
    const db = new Db();
    const emitted: Array<any> = [];
    const prisma = makeFakes(db, emitted);
    const service = new NotificationsService(prisma, makeRealtime(emitted));

    await service.createNotification('w1', 'OFFER_REJECTED', { jobId: 'j' });
    const id = Array.from(db.notifications.values())[0].id;

    const ok = await service.markRead('w1', id);

    expect(ok).toBe(true);
    expect(db.notifications.get(id).isRead).toBe(true);
    expect(emitted.find((e) => e.event === REALTIME_READ)?.data.notificationId).toBe(id);
  });

  it("markRead returns false for someone else's notification", async () => {
    const db = new Db();
    const prisma = makeFakes(db, []);
    const service = new NotificationsService(prisma, makeRealtime([]));

    await service.createNotification('w1', 'OFFER_ACCEPTED', { jobId: 'j' });
    const id = Array.from(db.notifications.values())[0].id;

    expect(await service.markRead('w2', id)).toBe(false);
  });

  it('markAllRead clears every unread row and emits readAll', async () => {
    const db = new Db();
    const emitted: Array<any> = [];
    const prisma = makeFakes(db, emitted);
    const service = new NotificationsService(prisma, makeRealtime(emitted));

    await service.createNotification('w1', 'INSUFFICIENT_BALANCE', {});
    await service.createNotification('w1', 'TOPUP_REJECTED', { amount: 10 });

    const result = await service.markAllRead('w1');

    expect(result.count).toBe(2);
    expect(await service.unreadCount('w1')).toBe(0);
    expect(emitted.find((e) => e.event === REALTIME_READ_ALL)?.data.count).toBe(2);
  });

  it('findMatchingWorkerIds only matches approved, available, in-skill, in-radius workers', async () => {
    const db = new Db();
    const prisma = makeFakes(db, []);
    const service = new NotificationsService(prisma, makeRealtime([]));

    db.workerProfiles.set('w1', {
      userId: 'w1',
      skills: ['electric'],
      isAvailable: true,
      verificationStatus: 'APPROVED',
      serviceRadiusKm: 10,
    });
    db.workerProfiles.set('w2', {
      userId: 'w2',
      skills: ['plumbing'],
      isAvailable: true,
      verificationStatus: 'APPROVED',
      serviceRadiusKm: 10,
    });
    db.workerProfiles.set('w3', {
      userId: 'w3',
      skills: ['electric'],
      isAvailable: false,
      verificationStatus: 'APPROVED',
      serviceRadiusKm: 10,
    });
    db.workerProfiles.set('w4', {
      userId: 'w4',
      skills: ['electric'],
      isAvailable: true,
      verificationStatus: 'PENDING',
      serviceRadiusKm: 10,
    });
    db.workerProfiles.set('w5', {
      userId: 'w5',
      skills: ['electric'],
      isAvailable: true,
      verificationStatus: 'APPROVED',
      serviceRadiusKm: 5,
    });
    // Within ~2km of the point (31.5204, 74.3587) so inside every radius.
    db.serviceAreas.set('sa1', { userId: 'w1', latitude: 31.526, longitude: 74.365 });
    db.serviceAreas.set('sa2', { userId: 'w2', latitude: 31.52, longitude: 74.36 });
    db.serviceAreas.set('sa5', { userId: 'w5', latitude: 31.52, longitude: 74.36 });

    const ids = await service.findMatchingWorkerIds('electric', 31.5204, 74.3587);

    expect(ids).toContain('w1');
    expect(ids).not.toContain('w2');
    expect(ids).not.toContain('w3');
    expect(ids).not.toContain('w4');
    expect(ids).toContain('w5');
  });

  it('scanUpcomingVisits creates window notifications once per visit and skips outside window', async () => {
    const db = new Db();
    const prisma = makeFakes(db, []);
    const service = new NotificationsService(prisma, makeRealtime([]));

    const soon = new Date(Date.now() + 20 * 60_000);
    const later = new Date(Date.now() + 3 * 60 * 60_000);
    const done = new Date(Date.now() - 60_000);
    db.visits.set('v1', {
      id: 'v1',
      workerId: 'w1',
      status: 'SCHEDULED',
      scheduledDate: soon,
      job: { title: 'AC repair' },
    });
    db.visits.set('v2', {
      id: 'v2',
      workerId: 'w1',
      status: 'SCHEDULED',
      scheduledDate: later,
      job: { title: 'Later job' },
    });
    db.visits.set('v3', {
      id: 'v3',
      workerId: 'w1',
      status: 'SCHEDULED',
      scheduledDate: done,
      job: { title: 'Already started' },
    });

    const first = await service.scanUpcomingVisits();
    const second = await service.scanUpcomingVisits();

    expect(first.count).toBe(1);
    expect(second.count).toBe(0);
    const notifications = Array.from(db.notifications.values());
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('VISIT_WINDOW_APPROACHING');
    expect(notifications[0].data.visitId).toBe('v1');
  });
});
