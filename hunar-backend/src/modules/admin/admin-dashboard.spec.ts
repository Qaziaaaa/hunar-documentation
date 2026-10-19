import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JobStatus, Role } from '@prisma/client';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminVerificationService } from './admin-verification.service';
import { AuditService } from './audit.service';
import { RedisService } from '../../common/redis/redis.service';
import { AppValidationPipe } from '../../common/pipes/validation.pipe';
import { toPageResult } from '../../common/helpers/pagination.util';

// HTTP-level coverage for the dashboard endpoints added for the live admin
// dashboard (overview + activity) plus the `since` delta filter on jobs.
describe('AdminController HTTP — GET /admin/dashboard/*', () => {
  let app: INestApplication;
  const getDashboardOverview = jest.fn();
  const getDashboardActivity = jest.fn();
  const listJobs = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: { getDashboardOverview, getDashboardActivity, listJobs },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new AppValidationPipe());
    // Simulate the authenticated admin (JwtAuthGuard normally sets req.user).
    app.use((req: any, _res: any, next: () => void) => {
      req.user = { sub: 'admin-1', phone: '', role: Role.ADMIN };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    getDashboardOverview.mockReset();
    getDashboardActivity.mockReset();
    listJobs.mockReset();
  });

  it('returns the overview payload (kpis + workers)', async () => {
    getDashboardOverview.mockResolvedValue({
      kpis: { totalJobs: 7, openJobs: 2 },
      workers: [{ id: 'w1', rating: 4.5 }],
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/overview')
      .expect(200);

    expect(getDashboardOverview).toHaveBeenCalledTimes(1);
    expect(res.body.kpis).toMatchObject({ totalJobs: 7, openJobs: 2 });
    expect(res.body.workers).toHaveLength(1);
    expect(res.body.workers[0]).toMatchObject({ id: 'w1', rating: 4.5 });
  });

  it('returns the activity payload (four feeds)', async () => {
    getDashboardActivity.mockResolvedValue({
      withdrawals: [{ id: 'wd1' }],
      disputes: [{ id: 'd1' }],
      auditLogs: [{ id: 'a1' }],
      verifications: [{ userId: 'u1' }],
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/activity')
      .expect(200);

    expect(getDashboardActivity).toHaveBeenCalledTimes(1);
    expect(res.body.withdrawals).toHaveLength(1);
    expect(res.body.disputes).toHaveLength(1);
    expect(res.body.auditLogs).toHaveLength(1);
    expect(res.body.verifications).toHaveLength(1);
  });

  it('rejects a malformed since on GET /admin/jobs with 400', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/jobs?since=banana').expect(400);
  });

  it('passes a valid since filter through to the service', async () => {
    listJobs.mockResolvedValue(toPageResult([], 0, 1, 20));

    await request(app.getHttpServer())
      .get('/api/v1/admin/jobs?since=2026-10-01T00:00:00.000Z')
      .expect(200);

    expect(listJobs).toHaveBeenCalledWith(
      expect.objectContaining({ since: '2026-10-01T00:00:00.000Z' }),
    );
  });

  it('omits since when not supplied (unchanged list behaviour)', async () => {
    listJobs.mockResolvedValue(toPageResult([], 0, 1, 20));

    await request(app.getHttpServer()).get('/api/v1/admin/jobs').expect(200);

    expect(listJobs).toHaveBeenCalledWith(expect.not.objectContaining({ since: expect.anything() }));
  });
});

describe('AdminService dashboard overview/activity + listJobs since', () => {
  const kpisStub = { totalJobs: 7, openJobs: 2 } as any;

  function makeService(options?: {
    cachedOverview?: unknown;
    workerRows?: any[];
    categories?: Array<{ id: string; name: string }>;
    ratingRows?: Array<{ revieweeId: string; _avg: { rating: number | null } }>;
    earningRows?: Array<{ workerId: string; _sum: { visitCharge: number | null } }>;
    pendingVerifications?: any[];
    withRedis?: boolean;
  }) {
    const redisGet = jest.fn().mockResolvedValue(
      options?.cachedOverview ? JSON.stringify(options.cachedOverview) : null,
    );
    const redisSet = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      user: { findMany: jest.fn().mockResolvedValue(options?.workerRows ?? []) },
      serviceCategory: {
        findMany: jest.fn().mockResolvedValue(options?.categories ?? []),
      },
      review: { groupBy: jest.fn().mockResolvedValue(options?.ratingRows ?? []) },
      commission: { groupBy: jest.fn().mockResolvedValue(options?.earningRows ?? []) },
      serviceRequest: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'j1',
            title: 'Fix AC',
            description: null,
            images: [],
            status: JobStatus.OPEN,
            urgency: 'HIGH',
            city: 'Lahore',
            area: 'Gulberg',
            suggestedVisitCharge: 500,
            lockedVisitCharge: null,
            cancelReason: null,
            cancelledAt: null,
            completedAt: null,
            createdAt: new Date('2026-10-01T00:00:00Z'),
            category: { id: 'cat1', name: 'AC Repair', nameUrdu: null },
            customer: { id: 'c1', name: 'Ali', phone: '0300' },
            selectedWorker: null,
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;
    const audit = { record: jest.fn() } as unknown as AuditService;
    const redis = options?.withRedis === false
      ? undefined
      : ({ get: redisGet, set: redisSet } as unknown as RedisService);
    const verifications = {
      listPending: jest.fn().mockResolvedValue(options?.pendingVerifications ?? []),
    } as unknown as AdminVerificationService;

    const service = new AdminService(prisma, audit, undefined, undefined, undefined, redis, verifications);
    jest.spyOn(service, 'getKpis').mockResolvedValue(kpisStub);
    return { service, prisma, redisGet, redisSet, verifications };
  }

  it('serves the cached overview without touching prisma when redis is warm', async () => {
    const cached = { kpis: { totalJobs: 1 }, workers: [{ id: 'w9' }] };
    const { service, prisma, redisSet } = makeService({ cachedOverview: cached });

    const result = await service.getDashboardOverview();

    expect(result).toEqual(cached);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('computes kpis + lean workers (skills resolved, rating + earnings grouped) and caches 15s', async () => {
    const workerRows = [
      {
        id: 'w1',
        phone: '0300',
        name: 'Bilal',
        email: 'b@x.pk',
        avatarUrl: null,
        isActive: true,
        isVerified: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        serviceAreas: [{ label: 'Lahore' }],
        wallet: { balance: 1200 },
        workerProfile: {
          verificationStatus: 'APPROVED',
          experienceYears: 3,
          skills: ['cat1', 'cat2'],
          isAvailable: true,
        },
      },
    ];
    const { service, redisGet, redisSet } = makeService({
      workerRows,
      categories: [
        { id: 'cat1', name: 'AC Repair' },
        { id: 'cat2', name: 'Plumbing' },
      ],
      ratingRows: [{ revieweeId: 'w1', _avg: { rating: 4.44 } }],
      earningRows: [{ workerId: 'w1', _sum: { visitCharge: 9000 } }],
    });

    const result = await service.getDashboardOverview();

    expect(redisGet).toHaveBeenCalledWith('admin:dashboard:overview:v1');
    expect(result.kpis).toEqual(kpisStub);
    expect(result.workers).toHaveLength(1);
    expect(result.workers[0]).toMatchObject({
      id: 'w1',
      name: 'Bilal',
      skills: ['AC Repair', 'Plumbing'],
      verificationStatus: 'APPROVED',
      serviceAreas: ['Lahore'],
      walletBalance: 1200,
      totalEarnings: 9000,
      rating: 4.4,
      isAvailable: true,
    });
    // Lean select: no commissions fan-out, no _count.
    expect((result.workers[0] as any).commissions).toBeUndefined();
    expect((result.workers[0] as any)._count).toBeUndefined();
    expect(redisSet).toHaveBeenCalledWith(
      'admin:dashboard:overview:v1',
      expect.any(String),
      15,
    );
  });

  it('returns an empty workforce when no workers exist', async () => {
    const { service } = makeService({ workerRows: [] });

    const result = await service.getDashboardOverview();

    expect(result.workers).toEqual([]);
  });

  it('skips the cache layer entirely when redis is unavailable', async () => {
    const { service, redisSet } = makeService({ withRedis: false, workerRows: [] });

    const result = await service.getDashboardOverview();

    expect(result.kpis).toEqual(kpisStub);
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('trims activity feeds to 10 and returns verifications newest-first', async () => {
    const withdrawals = toPageResult(
      Array.from({ length: 10 }, (_, i) => ({ id: `wd${i}` })),
      40,
      1,
      10,
    );
    const disputes = toPageResult([{ id: 'd1' }], 1, 1, 10);
    const auditLogs = toPageResult([{ id: 'a1' }], 3, 1, 10);
    const pendingVerifications = [
      { userId: 'u-old', submittedAt: new Date('2026-01-01T00:00:00Z') },
      { userId: 'u-new', submittedAt: new Date('2026-10-15T00:00:00Z') },
      { userId: 'u-mid', submittedAt: new Date('2026-06-01T00:00:00Z') },
    ];
    const { service, prisma } = makeService({ pendingVerifications });
    jest.spyOn(service, 'listWithdrawals' as any).mockResolvedValue(withdrawals);
    jest.spyOn(service, 'listDisputes' as any).mockResolvedValue(disputes);
    jest.spyOn(service, 'listAuditLogs' as any).mockResolvedValue(auditLogs);

    const result = await service.getDashboardActivity();

    expect(result.withdrawals).toHaveLength(10);
    expect(result.disputes).toHaveLength(1);
    expect(result.auditLogs).toHaveLength(1);
    expect(result.verifications.map((v: any) => v.userId)).toEqual([
      'u-new',
      'u-mid',
      'u-old',
    ]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('listJobs with since filters createdAt to strictly newer rows', async () => {
    const { service, prisma } = makeService();

    await service.listJobs({ since: '2026-10-01T00:00:00.000Z' });

    const where = prisma.serviceRequest.findMany.mock.calls[0][0].where;
    expect(where.createdAt.gt).toEqual(new Date('2026-10-01T00:00:00.000Z'));
  });

  it('listJobs without since leaves createdAt unfiltered', async () => {
    const { service, prisma } = makeService();

    await service.listJobs({ page: 1 });

    const where = prisma.serviceRequest.findMany.mock.calls[0][0].where;
    expect(where.createdAt).toBeUndefined();
  });
});
