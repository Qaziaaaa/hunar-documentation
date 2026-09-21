import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Role } from '@prisma/client';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppValidationPipe } from '../../common/pipes/validation.pipe';

// HTTP-level test for M2 step 1. Uses a mocked PrismaService so no real database is required;
// it exercises the full controller -> service -> response path exactly like a live request.
describe('AdminController HTTP — GET /admin/customers', () => {
  let app: INestApplication;
  const findMany = jest.fn();
  const count = jest.fn();
  const findFirst = jest.fn();
  const findManyJobs = jest.fn();
  const findManyReviews = jest.fn();
  const updateUser = jest.fn();
  const findManyOffers = jest.fn();
  const findManyVisits = jest.fn();
  const findManyRepairs = jest.fn();
  const findCommission = jest.fn();
  const findUniqueJob = jest.fn();
  const updateJob = jest.fn();
  const emitDomainEvent = jest.fn();
  const emitToRoom = jest.fn();
  const findManyTransactions = jest.fn();
  const findManyCommissions = jest.fn();
  const aggregateCommissions = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: (fn: (tx: unknown) => Promise<unknown>) =>
              fn({ user: { update: updateUser }, serviceRequest: { update: updateJob } }),
            user: { findMany, count, findFirst, update: updateUser },
            serviceRequest: { findMany: findManyJobs, count, findFirst, findUnique: findUniqueJob },
            walletLedger: { findMany: findManyTransactions, count },
            review: { findMany: findManyReviews },
            jobOffer: { findMany: findManyOffers },
            visit: { findMany: findManyVisits },
            repair: { findMany: findManyRepairs },
            commission: { findFirst: findCommission },
          },
        },
        { provide: AuditService, useValue: { record: jest.fn() } },
        { provide: EventBusService, useValue: { emit: emitDomainEvent } },
        { provide: RealtimeService, useValue: { emitToRoom } },
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
    findMany.mockReset();
    count.mockReset();
    findFirst.mockReset();
    findManyJobs.mockReset();
    findManyReviews.mockReset();
    updateUser.mockReset();
    findManyOffers.mockReset();
    findManyVisits.mockReset();
    findManyRepairs.mockReset();
    findCommission.mockReset();
    findUniqueJob.mockReset();
    updateJob.mockReset();
    emitDomainEvent.mockReset();
    emitToRoom.mockReset();
    findManyTransactions.mockReset();
  });

  it('returns the paginated customer list', async () => {
    findMany.mockResolvedValue([
      {
        id: 'c1',
        phone: '03120000002',
        name: 'Ali',
        avatarUrl: null,
        isActive: true,
        isVerified: false,
        createdAt: new Date('2026-09-01T00:00:00Z'),
        workerProfile: null,
        _count: { customerJobs: 3, offers: 0 },
      },
    ]);
    count.mockResolvedValue(1);

    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/customers?search=ali&status=active&page=1&limit=20')
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({ id: 'c1', name: 'Ali', jobsCount: 3 });
    expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
  });

  it('rejects an invalid status filter with 400', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/customers?status=banana').expect(400);
  });

  describe('GET /admin/customers/:id (Task 11)', () => {
    const validUuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    it('rejects a non-UUID customer ID with 400', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/customers/not-a-uuid')
        .expect(400);

      expect(res.body.message).toContain('Validation failed (uuid is expected)');
    });

    it('returns 404 when customer does not exist', async () => {
      findFirst.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/customers/${validUuid}`)
        .expect(404);

      expect(res.body.message).toBe('Customer not found');
    });

    it('returns 200 with customer detail payload when customer exists', async () => {
      findFirst.mockResolvedValue({
        id: validUuid,
        phone: '03120000002',
        name: 'Ali Customer',
        avatarUrl: null,
        isActive: true,
        isVerified: true,
        createdAt: new Date('2026-09-01T00:00:00Z'),
        updatedAt: new Date('2026-09-01T00:00:00Z'),
        _count: { customerJobs: 1 },
      });
      findManyJobs.mockResolvedValue([
        {
          id: 'job-1',
          title: 'AC Fix',
          status: 'COMPLETED',
          urgency: 'HIGH',
          city: 'Lahore',
          area: 'Gulberg',
          suggestedVisitCharge: 500,
          lockedVisitCharge: 600,
          selectedWorkerId: 'worker-1',
          createdAt: new Date('2026-09-02T00:00:00Z'),
          completedAt: new Date('2026-09-02T02:00:00Z'),
          cancelledAt: null,
          category: { id: 'cat-1', name: 'AC', nameUrdu: 'اے سی' },
        },
      ]);
      findManyReviews.mockResolvedValue([
        {
          id: 'rev-1',
          jobId: 'job-1',
          rating: 5,
          comment: 'Good customer',
          createdAt: new Date('2026-09-02T03:00:00Z'),
          reviewer: { id: 'worker-1', name: 'Worker Khan' },
        },
      ]);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/customers/${validUuid}`)
        .expect(200);

      expect(res.body.profile).toMatchObject({
        id: validUuid,
        name: 'Ali Customer',
        phone: '03120000002',
        isActive: true,
      });
      expect(res.body.stats).toEqual({
        jobsCount: 1,
        reviewsCount: 1,
        ratingAverage: 5,
        totalPaid: 600,
      });
      expect(res.body.jobs).toHaveLength(1);
      expect(res.body.payments).toEqual([
        expect.objectContaining({
          jobId: 'job-1',
          amount: 600,
          status: 'COMPLETED',
        }),
      ]);
      expect(res.body.reviews).toHaveLength(1);
    });
  });

  describe('GET /admin/jobs (Task 24)', () => {
    const jobRow = {
      id: 'j1',
      title: 'Fix AC',
      description: 'Not cooling',
      images: ['img1'],
      status: 'COMPLETED',
      urgency: 'HIGH',
      city: 'Lahore',
      area: 'Gulberg',
      suggestedVisitCharge: 500,
      lockedVisitCharge: 600,
      cancelReason: null,
      cancelledAt: null,
      completedAt: new Date('2026-09-02T02:00:00Z'),
      createdAt: new Date('2026-09-02T00:00:00Z'),
      category: { id: 'cat-1', name: 'AC', nameUrdu: 'اے سی' },
      customer: { id: 'c1', name: 'Ali', phone: '03120000002' },
      selectedWorker: { id: 'w1', name: 'Worker Khan', phone: '03120000003' },
    };

    it('returns the paginated job list', async () => {
      findManyJobs.mockResolvedValue([jobRow]);
      count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/jobs?status=COMPLETED&city=Lahore&page=1&limit=20')
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toMatchObject({
        id: 'j1',
        title: 'Fix AC',
        status: 'COMPLETED',
        category: { id: 'cat-1' },
        customer: { id: 'c1' },
        worker: { id: 'w1' },
      });
      expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it('rejects an invalid status with 400', async () => {
      await request(app.getHttpServer()).get('/api/v1/admin/jobs?status=banana').expect(400);
    });

    it('rejects an invalid category id with 400', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/jobs?categoryId=not-a-uuid')
        .expect(400);
    });
  });

  describe('GET /admin/jobs/:id (Task 25)', () => {
    const validUuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const jobRow = {
      id: validUuid,
      title: 'Fix AC',
      description: 'Not cooling',
      images: ['img1'],
      voiceNoteUrl: null,
      status: 'COMPLETED',
      urgency: 'HIGH',
      city: 'Lahore',
      area: 'Gulberg',
      address: 'Gulberg 3',
      suggestedVisitCharge: 500,
      lockedVisitCharge: 600,
      preferredVisitTime: null,
      cancelReason: null,
      cancelledAt: null,
      completedAt: new Date('2026-09-02T02:00:00Z'),
      createdAt: new Date('2026-09-02T00:00:00Z'),
      updatedAt: new Date('2026-09-02T02:00:00Z'),
      category: { id: 'cat-1', name: 'AC', nameUrdu: 'اے سی' },
      customer: { id: 'c1', name: 'Ali', phone: '03120000002' },
      selectedWorker: { id: 'w1', name: 'Worker Khan', phone: '03120000003' },
    };

    it('rejects a non-UUID job ID with 400', async () => {
      await request(app.getHttpServer()).get('/api/v1/admin/jobs/not-a-uuid').expect(400);
    });

    it('returns 404 when the job does not exist', async () => {
      findFirst.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/jobs/${validUuid}`)
        .expect(404);

      expect(res.body.message).toBe('Job not found');
    });

    it('returns the full job detail with audit timeline', async () => {
      findFirst.mockResolvedValue(jobRow);
      findManyOffers.mockResolvedValue([
        {
          id: 'o1',
          workerId: 'w1',
          worker: { id: 'w1', name: 'Worker Khan', phone: '03120000003' },
          visitCharge: 600,
          message: 'Can fix',
          status: 'ACCEPTED',
          negotiationRound: 1,
          negotiationHistory: null,
          lockedAt: null,
          createdAt: new Date('2026-09-02T00:30:00Z'),
          updatedAt: new Date('2026-09-02T01:00:00Z'),
        },
      ]);
      findManyVisits.mockResolvedValue([
        {
          id: 'v1',
          workerId: 'w1',
          worker: { id: 'w1', name: 'Worker Khan', phone: '03120000003' },
          scheduledDate: new Date('2026-09-02T03:00:00Z'),
          actualDate: new Date('2026-09-02T03:30:00Z'),
          status: 'COMPLETED',
          diagnosis: 'Compressor dead',
          repairPlan: 'Replace compressor',
          repairEstimate: 600,
          estimatedRepairTimeMin: 120,
          inspectionSubmittedAt: new Date('2026-09-02T03:35:00Z'),
          createdAt: new Date('2026-09-02T01:05:00Z'),
        },
      ]);
      findManyRepairs.mockResolvedValue([
        {
          id: 'r1',
          visitId: 'v1',
          workerId: 'w1',
          worker: { id: 'w1', name: 'Worker Khan', phone: '03120000003' },
          description: 'Replace compressor',
          amount: 600,
          itemsBreakdown: null,
          status: 'ACCEPTED',
          negotiationRound: 0,
          lockedAmount: 600,
          lockedAt: new Date('2026-09-02T03:40:00Z'),
          startedAt: new Date('2026-09-02T03:45:00Z'),
          completedAt: new Date('2026-09-02T05:00:00Z'),
          createdAt: new Date('2026-09-02T03:38:00Z'),
          revisions: [
            {
              id: 'rev1',
              proposedAmount: 700,
              reason: 'Extra parts',
              status: 'APPROVED',
              requestedBy: 'w1',
              createdAt: new Date('2026-09-02T03:39:00Z'),
              decidedAt: new Date('2026-09-02T03:40:00Z'),
            },
          ],
        },
      ]);
      findCommission.mockResolvedValue({
        id: 'cm1',
        workerId: 'w1',
        visitCharge: 600,
        commissionRate: 0.1,
        amount: 60,
        status: 'VERIFIED',
        screenshotUrl: null,
        paidAt: new Date('2026-09-02T06:00:00Z'),
        verifiedAt: new Date('2026-09-02T05:30:00Z'),
        createdAt: new Date('2026-09-02T05:05:00Z'),
      });
      findManyReviews.mockResolvedValue([
        {
          id: 'rv1',
          reviewerId: 'c1',
          revieweeId: 'w1',
          reviewer: { id: 'c1', name: 'Ali' },
          reviewee: { id: 'w1', name: 'Worker Khan' },
          rating: 5,
          comment: 'Great work',
          isVisible: true,
          createdAt: new Date('2026-09-02T07:00:00Z'),
        },
      ]);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/jobs/${validUuid}`)
        .expect(200);

      expect(res.body.job).toMatchObject({
        id: validUuid,
        title: 'Fix AC',
        status: 'COMPLETED',
        category: { id: 'cat-1' },
        customer: { id: 'c1' },
        worker: { id: 'w1' },
      });
      expect(res.body.offers).toHaveLength(1);
      expect(res.body.visits).toHaveLength(1);
      expect(res.body.repairs).toHaveLength(1);
      expect(res.body.commission).toMatchObject({ id: 'cm1', amount: 60 });
      expect(res.body.reviews).toHaveLength(1);
      expect(res.body.payments).toEqual([
        {
          jobId: validUuid,
          amount: 600,
          status: 'COMPLETED',
          paidAt: jobRow.completedAt.toISOString(),
        },
      ]);
      expect(res.body.timeline[0]).toMatchObject({ type: 'JOB_CREATED' });
      expect(res.body.timeline[res.body.timeline.length - 1]).toMatchObject({ type: 'REVIEW' });
    });
  });

  describe('PUT /admin/jobs/:id/cancel (Task 26)', () => {
    const validUuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    function mockCancellableJob(status: string) {
      findUniqueJob.mockResolvedValue({
        id: validUuid,
        customerId: 'c1',
        selectedWorkerId: 'w1',
        status,
        title: 'Fix AC',
      });
      updateJob.mockResolvedValue({
        id: validUuid,
        status: 'CANCELLED',
        cancelReason: 'Admin decision',
        cancelledAt: new Date('2026-09-06T00:00:00Z'),
      });
    }

    it('rejects a non-UUID job ID with 400', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/admin/jobs/not-a-uuid/cancel')
        .send({ reason: 'Admin decision' })
        .expect(400);
    });

    it('rejects the request with 400 when the reason is missing', async () => {
      mockCancellableJob('REPAIR_APPROVED');

      await request(app.getHttpServer())
        .put(`/api/v1/admin/jobs/${validUuid}/cancel`)
        .send({})
        .expect(400);
    });

    it('returns 404 when the job does not exist', async () => {
      findUniqueJob.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .put(`/api/v1/admin/jobs/${validUuid}/cancel`)
        .send({ reason: 'Admin decision' })
        .expect(404);

      expect(res.body.message).toBe('Job not found');
    });

    it('returns 400 when the job is in a terminal state', async () => {
      mockCancellableJob('CANCELLED');

      await request(app.getHttpServer())
        .put(`/api/v1/admin/jobs/${validUuid}/cancel`)
        .send({ reason: 'Admin decision' })
        .expect(400);
    });

    it('force-cancels an active job, emits job.cancelled and notifies both parties', async () => {
      mockCancellableJob('REPAIR_APPROVED');

      const res = await request(app.getHttpServer())
        .put(`/api/v1/admin/jobs/${validUuid}/cancel`)
        .send({ reason: 'Admin decision' })
        .expect(200);

      expect(res.body).toMatchObject({
        id: validUuid,
        status: 'CANCELLED',
        cancelReason: 'Admin decision',
      });
      expect(updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: validUuid },
          data: expect.objectContaining({ status: 'CANCELLED', cancelReason: 'Admin decision' }),
        }),
      );
      expect(emitDomainEvent).toHaveBeenCalledWith('job.cancelled', {
        jobId: validUuid,
        reason: 'Admin decision',
      });
      expect(emitToRoom).toHaveBeenCalledWith('user:c1', 'job:cancelled', { jobId: validUuid });
      expect(emitToRoom).toHaveBeenCalledWith('user:w1', 'job:cancelled', { jobId: validUuid });
    });
  });

  describe('GET /admin/transactions (Task 27)', () => {
    const txRow = {
      id: 'tx1',
      type: 'TOPUP_CREDIT',
      amount: 500,
      balanceAfter: 1500,
      referenceType: 'WALLET_TOPUP',
      referenceId: 'tp1',
      note: 'Top up',
      createdAt: new Date('2026-09-07T00:00:00Z'),
      user: { id: 'w1', name: 'Worker Khan', phone: '03120000003' },
    };

    it('returns the paginated transaction feed with worker and timestamp', async () => {
      findManyTransactions.mockResolvedValue([txRow]);
      count.mockResolvedValue(1);

      const res = await request(app.getHttpServer()).get('/api/v1/admin/transactions').expect(200);

      expect(res.body.items).toEqual([
        {
          id: 'tx1',
          type: 'TOPUP_CREDIT',
          amount: 500,
          balanceAfter: 1500,
          referenceType: 'WALLET_TOPUP',
          referenceId: 'tp1',
          note: 'Top up',
          worker: { id: 'w1', name: 'Worker Khan', phone: '03120000003' },
          timestamp: txRow.createdAt.toISOString(),
        },
      ]);
      expect(res.body.meta.total).toBe(1);
    });

    it('rejects an invalid transaction type with 400', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/transactions?type=NOT_A_TYPE')
        .expect(400);
    });

    it('passes the type, search and date filters to the service', async () => {
      findManyTransactions.mockResolvedValue([]);
      count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get(
          '/api/v1/admin/transactions?type=EARNINGS_CREDIT&search=Khan&from=2026-09-01T00:00:00Z&to=2026-09-07T00:00:00Z&page=2&limit=10',
        )
        .expect(200);

      const where = (findManyTransactions.mock.calls[0][0] as { where: Record<string, unknown> })
        .where;
      expect(where.type).toBe('EARNINGS_CREDIT');
      expect((where.user as { is: { OR: unknown[] } }).is.OR).toHaveLength(2);
      expect(where.createdAt).toEqual({
        gte: new Date('2026-09-01T00:00:00Z'),
        lte: new Date('2026-09-07T00:00:00Z'),
      });
      const args = findManyTransactions.mock.calls[0][0] as { skip: number; take: number };
      expect(args.skip).toBe(10);
      expect(args.take).toBe(10);
    });
  });

  describe('GET /admin/payments (Task 28)', () => {
    const payRow = {
      id: 'j1',
      title: 'Fix AC',
      status: 'COMPLETED',
      lockedVisitCharge: 600,
      suggestedVisitCharge: 500,
      city: 'Lahore',
      area: 'Gulberg',
      completedAt: new Date('2026-09-02T02:00:00Z'),
      createdAt: new Date('2026-09-02T00:00:00Z'),
      category: { id: 'cat-1', name: 'AC', nameUrdu: 'اے سی' },
      customer: { id: 'c1', name: 'Ali', phone: '03120000002' },
      selectedWorker: { id: 'w1', name: 'Worker Khan', phone: '03120000003' },
    };

    it('returns the paginated payments feed with amount, worker and paidAt', async () => {
      findManyJobs.mockResolvedValue([payRow]);
      count.mockResolvedValue(1);

      const res = await request(app.getHttpServer()).get('/api/v1/admin/payments').expect(200);

      expect(res.body.items).toEqual([
        {
          id: 'j1',
          jobTitle: 'Fix AC',
          amount: 600,
          status: 'COMPLETED',
          paidAt: payRow.completedAt.toISOString(),
          city: 'Lahore',
          area: 'Gulberg',
          category: payRow.category,
          customer: payRow.customer,
          worker: payRow.selectedWorker,
        },
      ]);
      expect(res.body.meta.total).toBe(1);
    });

    it('rejects an invalid status filter with 400', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/payments?status=NOT_A_STATUS')
        .expect(400);
    });

    it('passes status, search and date filters to the service', async () => {
      findManyJobs.mockResolvedValue([]);
      count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get(
          '/api/v1/admin/payments?status=PAID&search=Khan&from=2026-09-01T00:00:00Z&to=2026-09-03T00:00:00Z',
        )
        .expect(200);

      const where = (findManyJobs.mock.calls[0][0] as { where: Record<string, unknown> }).where;
      expect(where.status).toBe('PAID');
      expect((where.OR as unknown[]).length).toBeGreaterThan(0);
      expect(where.completedAt).toEqual({
        gte: new Date('2026-09-01T00:00:00Z'),
        lte: new Date('2026-09-03T00:00:00Z'),
      });
    });
  });

  describe('PUT /admin/customers/:id/suspend (Task 12)', () => {
    const validUuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    it('suspends the customer with a reason', async () => {
      findFirst.mockResolvedValue({
        id: validUuid,
        phone: '03120000002',
        name: 'Ali',
        isActive: true,
      });
      updateUser.mockResolvedValue({
        id: validUuid,
        isActive: false,
        updatedAt: new Date('2026-09-05T00:00:00Z'),
      });

      const res = await request(app.getHttpServer())
        .put(`/api/v1/admin/customers/${validUuid}/suspend`)
        .send({ reason: 'Fraud report' })
        .expect(200);

      expect(res.body).toMatchObject({ id: validUuid, role: 'CUSTOMER', isActive: false });
      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: validUuid, role: Role.CUSTOMER } }),
      );
    });

    it('rejects the request with 400 when the reason is missing', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/admin/customers/${validUuid}/suspend`)
        .send({})
        .expect(400);
    });

    it('returns 404 when the customer does not exist', async () => {
      findFirst.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .put(`/api/v1/admin/customers/${validUuid}/suspend`)
        .send({ reason: 'Reason' })
        .expect(404);

      expect(res.body.message).toBe('Customer not found');
    });

    it('returns 400 when the customer is already suspended', async () => {
      findFirst.mockResolvedValue({ id: validUuid, isActive: false });

      await request(app.getHttpServer())
        .put(`/api/v1/admin/customers/${validUuid}/suspend`)
        .send({ reason: 'Reason' })
        .expect(400);
    });
  });

  describe('Tasks 13, 16, 17 — reactivate customer, worker suspend/reactivate', () => {
    const validUuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    it('reactivates a customer (Task 13)', async () => {
      findFirst.mockResolvedValue({ id: validUuid, isActive: false });
      updateUser.mockResolvedValue({
        id: validUuid,
        isActive: true,
        updatedAt: new Date('2026-09-06T00:00:00Z'),
      });

      const res = await request(app.getHttpServer())
        .put(`/api/v1/admin/customers/${validUuid}/reactivate`)
        .expect(200);

      expect(res.body).toMatchObject({ id: validUuid, role: 'CUSTOMER', isActive: true });
    });

    it('suspends a worker with a reason (Task 16)', async () => {
      findFirst.mockResolvedValue({ id: validUuid, isActive: true });
      updateUser.mockResolvedValue({
        id: validUuid,
        isActive: false,
        updatedAt: new Date('2026-09-06T00:00:00Z'),
      });

      const res = await request(app.getHttpServer())
        .put(`/api/v1/admin/workers/${validUuid}/suspend`)
        .send({ reason: 'No-show' })
        .expect(200);

      expect(res.body).toMatchObject({ id: validUuid, role: 'WORKER', isActive: false });
      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: validUuid, role: Role.WORKER } }),
      );
    });

    it('rejects a worker suspend without a reason (Task 16)', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/admin/workers/${validUuid}/suspend`)
        .send({})
        .expect(400);
    });

    it('reactivates a worker (Task 17)', async () => {
      findFirst.mockResolvedValue({ id: validUuid, isActive: false });
      updateUser.mockResolvedValue({
        id: validUuid,
        isActive: true,
        updatedAt: new Date('2026-09-06T00:00:00Z'),
      });

      const res = await request(app.getHttpServer())
        .put(`/api/v1/admin/workers/${validUuid}/reactivate`)
        .expect(200);

      expect(res.body).toMatchObject({ id: validUuid, role: 'WORKER', isActive: true });
    });
  });
});
