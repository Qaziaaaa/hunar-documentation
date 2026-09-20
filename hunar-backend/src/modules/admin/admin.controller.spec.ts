import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Role } from '@prisma/client';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';
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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: {
            user: { findMany, count, findFirst, update: updateUser },
            serviceRequest: { findMany: findManyJobs },
            review: { findMany: findManyReviews },
            $transaction: jest.fn(
              async (cb: (tx: { user: { update: jest.Mock } }) => Promise<unknown>) =>
                cb({ user: { update: updateUser } }),
            ),
          },
        },
        { provide: AuditService, useValue: { record: jest.fn() } },
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
});
