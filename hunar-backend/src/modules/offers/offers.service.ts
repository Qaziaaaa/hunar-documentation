import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OfferStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { JobsService } from '../jobs/jobs.service';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { RealtimeService } from '../realtime/realtime.service';
import { JOB_EVENTS, userRoom } from '../jobs/jobs.events';
import {
  CounterOfferDto,
  CreateOfferDto,
  OfferListQueryDto,
  RespondOfferDto,
} from './offers.validation';
import { NegotiationEntry } from '../../common/event-bus/events';

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly jobsService: JobsService,
    private readonly realtime: RealtimeService,
    private readonly config: ConfigService,
  ) {}

  private get maxRounds(): number {
    return this.config.get<number>('app.maxNegotiationRounds', 5);
  }

  async createOffer(workerId: string, jobId: string, dto: CreateOfferDto) {
    const job = await this.prisma.serviceRequest.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (!['OPEN', 'OFFERS_RECEIVED'].includes(job.status)) {
      throw new BadRequestException(
        'JOB_INVALID_STATE: offers are no longer accepted for this job',
      );
    }

    const existing = await this.prisma.jobOffer.findUnique({
      where: { jobId_workerId: { jobId, workerId } },
    });
    if (existing) {
      throw new ConflictException('OFFER_DUPLICATE: you already submitted an offer for this job');
    }

    const offer = await this.prisma.jobOffer.create({
      data: {
        jobId,
        workerId,
        visitCharge: dto.visitCharge,
        message: dto.note ?? null,
        status: 'PENDING',
        negotiationRound: 0,
        negotiationHistory: [],
      },
    });

    if (job.status === 'OPEN') {
      await this.jobsService.transitionJobState(jobId, 'OFFERS_RECEIVED');
    }

    this.eventBus.emit('offer.submitted', {
      offerId: offer.id,
      jobId,
      workerId,
      visitCharge: dto.visitCharge,
    });
    this.realtime.emitToRoom(userRoom(job.customerId), JOB_EVENTS.jobOffer, {
      jobId,
      offerId: offer.id,
      workerId,
      visitCharge: dto.visitCharge,
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
      await this.prisma.jobOffer.updateMany({
        where: { jobId, status: 'PENDING' },
        data: { status: 'VIEWING' },
      });
    }

    const where = user.role === Role.WORKER ? { jobId, workerId: user.sub } : { jobId };
    const offers = await this.prisma.jobOffer.findMany({
      where,
      orderBy: { visitCharge: 'asc' },
      include: {
        worker: { select: { id: true, name: true, avatarUrl: true, phone: true } },
      },
    });

    const workerIds = [...new Set(offers.map((o) => o.workerId))];
    const ratingAgg = (await this.prisma.review.groupBy({
      by: ['revieweeId'],
      where: { revieweeId: { in: workerIds }, isVisible: true },
      _avg: { rating: true },
      _count: { _all: true },
    })) as unknown as Array<{
      revieweeId: string;
      _avg: { rating: number | null };
      _count: { _all: number };
    }>;
    const completedAgg = (await this.prisma.serviceRequest.groupBy({
      by: ['selectedWorkerId'],
      where: {
        selectedWorkerId: { in: workerIds },
        status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] },
      },
      _count: { _all: true },
    })) as unknown as Array<{ selectedWorkerId: string | null; _count: { _all: number } }>;

    const ratingMap = new Map(ratingAgg.map((r) => [r.revieweeId, r]));
    const completedMap = new Map(completedAgg.map((c) => [c.selectedWorkerId!, c]));

    return offers.map((o) => ({
      id: o.id,
      jobId: o.jobId,
      workerId: o.workerId,
      worker: {
        name: o.worker.name,
        avatarUrl: o.worker.avatarUrl,
        phone: o.worker.phone,
        avgRating: ratingMap.get(o.workerId)?._avg.rating ?? null,
        ratingCount: ratingMap.get(o.workerId)?._count._all ?? 0,
        completedJobs: completedMap.get(o.workerId)?._count._all ?? 0,
      },
      visitCharge: Number(o.visitCharge),
      message: o.message,
      status: o.status,
      negotiationRound: o.negotiationRound,
      lockedAt: o.lockedAt,
      createdAt: o.createdAt,
    }));
  }

  async getMyOffers(workerId: string, query: OfferListQueryDto) {
    const { page, limit, skip } = normalizePage(query);
    const where = {
      workerId,
      ...(query.status ? { status: query.status as OfferStatus } : {}),
      ...(query.jobId ? { jobId: query.jobId } : {}),
    };
    const [offers, total] = await this.prisma.$transaction([
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
    if (!['PENDING', 'VIEWING', 'COUNTERED'].includes(offer.status)) {
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

    if (job.status === 'OPEN') {
      await this.prisma.jobOffer.updateMany({
        where: { jobId, NOT: { id: offerId }, status: { in: ['PENDING', 'VIEWING', 'COUNTERED'] } },
        data: { status: 'REJECTED' },
      });
    }

    const acceptedWorkerId = offer.workerId;
    const { acceptedOffer, rejectedOffers } = await this.prisma.$transaction(async (tx) => {
      const acceptedOffer = await tx.jobOffer.update({
        where: { id: offerId },
        data: { status: 'ACCEPTED', lockedAt: new Date() },
      });
      const rejectedOffers = await tx.jobOffer.findMany({
        where: { jobId, NOT: { id: offerId }, status: { in: ['PENDING', 'VIEWING', 'COUNTERED'] } },
        select: { id: true, workerId: true },
      });
      await tx.jobOffer.updateMany({
        where: { jobId, NOT: { id: offerId }, status: { in: ['PENDING', 'VIEWING', 'COUNTERED'] } },
        data: { status: 'REJECTED' },
      });
      await tx.serviceRequest.update({
        where: { id: jobId },
        data: {
          status: 'WORKER_ASSIGNED',
          selectedWorkerId: acceptedWorkerId,
          lockedVisitCharge: finalCharge,
        },
      });
      // Auto-create the visit record (worker schedules the actual time via the Visit flow).
      await tx.visit.create({
        data: {
          jobId,
          workerId: acceptedWorkerId,
          offerId,
          scheduledDate: job.preferredVisitTime ?? new Date(),
          status: 'SCHEDULED',
        },
      });
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

    const history = this.pushHistory(offer.negotiationHistory, {
      by,
      amount: dto.visitCharge,
      note: dto.note,
      timestamp: new Date().toISOString(),
    });

    const updated = await this.prisma.jobOffer.update({
      where: { id: offerId },
      data: {
        visitCharge: dto.visitCharge,
        status: 'COUNTERED',
        negotiationRound: nextRound,
        negotiationHistory: history,
        message: dto.note,
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
