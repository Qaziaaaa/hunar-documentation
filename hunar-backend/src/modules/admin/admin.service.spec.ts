import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JobStatus, Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { AUDIT_ACTIONS, AuditService } from './audit.service';

type UserRow = Record<string, unknown>;

function makeService(users: UserRow[] = [], total = users.length) {
  const user = {
    findMany: jest.fn().mockResolvedValue(users),
    count: jest.fn().mockResolvedValue(total),
  };
  const prisma = { user } as unknown as ConstructorParameters<typeof AdminService>[0];
  const audit = { record: jest.fn() } as unknown as AuditService;
  return { service: new AdminService(prisma, audit), user };
}

describe('AdminService.listCustomers (M2 step 1)', () => {
  it('queries only CUSTOMER accounts, applies pagination and maps job counts', async () => {
    const users: UserRow[] = [
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
    ];
    const { service, user } = makeService(users, 1);

    const result = await service.listCustomers({ page: 2, limit: 10 });

    expect(user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: Role.CUSTOMER },
        skip: 10,
        take: 10,
      }),
    );
    expect(result.meta).toEqual({ page: 2, limit: 10, total: 1, totalPages: 1 });
    expect(result.items[0]).toMatchObject({ id: 'c1', jobsCount: 3, isActive: true });
  });

  it('builds the search + suspended filters', async () => {
    const { service, user } = makeService();

    await service.listCustomers({ search: 'ali', status: 'suspended' });

    const where = user.findMany.mock.calls[0][0].where;
    expect(where.role).toBe(Role.CUSTOMER);
    expect(where.isActive).toBe(false);
    expect(where.OR).toEqual([
      { name: { contains: 'ali', mode: 'insensitive' } },
      { phone: { contains: 'ali' } },
    ]);
  });

  it('caps the page size at 50', async () => {
    const { service, user } = makeService();

    await service.listCustomers({ limit: 500 });

    expect(user.findMany.mock.calls[0][0].take).toBe(50);
  });
});

