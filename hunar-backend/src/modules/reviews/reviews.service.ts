import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { JobsService } from '../jobs/jobs.service';
import { RealtimeService } from '../realtime/realtime.service';
import { JOB_EVENTS, userRoom } from '../jobs/jobs.events';
import { CreateReviewDto, ReviewQueryDto } from './reviews.validation';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly jobsService: JobsService,
    private readonly realtime: RealtimeService,
  ) {}

  async createReview(
    jobId: string,
    user: { sub: string; role?: string } | string,
    dto: CreateReviewDto,
  ) {
    const reviewerId = typeof user === 'string' ? user : user.sub;

    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
      select: { customerId: true, selectedWorkerId: true, status: true },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!job.selectedWorkerId) {
      throw new BadRequestException('JOB_INVALID_STATE: no worker is assigned to this job');
    }
    if (!['COMPLETED', 'PAID', 'REVIEWED'].includes(job.status)) {
      throw new BadRequestException(
        'JOB_INVALID_STATE: reviews can only be submitted after job completion',
      );
    }

    // Determine target reviewee based on whether the reviewer is the customer or the assigned worker (AUDIT-009)
    let revieweeId: string;
    if (reviewerId === job.customerId) {
      revieweeId = job.selectedWorkerId;
    } else if (reviewerId === job.selectedWorkerId) {
      revieweeId = job.customerId;
    } else {
      throw new ForbiddenException(
        'Only the customer or the assigned worker for this job can leave a review',
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: { jobId_reviewerId: { jobId, reviewerId } },
    });
    if (existing) {
      throw new ConflictException('REVIEW_DUPLICATE: you have already reviewed this job');
    }

    const review = await this.prisma.review.create({
      data: {
        jobId,
        reviewerId,
        revieweeId,
        rating: dto.rating,
        comment: dto.comment,
        ...(Array.isArray(dto.tags) && dto.tags.length > 0 ? { tags: dto.tags } : {}),
      },
    });

    if (job.status !== 'REVIEWED') {
      await this.jobsService.transitionJobState(jobId, 'REVIEWED');
    }

    this.eventBus.emit('review.submitted', {
      reviewId: review.id,
      jobId,
      revieweeId,
      rating: dto.rating,
    });
    this.realtime.emitToRoom(userRoom(revieweeId), JOB_EVENTS.jobStatusChanged, {
      jobId,
      oldStatus: job.status,
      newStatus: 'REVIEWED',
    });

    return review;
  }

  async getJobReviews(jobId: string, query: ReviewQueryDto) {
    const job = await this.prisma.serviceRequest.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const { page, limit, skip } = normalizePage(query);
    const where = { jobId, isVisible: true };
    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reviewerId: true,
          rating: true,
          comment: true,
          tags: true,
          createdAt: true,
          reviewer: { select: { name: true, avatarUrl: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return toPageResult(reviews, total, page, limit);
  }

  async getWorkerReviews(workerId: string, query: ReviewQueryDto) {
    // B5: frontend requests ?limit=100; default maxLimit=50 clipped the page.
    const { page, limit, skip } = normalizePage(query, 100);
    const where = { revieweeId: workerId, isVisible: true };

    const [reviews, total, agg] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          jobId: true,
          rating: true,
          comment: true,
          tags: true,
          createdAt: true,
          reviewer: { select: { name: true, avatarUrl: true } },
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);
    return {
      reviews,
      avgRating: agg._avg.rating ?? null,
      totalReviews: agg._count._all ?? 0,
      pagination: { page, limit, total },
    };
  }

  /** Task 20 — reviews the current customer submitted (my reviews). */
  async getCustomerReviews(customerId: string, query: ReviewQueryDto) {
    const { page, limit, skip } = normalizePage(query);
    const where = { reviewerId: customerId, isVisible: true };
    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          jobId: true,
          rating: true,
          comment: true,
          tags: true,
          createdAt: true,
          reviewee: {
            select: { id: true, name: true, avatarUrl: true },
          },
          job: {
            select: { id: true, title: true, status: true },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return toPageResult(reviews, total, page, limit);
  }

  async getReviewsForUser(userId: string, query: ReviewQueryDto) {
    const { page, limit, skip } = normalizePage(query, 100);
    const where = { revieweeId: userId, isVisible: true };

    const [reviews, total, agg] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          jobId: true,
          rating: true,
          comment: true,
          tags: true,
          createdAt: true,
          reviewer: { select: { name: true, avatarUrl: true } },
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);
    return {
      reviews,
      avgRating: agg._avg.rating ?? null,
      totalReviews: agg._count._all ?? 0,
      pagination: { page, limit, total },
    };
  }
}
