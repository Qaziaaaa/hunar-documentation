import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';

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