describe('AdminService.getCustomerDetail (Task 11)', () => {
  it('returns customer profile, jobs, payments and review stats', async () => {
    const userRow = {
      id: 'c1',
      phone: '03120000002',
      name: 'Ali',
      avatarUrl: null,
      isActive: true,
      isVerified: false,
      createdAt: new Date('2026-09-01T00:00:00Z'),
      updatedAt: new Date('2026-09-01T00:00:00Z'),
      _count: { customerJobs: 2 },
    };

    const jobs = [
      {
        id: 'j1',
        title: 'Fix AC',
        status: JobStatus.COMPLETED,
        urgency: 'HIGH',
        city: 'Lahore',
        area: 'Gulberg',
        suggestedVisitCharge: 500,
        lockedVisitCharge: 600,
        selectedWorkerId: 'w1',
        createdAt: new Date('2026-09-02T00:00:00Z'),
        completedAt: new Date('2026-09-02T02:00:00Z'),
        cancelledAt: null,
        category: { id: 'cat1', name: 'AC Repair', nameUrdu: 'اے سی مرمت' },
      },
      {
        id: 'j2',
        title: 'Fix Pipe',
        status: JobStatus.OPEN,
        urgency: 'NORMAL',
        city: 'Lahore',
        area: 'Model Town',
        suggestedVisitCharge: 300,
        lockedVisitCharge: null,
        selectedWorkerId: null,
        createdAt: new Date('2026-09-03T00:00:00Z'),
        completedAt: null,
        cancelledAt: null,
        category: { id: 'cat2', name: 'Plumbing', nameUrdu: 'پلمبنگ' },
      },
    ];

    const reviews = [
      {
        id: 'r1',
        jobId: 'j1',
        rating: 5,
        comment: 'Great customer, clear communication',
        createdAt: new Date('2026-09-02T03:00:00Z'),
        reviewer: { id: 'w1', name: 'Worker Khan' },
      },
      {
        id: 'r2',
        jobId: 'j1',
        rating: 4,
        comment: 'Nice experience',
        createdAt: new Date('2026-09-02T04:00:00Z'),
        reviewer: { id: 'w1', name: 'Worker Khan' },
      },
    ];

    const user = {
      findFirst: jest.fn().mockResolvedValue(userRow),
    };
    const serviceRequest = {
      findMany: jest.fn().mockResolvedValue(jobs),
    };
    const review = {
      findMany: jest.fn().mockResolvedValue(reviews),
    };
    const prisma = { user, serviceRequest, review } as unknown as ConstructorParameters<
      typeof AdminService
    >[0];
    const audit = { record: jest.fn() } as unknown as AuditService;
    const service = new AdminService(prisma, audit);

    const result = await service.getCustomerDetail('c1');

    expect(user.findFirst).toHaveBeenCalledWith({
      where: { id: 'c1', role: Role.CUSTOMER },
      select: expect.any(Object),
    });
    expect(result.profile).toEqual({
      id: 'c1',
      phone: '03120000002',
      name: 'Ali',
      avatarUrl: null,
      isActive: true,
      isVerified: false,
      createdAt: userRow.createdAt,
    });
    expect(result.stats).toEqual({
      jobsCount: 2,
      reviewsCount: 2,
      ratingAverage: 4.5,
      totalPaid: 600,
    });
    expect(result.jobs).toHaveLength(2);
    expect(result.payments).toHaveLength(1);
    expect(result.payments[0]).toEqual({
      jobId: 'j1',
      title: 'Fix AC',
      amount: 600,
      status: JobStatus.COMPLETED,
      paidAt: jobs[0].completedAt,
    });
    expect(result.reviews).toHaveLength(2);
  });

  it('handles customer with 0 jobs and 0 reviews gracefully', async () => {
    const userRow = {
      id: 'c2',
      phone: '03120000003',
      name: 'Usman',
      avatarUrl: null,
      isActive: true,
      isVerified: false,
      createdAt: new Date('2026-09-01T00:00:00Z'),
      updatedAt: new Date('2026-09-01T00:00:00Z'),
      _count: { customerJobs: 0 },
    };
    const user = { findFirst: jest.fn().mockResolvedValue(userRow) };
    const serviceRequest = { findMany: jest.fn().mockResolvedValue([]) };
    const review = { findMany: jest.fn().mockResolvedValue([]) };
    const prisma = { user, serviceRequest, review } as unknown as ConstructorParameters<
      typeof AdminService
    >[0];
    const service = new AdminService(prisma, { record: jest.fn() } as unknown as AuditService);

    const result = await service.getCustomerDetail('c2');

    expect(result.stats).toEqual({
      jobsCount: 0,
      reviewsCount: 0,
      ratingAverage: null,
      totalPaid: 0,
    });
    expect(result.jobs).toEqual([]);
    expect(result.payments).toEqual([]);
    expect(result.reviews).toEqual([]);
  });

  it('throws NotFoundException when customer is not found or not a CUSTOMER', async () => {
    const user = { findFirst: jest.fn().mockResolvedValue(null) };
    const prisma = { user } as unknown as ConstructorParameters<typeof AdminService>[0];
    const service = new AdminService(prisma, { record: jest.fn() } as unknown as AuditService);

    await expect(service.getCustomerDetail('unknown-id')).rejects.toThrow(NotFoundException);
  });
});

