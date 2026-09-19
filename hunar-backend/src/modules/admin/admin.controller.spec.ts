import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        AdminService,
        { provide: PrismaService, useValue: { user: { findMany, count } } },
        { provide: AuditService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new AppValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    findMany.mockReset();
    count.mockReset();
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
});
