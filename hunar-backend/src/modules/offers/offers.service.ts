import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OfferStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { assertWorkerEligible } from '../../common/helpers/worker-eligibility.util';
import { JobsService } from '../jobs/jobs.service';
import { WalletService } from '../payments/wallet.service';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { RealtimeService } from '../realtime/realtime.service';
import { JOB_EVENTS, userRoom, WORKERS_ROOM } from '../jobs/jobs.events';
import {
  CounterOfferDto,
  CreateOfferDto,
  OfferListQueryDto,
  RespondOfferDto,
} from './offers.validation';
import { NegotiationEntry } from '../../common/event-bus/events';
import { RedisService } from '../../common/redis/redis.service';
import { haversineKm } from '../../common/helpers/geo.util';
import {
  SETTINGS_DEFAULTS,
  SettingsService,
} from '../../common/settings/settings.service';

/** No offer-submission fee exists today; workers only need a positive balance. */
export const OFFER_SUBMISSION_FEE = 0;
export const OFFER_WALLET_INSUFFICIENT_MESSAGE =
  'Your wallet balance is insufficient to submit an offer. Please top up your wallet to continue.';

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly jobsService: JobsService,
    private readonly realtime: RealtimeService,
    private readonly config: ConfigService,
    private readonly wallet: WalletService,
    private readonly redis?: RedisService,
    @Optional() private readonly settings?: SettingsService,
  ) {}

  private get maxRounds(): number {
    return this.config.get<number>('app.maxNegotiationRounds', 5);
  }

  /** Admin-configured cap on simultaneously active (unanswered) offers. */
  private async maxActiveOffersPerWorker(): Promise<number> {
    return (
      (await this.settings?.getMaxActiveOffersPerWorker()) ??
      SETTINGS_DEFAULTS.maxActiveOffersPerWorker
    );
  }

  async createOffer(workerId: string, jobId: string, dto: CreateOfferDto) {
    // Concurrently verify worker eligibility, fetch job, and check for existing offer
    const [, job, existing] = await Promise.all([
      assertWorkerEligible(this.prisma, workerId, this.redis),
      this.prisma.serviceRequest.findUnique({ where: { id: jobId } }),
      this.prisma.jobOffer.findUnique({
        where: { jobId_workerId: { jobId, workerId } },
      }),
    ]);

    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (!['OPEN', 'OFFERS_RECEIVED'].includes(job.status)) {
      throw new BadRequestException(
        'JOB_INVALID_STATE: offers are no longer accepted for this job',
      );
    }
    if (existing) {
      throw new ConflictException('OFFER_DUPLICATE: you already submitted an offer for this job');
    }

    // Wallet guard: the authenticated worker's live balance is read from the
    // database (never from the client). A zero balance - or one that cannot
    // cover an existing offer-submission fee - blocks the offer before it is
    // persisted. No amount is deducted here.
    const { balance } = await this.wallet.getBalance(workerId);
    if (balance <= 0 || balance < OFFER_SUBMISSION_FEE) {
      throw new BadRequestException(OFFER_WALLET_INSUFFICIENT_MESSAGE);
    }

    // Spam control (admin settings → maxActiveOffersPerWorker).
    const maxActive = await this.maxActiveOffersPerWorker();
    if (maxActive > 0) {
      const activeOffers = await this.prisma.jobOffer.count({
        where: {
          workerId,
          status: { in: [OfferStatus.PENDING, OfferStatus.VIEWING, OfferStatus.COUNTERED] },
        },
      });
      if (activeOffers >= maxActive) {
        throw new BadRequestException(
          `MAX_ACTIVE_OFFERS: you can have at most ${maxActive} active offer${
            maxActive === 1 ? '' : 's'
          } at a time — wait for a response or withdraw one before offering again`,
        );
      }
    }

    const message = dto.note ?? dto.message ?? null;
    const offer = await this.prisma.jobOffer.create({
      data: {
        jobId,
        workerId,
        visitCharge: dto.visitCharge,
        message,
        status: 'PENDING',
        negotiationRound: 0,
        negotiationHistory: [],
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            phone: true,
            workerProfile: {
              select: {
                skills: true,
                experienceYears: true,
                bio: true,
              },
            },
          },
        },
      },
    });

    if (job.status === 'OPEN') {
      await this.jobsService.transitionJobState(jobId, 'OFFERS_RECEIVED').catch(() => 0);
    }
    if (this.redis) {
      await Promise.all([
        this.redis.delPattern(`perf:jobs:customer:${job.customerId}:*`),
        this.redis.delPattern(`perf:job:detail:${jobId}:*`),
        this.redis.delPattern(`perf:offers:my:${workerId}:*`),
      ]).catch(() => 0);
    }

    this.eventBus.emit('offer.submitted', {
      offerId: offer.id,
      jobId,
      workerId,
      visitCharge: dto.visitCharge,
    });

    const [workerReviews, completedJobsCount] = await Promise.all([
      this.prisma.review.aggregate({
        where: { revieweeId: workerId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.prisma.serviceRequest.count({
        where: { selectedWorkerId: workerId, status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] } },
      }),
    ]);

    const totalReviews = workerReviews._count._all ?? 0;
    const workerRating =
      totalReviews > 0 && workerReviews._avg.rating != null
        ? Number(workerReviews._avg.rating.toFixed(1))
        : 0;

    const populatedOffer = {
      id: offer.id,
      jobId,
      workerId,
      worker: {
        id: offer.worker?.id ?? workerId,
        name: offer.worker?.name ?? 'Verified Pro',
        avatarUrl: offer.worker?.avatarUrl ?? '',
        phone: offer.worker?.phone ?? '',
        rating: workerRating,
        totalReviews,
        completedJobsCount,
        skills: offer.worker?.workerProfile?.skills ?? [],
        experienceYears: offer.worker?.workerProfile?.experienceYears ?? 0,
        bio: offer.worker?.workerProfile?.bio ?? '',
      },
      visitCharge: Number(offer.visitCharge),
      visitFee: Number(offer.visitCharge),
      message: offer.message,
      note: offer.message,
      status: offer.status,
      negotiationRound: offer.negotiationRound,
      createdAt: offer.createdAt,
    };

    this.realtime.emitToRoom(userRoom(job.customerId), JOB_EVENTS.jobOffer, {
      jobId,
      offerId: offer.id,
      workerId,
      visitCharge: dto.visitCharge,
      offer: populatedOffer,
    });

    return offer;
  }

  async getJobOffers(jobId: string, user: JwtPayload) {
    const job = await this.prisma.serviceRequest.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (user.role === Role.CUSTOMER && job.customerId !== user.sub) {
      throw new ForbiddenException('Only the job owner can view offers for this job');
    }
    if (
      user.role === Role.WORKER &&
      job.selectedWorkerId !== user.sub &&
      job.status !== 'OPEN' &&
      job.status !== 'OFFERS_RECEIVED'
    ) {
      throw new ForbiddenException('You are not authorised to view offers for this job');
    }

    if (user.role === Role.CUSTOMER) {
      // Fire-and-forget non-blocking status update to avoid slowing down offer retrieval
      this.prisma.jobOffer
        .updateMany({
          where: { jobId, status: 'PENDING' },
          data: { status: 'VIEWING' },
        })
        .catch(() => 0);
    }
    const where = user.role === Role.WORKER ? { jobId, workerId: user.sub } : { jobId };
    const offers = await this.prisma.jobOffer.findMany({
      where,
      orderBy: { visitCharge: 'asc' },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            phone: true,
            isVerified: true,
            workerProfile: {
              select: {
                skills: true,
                experienceYears: true,
                bio: true,
                verificationStatus: true,
                serviceRadiusKm: true,
              },
            },
            serviceAreas: {
              select: {
                label: true,
                address: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
    });

    const workerIds = [...new Set(offers.map((o) => o.workerId))];

    const [ratingAgg, completedAgg] = await Promise.all([
      workerIds.length > 0
        ? (this.prisma.review.groupBy({
            by: ['revieweeId'],
            where: { revieweeId: { in: workerIds }, isVisible: true },
            _avg: { rating: true },
            _count: { _all: true },
          }) as unknown as Promise<
            Array<{
              revieweeId: string;
              _avg: { rating: number | null };
              _count: { _all: number };
            }>
          >)
        : Promise.resolve([]),
      workerIds.length > 0
        ? (this.prisma.serviceRequest.groupBy({
            by: ['selectedWorkerId'],
            where: {
              selectedWorkerId: { in: workerIds },
              status: { in: ['VISIT_COMPLETED', 'COMPLETED', 'PAID', 'REVIEWED'] },
            },
            _count: { _all: true },
          }) as unknown as Promise<
            Array<{ selectedWorkerId: string | null; _count: { _all: number } }>
          >)
        : Promise.resolve([]),
    ]);

    const ratingMap = new Map(ratingAgg.map((r) => [r.revieweeId, r]));
    const completedMap = new Map(completedAgg.map((c) => [c.selectedWorkerId!, c]));

    return offers.map((o) => {
      const w = o.worker;
      const r = ratingMap.get(o.workerId);
      const c = completedMap.get(o.workerId);
      let distanceKm = 0;
      if (job?.latitude != null && job?.longitude != null && w?.serviceAreas?.length) {
        const distances = w.serviceAreas.map((sa) =>
          haversineKm(job.latitude!, job.longitude!, sa.latitude, sa.longitude),
        );
        distanceKm = Math.round(Math.min(...distances) * 10) / 10;
      }
      const diffMs = job?.createdAt ? new Date(o.createdAt).getTime() - new Date(job.createdAt).getTime() : 0;
      const diffMins = Math.max(0, Math.round(diffMs / 60000));
      let responseTime: string | null = null;
      if (diffMins < 1) responseTime = '< 1m';
      else if (diffMins < 60) responseTime = `${diffMins}m`;
      else if (diffMins < 1440) responseTime = `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
      else responseTime = `${Math.floor(diffMins / 1440)}d`;

      return {
        id: o.id,
        jobId: o.jobId,
        workerId: o.workerId,
        worker: w
          ? {
              id: w.id,
              name: w.name,
              avatarUrl: w.avatarUrl,
              phone: w.phone,
              avgRating: r?._avg.rating !== null && r?._avg.rating !== undefined ? Number(r._avg.rating.toFixed(1)) : 0,
              ratingCount: r?._count._all ?? 0,
              completedJobs: c?._count._all ?? 0,
              skills: w.workerProfile?.skills ?? [],
              experienceYears: w.workerProfile?.experienceYears ?? 0,
              bio: w.workerProfile?.bio ?? '',
              isVerified: w.isVerified,
              isNadraCleared: w.workerProfile?.verificationStatus === 'APPROVED',
              isCnicVerified: w.workerProfile?.verificationStatus === 'APPROVED',
              serviceArea: w.serviceAreas?.[0]?.label ?? w.serviceAreas?.[0]?.address ?? '',
              responseTime,
            }
          : null,
        visitCharge: Number(o.visitCharge),
        message: o.message,
        distanceKm,
        status: o.status,
        negotiationRound: o.negotiationRound,
        lockedAt: o.lockedAt,
        createdAt: o.createdAt,
      };
    });
  }

  async getMyOffers(workerId: string, query: OfferListQueryDto) {
    // B5: frontend requests ?limit=100; default maxLimit=50 clipped the page.
    const { page, limit, skip } = normalizePage(query, 100);
    const where = {
      workerId,
      ...(query.status ? { status: query.status as OfferStatus } : {}),
      ...(query.jobId ? { jobId: query.jobId } : {}),
    };
    // Promise.all, not $transaction: the batch transaction's BEGIN/COMMIT
    // cost ~3 extra DB round trips at this RTT; the only semantic difference
    // is a possible ±1 items/total mismatch if an offer is written mid-request.
    const [offers, total] = await Promise.all([
      this.prisma.jobOffer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              area: true,
              city: true,
              status: true,
              createdAt: true,
              category: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.jobOffer.count({ where }),
    ]);
    return toPageResult(
      offers.map((o) => ({
        id: o.id,
        jobId: o.jobId,
        job: o.job,
        visitCharge: Number(o.visitCharge),
        message: o.message,
        status: o.status,
        negotiationRound: o.negotiationRound,
        createdAt: o.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  /** Task 12-14 aliases: POST /offers/:offerId/accept|reject|counter (jobId resolved internally). */
  getOfferJobId(offerId: string): Promise<{ jobId: string } | null> {
    return this.prisma.jobOffer.findUnique({
      where: { id: offerId },
      select: { jobId: true },
    });
  }

  async acceptOffer(jobId: string, offerId: string, user: JwtPayload, dto: RespondOfferDto) {
    const job = await this.prisma.serviceRequest.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.customerId !== user.sub) {
      throw new ForbiddenException('Only the job owner can accept an offer');
    }
    const offer = await this.prisma.jobOffer.findFirst({ where: { id: offerId, jobId } });
    if (!offer) {
      throw new NotFoundException('Offer not found for this job');
    }
    if (!['PENDING', 'VIEWING', 'COUNTERED', 'REJECTED'].includes(offer.status)) {
      throw new BadRequestException(
        'OFFER_INVALID_STATE: offer cannot be accepted in its current state',
      );
    }

    const finalCharge = dto.visitCharge ?? Number(offer.visitCharge);
    // Price is locked on acceptance (bounded-negotiation design).
    if (dto.visitCharge != null && finalCharge !== Number(offer.visitCharge)) {
      throw new BadRequestException(
        'OFFER_PRICE_MISMATCH: accepted price must match the offered price',
      );
    }

    const acceptedWorkerId = offer.workerId;
    const { acceptedOffer, rejectedOffers } = await this.prisma.$transaction(async (tx) => {
      const [acceptedOffer, rejectedOffers] = await Promise.all([
        tx.jobOffer.update({
          where: { id: offerId },
          data: { status: 'ACCEPTED', lockedAt: new Date() },
        }),
        tx.jobOffer.findMany({
          where: { jobId, NOT: { id: offerId }, status: { in: ['PENDING', 'VIEWING', 'COUNTERED'] } },
          select: { id: true, workerId: true },
        }),
      ]);

      await Promise.all([
        tx.jobOffer.updateMany({
          where: { jobId, NOT: { id: offerId }, status: { in: ['PENDING', 'VIEWING', 'COUNTERED'] } },
          data: { status: 'REJECTED' },
        }),
        tx.serviceRequest.update({
          where: { id: jobId },
          data: {
            status: 'WORKER_ASSIGNED',
            selectedWorkerId: acceptedWorkerId,
            lockedVisitCharge: finalCharge,
          },
        }),
        tx.visit.create({
          data: {
            jobId,
            workerId: acceptedWorkerId,
            offerId,
            scheduledDate: job.preferredVisitTime ?? new Date(),
            status: 'SCHEDULED',
          },
        }),
      ]);
      return { acceptedOffer, rejectedOffers };
    });

    this.eventBus.emit('offer.accepted', {
      offerId,
      jobId,
      workerId: acceptedWorkerId,
      customerId: job.customerId,
      lockedVisitCharge: finalCharge,
    });
    this.realtime.emitToRoom(userRoom(acceptedWorkerId), JOB_EVENTS.jobOfferAccepted, {
      jobId,
      offerId,
      finalCharge,
    });
    for (const o of rejectedOffers) {
      if (o.workerId !== acceptedWorkerId) {
        this.eventBus.emit('offer.rejected', { offerId: o.id, jobId, workerId: o.workerId });
        this.realtime.emitToRoom(userRoom(o.workerId), JOB_EVENTS.jobClosed, { jobId });
      }
    }
    this.realtime.emitToRoom(userRoom(job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId,
      oldStatus: job.status,
      newStatus: 'WORKER_ASSIGNED',
    });
    this.realtime.emitToRoom(WORKERS_ROOM, JOB_EVENTS.jobClosed, { jobId });

    this.jobsService.clearAvailableJobsCache?.();
    if (this.redis) {
      await Promise.all([
        this.redis.delPattern(`perf:jobs:customer:${job.customerId}:*`),
        this.redis.delPattern(`perf:job:detail:${jobId}:*`),
        this.redis.delPattern('perf:jobs:available:*'),
      ]).catch(() => 0);
    }

    return { acceptedOffer, rejectedOffers, lockedVisitCharge: finalCharge };
  }

  private pushHistory(history: unknown, entry: NegotiationEntry) {
    const current = Array.isArray(history) ? (history as NegotiationEntry[]) : [];
    return [...current, entry];
  }

  async counterOffer(jobId: string, offerId: string, user: JwtPayload, dto: CounterOfferDto) {
    const job = await this.prisma.serviceRequest.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const offer = await this.prisma.jobOffer.findFirst({ where: { id: offerId, jobId } });
    if (!offer) {
      throw new NotFoundException('Offer not found for this job');
    }
    if (!['PENDING', 'VIEWING', 'COUNTERED'].includes(offer.status)) {
      throw new BadRequestException(
        'OFFER_INVALID_STATE: offer cannot be countered in its current state',
      );
    }

    let by: 'worker' | 'customer';
    if (user.role === Role.CUSTOMER) {
      if (job.customerId !== user.sub) {
        throw new ForbiddenException('Only the job owner can counter an offer');
      }
      by = 'customer';
    } else if (user.role === Role.WORKER) {
      if (offer.workerId !== user.sub) {
        throw new ForbiddenException('You can only counter your own offer');
      }
      // Only an approved + complete worker may negotiate (Task 3 eligibility).
      await assertWorkerEligible(this.prisma, offer.workerId, this.redis);
      by = 'worker';
    } else {
      throw new ForbiddenException('Role not authorised to negotiate');
    }

    const nextRound = offer.negotiationRound + 1;
    if (nextRound > this.maxRounds) {
      throw new BadRequestException(
        `MAX_NEGOTIATION_ROUNDS_EXCEEDED: maximum ${this.maxRounds} counter rounds`,
      );
    }

    const visitCharge = dto.visitCharge ?? dto.counterAmount ?? dto.counterPrice;
    if (visitCharge == null || visitCharge < 0) {
      throw new BadRequestException('INVALID_COUNTER_PRICE: counter price must be a positive number');
    }
    const note = dto.note ?? dto.message ?? null;

    const history = this.pushHistory(offer.negotiationHistory, {
      by,
      amount: visitCharge,
      note,
      timestamp: new Date().toISOString(),
    });

    const updated = await this.prisma.jobOffer.update({
      where: { id: offerId },
      data: {
        visitCharge,
        status: 'COUNTERED',
        negotiationRound: nextRound,
        negotiationHistory: history,
        message: note,
      },
    });

    this.eventBus.emit('offer.countered', {
      offerId,
      jobId,
      by,
      amount: dto.visitCharge,
      round: nextRound,
    });
    const notify = by === 'worker' ? job.customerId : offer.workerId;
    this.realtime.emitToRoom(userRoom(notify), JOB_EVENTS.jobOffer, {
      jobId,
      offerId,
      workerId: offer.workerId,
      visitCharge: dto.visitCharge,
      status: 'COUNTERED',
    });

    return updated;
  }

  async rejectOffer(jobId: string, offerId: string, user: JwtPayload) {
    const job = await this.prisma.serviceRequest.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.customerId !== user.sub) {
      throw new ForbiddenException('Only the job owner can reject an offer');
    }
    const offer = await this.prisma.jobOffer.findFirst({ where: { id: offerId, jobId } });
    if (!offer) {
      throw new NotFoundException('Offer not found for this job');
    }
    if (!['PENDING', 'VIEWING', 'COUNTERED'].includes(offer.status)) {
      throw new BadRequestException('OFFER_INVALID_STATE');
    }
    const updated = await this.prisma.jobOffer.update({
      where: { id: offerId },
      data: { status: 'REJECTED' },
    });
    this.eventBus.emit('offer.rejected', { offerId, jobId, workerId: offer.workerId });
    this.realtime.emitToRoom(userRoom(offer.workerId), JOB_EVENTS.jobClosed, { jobId });
    if (this.redis) {
      await this.redis.delPattern(`perf:jobs:customer:${job.customerId}:*`);
    }
    return updated;
  }

  async withdrawOffer(offerId: string, user: JwtPayload) {
    const offer = await this.prisma.jobOffer.findUnique({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.workerId !== user.sub) {
      throw new ForbiddenException('You can only withdraw your own offer');
    }
    if (!['PENDING', 'VIEWING', 'COUNTERED'].includes(offer.status)) {
      throw new BadRequestException(
        'OFFER_INVALID_STATE: offer cannot be withdrawn in its current state',
      );
    }
    const updated = await this.prisma.jobOffer.update({
      where: { id: offerId },
      data: { status: 'WITHDRAWN' },
    });
    this.eventBus.emit('offer.rejected', { offerId, jobId: offer.jobId, workerId: offer.workerId });
    return updated;
  }
}