describe('AdminService.listJobs (Task 24)', () => {
  const jobRow = {
    id: 'j1',
    title: 'Fix AC',
    description: 'Not cooling',
    images: ['img1'],
    status: JobStatus.OPEN,
    urgency: 'HIGH',
    city: 'Lahore',
    area: 'Gulberg',
    suggestedVisitCharge: 500,
    lockedVisitCharge: null,
    cancelReason: null,
    cancelledAt: null,
    completedAt: null,
    createdAt: new Date('2026-09-02T00:00:00Z'),
    category: { id: 'cat1', name: 'AC Repair', nameUrdu: 'اے سی مرمت' },
    customer: { id: 'c1', name: 'Ali', phone: '03120000002' },
    selectedWorker: null,
  };

  function makeService() {
    const findMany = jest.fn().mockResolvedValue([jobRow]);
    const count = jest.fn().mockResolvedValue(1);
    const prisma = {
      serviceRequest: { findMany, count },
    } as unknown as ConstructorParameters<typeof AdminService>[0];
    const audit = { record: jest.fn() } as unknown as AuditService;
    return { service: new AdminService(prisma, audit), findMany, count };
  }

  it('queries jobs with pagination and maps category, customer and worker', async () => {
    const { service, findMany, count } = makeService();

    const result = await service.listJobs({ page: 1, limit: 20 });

    expect(count).toHaveBeenCalledWith({ where: {} });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, skip: 0, take: 20, orderBy: { createdAt: 'desc' } }),
    );
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    expect(result.items[0]).toMatchObject({
      id: 'j1',
      title: 'Fix AC',
      status: JobStatus.OPEN,
      category: { id: 'cat1' },
      customer: { id: 'c1' },
      worker: null,
    });
  });

  it('builds search + status + city/area + date-range filters', async () => {
    const { service, findMany } = makeService();

    await service.listJobs({
      search: 'ali',
      status: JobStatus.COMPLETED,
      categoryId: 'cat1',
      city: 'Lahore',
      area: 'Gulberg',
      from: '2026-09-01',
      to: '2026-09-30',
    });

    const where = findMany.mock.calls[0][0].where;
    expect(where.status).toBe(JobStatus.COMPLETED);
    expect(where.categoryId).toBe('cat1');
    expect(where.city).toBe('Lahore');
    expect(where.area).toBe('Gulberg');
    expect(where.createdAt.gte).toEqual(new Date('2026-09-01'));
    expect(where.createdAt.lte).toEqual(new Date('2026-09-30'));
    expect(where.OR).toEqual([
      { title: { contains: 'ali', mode: 'insensitive' } },
      { customer: { is: { name: { contains: 'ali', mode: 'insensitive' } } } },
      { customer: { is: { phone: { contains: 'ali' } } } },
    ]);
  });

  it('caps the page size at 50', async () => {
    const { service, findMany } = makeService();

    await service.listJobs({ limit: 500 });

    expect(findMany.mock.calls[0][0].take).toBe(50);
  });
});

describe('AdminService.suspendCustomer (Task 12)', () => {
  const actor = { sub: 'admin-1', phone: '', role: Role.ADMIN };
  const customerRow = {
    id: 'c1',
    phone: '03120000002',
    name: 'Ali',
    isActive: true,
  };

  function buildFixture(
    overrides: {
      findFirst?: jest.Mock | null;
      update?: jest.Mock;
      record?: jest.Mock;
    } = {},
  ) {
    const findFirst = overrides.findFirst ?? jest.fn().mockResolvedValue(customerRow);
    const update =
      overrides.update ??
      jest.fn().mockResolvedValue({
        id: customerRow.id,
        isActive: false,
        updatedAt: new Date('2026-09-05T00:00:00Z'),
      });
    const record = overrides.record ?? jest.fn();
    const $transaction = jest.fn(
      async (cb: (tx: { user: { update: jest.Mock } }) => Promise<unknown>) =>
        cb({ user: { update } }),
    );
    const prisma = {
      user: { findFirst, update },
      $transaction,
    } as unknown as ConstructorParameters<typeof AdminService>[0];
    const audit = { record } as unknown as AuditService;
    const service = new AdminService(prisma, audit);
    return { service, findFirst, update, record };
  }

  it('sets the customer inactive and records the suspend with the mandatory reason', async () => {
    const { service, findFirst, update, record } = buildFixture();

    const result = await service.suspendCustomer('c1', actor, 'Fraud report');

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'c1', role: Role.CUSTOMER },
      select: expect.any(Object),
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { isActive: false },
      select: expect.any(Object),
    });
    expect(record).toHaveBeenCalledWith(
      {
        actorId: actor.sub,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.USER_SUSPENDED,
        targetType: Role.CUSTOMER,
        targetId: 'c1',
        reason: 'Fraud report',
        metadata: { phone: customerRow.phone, name: customerRow.name },
      },
      expect.anything(),
    );
    expect(result).toMatchObject({
      id: 'c1',
      role: Role.CUSTOMER,
      isActive: false,
    });
  });

  it('throws NotFoundException when the customer does not exist', async () => {
    const { service, record } = buildFixture({ findFirst: jest.fn().mockResolvedValue(null) });

    await expect(service.suspendCustomer('missing', actor, 'Reason')).rejects.toThrow(
      NotFoundException,
    );
    expect(record).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when the customer is already suspended', async () => {
    const { service, record } = buildFixture({
      findFirst: jest.fn().mockResolvedValue({ ...customerRow, isActive: false }),
    });

    await expect(service.suspendCustomer('c1', actor, 'Reason')).rejects.toThrow(
      BadRequestException,
    );
    expect(record).not.toHaveBeenCalled();
  });
});

