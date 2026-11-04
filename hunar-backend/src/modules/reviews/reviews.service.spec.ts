import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { JobsService } from '../jobs/jobs.service';
import { RealtimeService } from '../realtime/realtime.service';

describe('ReviewsService (AUDIT-009 Mutual Reviews)', () => {
  let service: ReviewsService;
  const prismaMock = {
    serviceRequest: {
      findUnique: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(async (callback: any) => {
      if (typeof callback === 'function') return callback(prismaMock);
      return Promise.all(callback);
    }),
  };

  const eventBusMock = { emit: jest.fn() };
  const jobsServiceMock = { transitionJobState: jest.fn() };
  const realtimeMock = { emitToRoom: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EventBusService, useValue: eventBusMock },
        { provide: JobsService, useValue: jobsServiceMock },
        { provide: RealtimeService, useValue: realtimeMock },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  const completedJob = {
    id: 'job-100',
    customerId: 'cust-1',
    selectedWorkerId: 'worker-1',
    status: 'COMPLETED',
  };

  it('allows a customer to review the assigned worker on a completed job', async () => {
    prismaMock.serviceRequest.findUnique.mockResolvedValue(completedJob);
    prismaMock.review.findUnique.mockResolvedValue(null);
    prismaMock.review.create.mockImplementation(({ data }) => Promise.resolve({ id: 'rev-1', ...data }));

    const res = await service.createReview('job-100', { sub: 'cust-1', role: 'CUSTOMER' }, {
      rating: 5,
      comment: 'Excellent work!',
    });

    expect(res.reviewerId).toBe('cust-1');
    expect(res.revieweeId).toBe('worker-1');
    expect(res.rating).toBe(5);
    expect(prismaMock.review.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        jobId: 'job-100',
        reviewerId: 'cust-1',
        revieweeId: 'worker-1',
        rating: 5,
      }),
    });
  });

  it('allows an assigned worker to review the customer (AUDIT-009 bidirectional review)', async () => {
    prismaMock.serviceRequest.findUnique.mockResolvedValue(completedJob);
    prismaMock.review.findUnique.mockResolvedValue(null);
    prismaMock.review.create.mockImplementation(({ data }) => Promise.resolve({ id: 'rev-2', ...data }));

    const res = await service.createReview('job-100', { sub: 'worker-1', role: 'WORKER' }, {
      rating: 5,
      comment: 'Great customer, prompt payment and clear instructions.',
    });

    expect(res.reviewerId).toBe('worker-1');
    expect(res.revieweeId).toBe('cust-1');
    expect(res.rating).toBe(5);
    expect(prismaMock.review.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        jobId: 'job-100',
        reviewerId: 'worker-1',
        revieweeId: 'cust-1',
        rating: 5,
      }),
    });
  });

  it('rejects an unrelated third-party user from submitting a review', async () => {
    prismaMock.serviceRequest.findUnique.mockResolvedValue(completedJob);

    await expect(
      service.createReview('job-100', { sub: 'random-user', role: 'WORKER' }, {
        rating: 1,
        comment: 'Spam review',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects duplicate reviews from the same reviewer on the same job', async () => {
    prismaMock.serviceRequest.findUnique.mockResolvedValue(completedJob);
    prismaMock.review.findUnique.mockResolvedValue({ id: 'rev-existing' });

    await expect(
      service.createReview('job-100', { sub: 'cust-1', role: 'CUSTOMER' }, {
        rating: 4,
        comment: 'Second review',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects reviews on an uncompleted job', async () => {
    prismaMock.serviceRequest.findUnique.mockResolvedValue({
      ...completedJob,
      status: 'VISIT_IN_PROGRESS',
    });

    await expect(
      service.createReview('job-100', { sub: 'cust-1', role: 'CUSTOMER' }, {
        rating: 5,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

