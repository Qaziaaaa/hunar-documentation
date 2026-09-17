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

  async createReview(jobId: string, customerId: string, dto: CreateReviewDto) {
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
      select: { customerId: true, selectedWorkerId: true, status: true },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.customerId !== customerId) {
      throw new ForbiddenException('Only the job owner can leave a review');
    }
    if (!job.selectedWorkerId) {
      throw new BadRequestException('JOB_INVALID_STATE: no worker is assigned to this job');
    }
    if (!['COMPLETED', 'PAID', 'REVIEWED'].includes(job.status)) {
      throw new BadRequestException(
        'JOB_INVALID_STATE: reviews can only be submitted after job completion',
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: { jobId_reviewerId: { jobId, reviewerId: customerId } },
    });
    if (existing) {
      throw new ConflictException('REVIEW_DUPLICATE: you have already reviewed this job');
    }

    const review = await this.prisma.review.create({
      data: {
        jobId,
        reviewerId: customerId,
        revieweeId: job.selectedWorkerId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    if (job.status !== 'REVIEWED') {
      await this.jobsService.transitionJobState(jobId, 'REVIEWED');
    }

    this.eventBus.emit('review.submitted', {
      reviewId: review.id,
      jobId,
      revieweeId: job.selectedWorkerId,
      rating: dto.rating,
    });
    this.realtime.emitToRoom(userRoom(job.selectedWorkerId), JOB_EVENTS.jobStatusChanged, {
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
          createdAt: true,
          reviewer: { select: { name: true, avatarUrl: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return toPageResult(reviews, total, page, limit);
  }

  async getWorkerReviews(workerId: string, query: ReviewQueryDto) {
    const { page, limit, skip } = normalizePage(query);
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