describe('AdminService reactivate customer (Task 13) + worker suspend/reactivate (Tasks 16, 17)', () => {
  const actor = { sub: 'admin-1', phone: '', role: Role.ADMIN };

  function makeFixture(role: Role, existing: Record<string, unknown> | null) {
    const findFirst = jest.fn().mockResolvedValue(existing);
    const update = jest.fn().mockResolvedValue({
      id: 'u1',
      isActive: existing ? !existing.isActive : false,
      updatedAt: new Date('2026-09-06T00:00:00Z'),
    });
    const record = jest.fn();
    const $transaction = jest.fn(
      async (cb: (tx: { user: { update: jest.Mock } }) => Promise<unknown>) =>
        cb({ user: { update } }),
    );
    const prisma = {
      user: { findFirst, update },
      $transaction,
    } as unknown as ConstructorParameters<typeof AdminService>[0];
    const audit = { record } as unknown as AuditService;
    const service = new AdminService(prisma, audit);
    return { service, findFirst, update, record };
  }

  it('Task 13: reactivates a suspended customer (no reason)', async () => {
    const { service, findFirst, update, record } = makeFixture(Role.CUSTOMER, {
      id: 'u1',
      phone: '03120000002',
      name: 'Ali',
      isActive: false,
    });

    const result = await service.reactivateCustomer('u1', actor);

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'u1', role: Role.CUSTOMER },
      select: expect.any(Object),
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { isActive: true },
      select: expect.any(Object),
    });
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: actor.sub,
        action: AUDIT_ACTIONS.USER_REACTIVATED,
        targetId: 'u1',
        reason: null,
      }),
      expect.anything(),
    );
    expect(result).toMatchObject({ role: Role.CUSTOMER, isActive: true });
  });

  it('Task 13: throws 400 when the customer is already active', async () => {
    const { service, record } = makeFixture(Role.CUSTOMER, {
      id: 'u1',
      isActive: true,
    });

    await expect(service.reactivateCustomer('u1', actor)).rejects.toThrow(BadRequestException);
    expect(record).not.toHaveBeenCalled();
  });

  it('Task 16: suspends a worker with a mandatory reason', async () => {
    const { service, findFirst, record } = makeFixture(Role.WORKER, {
      id: 'u1',
      phone: '03120000001',
      name: 'Bilal',
      isActive: true,
    });

    const result = await service.suspendWorker('u1', actor, 'No-show three times');

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'u1', role: Role.WORKER },
      select: expect.any(Object),
    });
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.USER_SUSPENDED,
        targetType: Role.WORKER,
        targetId: 'u1',
        reason: 'No-show three times',
      }),
      expect.anything(),
    );
    expect(result).toMatchObject({ role: Role.WORKER, isActive: false });
  });

  it('Task 16: throws 404 when the worker does not exist', async () => {
    const { service, record } = makeFixture(Role.WORKER, null);

    await expect(service.suspendWorker('missing', actor, 'Reason')).rejects.toThrow(
      NotFoundException,
    );
    expect(record).not.toHaveBeenCalled();
  });

  it('Task 16: throws 400 when the worker is already suspended', async () => {
    const { service, record } = makeFixture(Role.WORKER, {
      id: 'u1',
      isActive: false,
    });

    await expect(service.suspendWorker('u1', actor, 'Reason')).rejects.toThrow(BadRequestException);
    expect(record).not.toHaveBeenCalled();
  });

  it('Task 17: reactivates a suspended worker', async () => {
    const { service, findFirst, record } = makeFixture(Role.WORKER, {
      id: 'u1',
      phone: '03120000001',
      name: 'Bilal',
      isActive: false,
    });

    const result = await service.reactivateWorker('u1', actor);

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'u1', role: Role.WORKER },
      select: expect.any(Object),
    });
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.USER_REACTIVATED,
        targetType: Role.WORKER,
      }),
      expect.anything(),
    );
    expect(result).toMatchObject({ role: Role.WORKER, isActive: true });
  });
});
