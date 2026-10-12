import { randomInt } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { JobsService } from '../jobs/jobs.service';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { RealtimeService } from '../realtime/realtime.service';
import { WalletService } from '../payments/wallet.service';
import { RedisService } from '../../common/redis/redis.service';
import {
  VISIT_ARRIVAL_OTP_PREFIX,
  JOB_ARRIVAL_OTP_PREFIX,
  VISIT_ARRIVAL_OTP_TTL_SECONDS,
} from '../../common/redis/redis.constants';
import { JOB_EVENTS, jobRoom, LOCATION_EVENTS, userRoom } from '../jobs/jobs.events';
import { isOrderCode } from '../../common/helpers/order-code.util';
import { InspectionDto, TrackLocationDto, VisitQueryDto } from './visits.validation';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly jobsService: JobsService,
    private readonly realtime: RealtimeService,
    private readonly wallet: WalletService,
    private readonly redis: RedisService,
  ) {}

  private async assertVisitAccess(visitId: string, user: JwtPayload) {
    let visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        job: true,
        worker: { select: { id: true, name: true, phone: true } },
        offer: { select: { id: true, visitCharge: true, status: true } },
      },
    });
    if (!visit) {
      visit = await this.prisma.visit.findFirst({
        where: { jobId: visitId },
        orderBy: { createdAt: 'desc' },
        include: {
          job: true,
          worker: { select: { id: true, name: true, phone: true } },
          offer: { select: { id: true, visitCharge: true, status: true } },
        },
      });
    }
    if (!visit) {
      throw new NotFoundException('Visit not found');
    }
    if (user.role === Role.CUSTOMER && visit.job.customerId !== user.sub) {
      throw new ForbiddenException('You are not the owner of this job');
    }
    if (user.role === Role.WORKER && visit.workerId !== user.sub) {
      throw new ForbiddenException('You are not the assigned worker for this visit');
    }
    return visit;
  }

  async getVisit(visitId: string, user: JwtPayload) {
    const visit = await this.assertVisitAccess(visitId, user);
    const [repairs, latestLoc] = await Promise.all([
      this.prisma.repair.findMany({
        where: { visitId },
        include: { revisions: { orderBy: { createdAt: 'desc' } } },
      }),
      this.prisma.locationTracking.findFirst({
        where: { jobId: visit.jobId },
        orderBy: { recordedAt: 'desc' },
        select: { latitude: true, longitude: true },
      }),
    ]);
    return {
      ...visit,
      customerLat: visit.job?.latitude,
      customerLng: visit.job?.longitude,
      customerAddress: visit.job?.address,
      currentLat: latestLoc?.latitude ?? null,
      currentLng: latestLoc?.longitude ?? null,
      repairEstimate: visit.repairEstimate ? Number(visit.repairEstimate) : null,
      offerCharge: Number(visit.offer.visitCharge),
      repairs: repairs.map((r) => ({
        id: r.id,
        description: r.description,
        amount: Number(r.amount),
        itemsBreakdown: r.itemsBreakdown,
        status: r.status,
        lockedAmount: r.lockedAmount ? Number(r.lockedAmount) : null,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        revisions: r.revisions,
      })),
    };
  }

  async getMyVisits(user: JwtPayload, query: VisitQueryDto) {
    const { page, limit, skip } = normalizePage(query);
    const cacheKey = `perf:visits:my:${user.sub}:${page}:${limit}:${query.status ?? 'all'}`;

    // Read-through cache — visits list is heavy (joins + DISTINCT ON location)
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }

    const where =
      user.role === Role.WORKER ? { workerId: user.sub } : { job: { customerId: user.sub } };
    const whereWithStatus = query.status ? { ...where, status: query.status as never } : where;

    // Promise.all, not $transaction: batch BEGIN/COMMIT costs ~3 extra RTTs.
    const [visits, total] = await Promise.all([
      this.prisma.visit.findMany({
        where: whereWithStatus,
        skip,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              area: true,
              city: true,
              address: true,
              latitude: true,
              longitude: true,
              status: true,
              lockedVisitCharge: true,
              category: { select: { name: true } },
            },
          },
          worker: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatarUrl: true,
            },
          },
          offer: {
            select: {
              visitCharge: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.visit.count({ where: whereWithStatus }),
    ]);

    // One latest-location row per job instead of a findFirst per visit (N+1:
    // up to `limit` queries per page). DISTINCT ON uses the @@index([jobId]).
    const latestByJob = new Map<string, { latitude: number; longitude: number }>();
    if (visits.length > 0) {
      const jobIds = [...new Set(visits.map((v) => v.jobId))];
      const latestRows = await this.prisma.$queryRaw<
        Array<{ jobId: string; latitude: number; longitude: number }>
      >(Prisma.sql`
        SELECT DISTINCT ON ("jobId") "jobId", "latitude", "longitude"
        FROM "LocationTracking"
        WHERE "jobId" IN (${Prisma.join(jobIds)})
        ORDER BY "jobId", "recordedAt" DESC
      `);
      for (const r of latestRows) {
        latestByJob.set(r.jobId, { latitude: r.latitude, longitude: r.longitude });
      }
    }

    const items = visits.map((v) => {
      const latestLoc = latestByJob.get(v.jobId);
      return {
        ...v,
        customerLat: v.job?.latitude,
        customerLng: v.job?.longitude,
        customerAddress: v.job?.address,
        currentLat: latestLoc?.latitude ?? null,
        currentLng: latestLoc?.longitude ?? null,
      };
    });

    const result = toPageResult(items, total, page, limit);
    // Cache for 20s — stale-on-mutation is fine; WebSocket pushes real-time changes.
    await this.redis.set(cacheKey, JSON.stringify(result), 20);
    return result;
  }

  /** Bust all visit-list cache entries for both participants of a visit. */
  private async invalidateVisitCache(workerId: string, customerId?: string) {
    await this.redis.delPattern(`perf:visits:my:${workerId}:*`);
    if (customerId) {
      await this.redis.delPattern(`perf:visits:my:${customerId}:*`);
    }
  }

  async rescheduleVisit(visitId: string, user: JwtPayload, scheduledTime: Date) {
    let visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) {
      visit = await this.prisma.visit.findFirst({
        where: { jobId: visitId },
        orderBy: { createdAt: 'desc' },
      });
    }
    if (!visit) {
      throw new NotFoundException('Visit not found');
    }
    if (visit.workerId !== user.sub) {
      throw new ForbiddenException('Only the assigned worker can schedule the visit');
    }
    if (visit.status !== 'SCHEDULED') {
      throw new BadRequestException(
        'VISIT_INVALID_STATE: only scheduled visits can be rescheduled',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.visit.update({
        where: { id: visit.id },
        data: { scheduledDate: scheduledTime },
      });
      // Job booking state: WORKER_ASSIGNED → VISIT_SCHEDULED.
      const job = await tx.serviceRequest.findUniqueOrThrow({ where: { id: visit.jobId } });
      if (job.status === 'WORKER_ASSIGNED') {
        await tx.serviceRequest.update({
          where: { id: visit.jobId },
          data: { status: 'VISIT_SCHEDULED' },
        });
      }
      return v;
    });

    this.eventBus.emit('job.statusChanged', {
      jobId: visit.jobId,
      oldStatus: 'WORKER_ASSIGNED',
      newStatus: 'VISIT_SCHEDULED',
    });
    // Bust cached visits lists for this worker
    this.invalidateVisitCache(visit.workerId).catch(() => 0);
    return updated;
  }

  async startVisit(visitId: string, user: JwtPayload) {
    const visit = await this.assertVisitAccess(visitId, user);
    if (user.role !== Role.WORKER) {
      throw new ForbiddenException('Only the assigned worker can start the visit');
    }

    // Idempotent start: if already in progress, safely return current visit
    if (visit.status === 'IN_PROGRESS') {
      if (visit.job.status === 'WORKER_ASSIGNED' || visit.job.status === 'VISIT_SCHEDULED') {
        await this.prisma.serviceRequest.update({
          where: { id: visit.jobId },
          data: { status: 'VISIT_IN_PROGRESS' },
        });
      }
      return visit;
    }
    if (visit.status === 'COMPLETED') {
      throw new BadRequestException('VISIT_INVALID_STATE: visit has already been completed');
    }
    if (visit.status === 'CANCELLED' || visit.status === 'NO_SHOW') {
      throw new BadRequestException(`VISIT_INVALID_STATE: visit is ${visit.status.toLowerCase()}`);
    }
    if (visit.status !== 'SCHEDULED') {
      throw new BadRequestException('VISIT_INVALID_STATE: visit must be scheduled before starting');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.visit.update({
        where: { id: visit.id },
        data: { status: 'IN_PROGRESS', actualDate: new Date() },
      });
      await tx.serviceRequest.update({
        where: { id: visit.jobId },
        data: { status: 'VISIT_IN_PROGRESS' },
      });
      return v;
    });

    this.eventBus.emit('visit.started', {
      visitId: visit.id,
      jobId: visit.jobId,
      workerId: visit.workerId,
      customerId: visit.job.customerId,
    });
    this.realtime.emitToRoom(userRoom(visit.job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId: visit.jobId,
      oldStatus: 'VISIT_SCHEDULED',
      newStatus: 'VISIT_IN_PROGRESS',
    });
    this.invalidateVisitCache(visit.workerId, visit.job.customerId).catch(() => 0);
    return updated;
  }

  async workerArrived(visitId: string, user: JwtPayload) {
    const visit = await this.assertVisitAccess(visitId, user);
    if (visit.status === 'CANCELLED' || visit.status === 'NO_SHOW') {
      throw new BadRequestException(
        `VISIT_INVALID_STATE: cannot mark arrival for a ${visit.status.toLowerCase()} visit`,
      );
    }
    if (visit.inspectionSubmittedAt) {
      throw new BadRequestException(
        'VISIT_INVALID_STATE: visit inspection has already been submitted',
      );
    }
    if (user.role !== Role.WORKER) {
      throw new ForbiddenException('Only the assigned worker can mark arrival');
    }

    // Task 7 — hold 10% of the locked visit charge on arrival. Throws
    // INSUFFICIENT_BALANCE when the worker's wallet cannot cover the hold,
    // which blocks arrival (the rule in the wallet spec).
    await this.wallet.holdCommissionForJob(visit.workerId, visit.jobId);

    // If visit was SCHEDULED, mark it IN_PROGRESS
    if (visit.status === 'SCHEDULED') {
      await this.prisma.visit.update({
        where: { id: visit.id },
        data: { status: 'IN_PROGRESS' },
      });
      await this.prisma.serviceRequest.update({
        where: { id: visit.jobId },
        data: { status: 'VISIT_IN_PROGRESS' },
      });
    }

    // Check if an arrival OTP is already active for this visit
    const visitOtpKey = `${VISIT_ARRIVAL_OTP_PREFIX}${visit.id}`;
    const jobOtpKey = `${JOB_ARRIVAL_OTP_PREFIX}${visit.jobId}`;
    let otp = await this.redis.get(visitOtpKey);

    if (!otp) {
      otp = randomInt(1000, 10000).toString();
      await this.redis.set(visitOtpKey, otp, VISIT_ARRIVAL_OTP_TTL_SECONDS);
      await this.redis.set(jobOtpKey, otp, VISIT_ARRIVAL_OTP_TTL_SECONDS);
    }

    const arrivalPayload = {
      visitId: visit.id,
      jobId: visit.jobId,
      workerId: visit.workerId,
      workerName: visit.worker?.name || 'Worker',
      workerPhone: visit.worker?.phone,
      customerId: visit.job.customerId,
      arrivedAt: Date.now(),
      status: 'pending_otp',
      otp, // provided so customer modal can verify against the real OTP
    };

    // Emit arrival events internally and over Socket.IO to Customer
    this.eventBus.emit('visit.arrived', arrivalPayload);
    this.realtime.emitToRoom(userRoom(visit.job.customerId), 'visit:arrived', arrivalPayload);
    this.realtime.emitToRoom(userRoom(visit.job.customerId), 'visit.arrived', arrivalPayload);
    this.realtime.emitToRoom(userRoom(visit.job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId: visit.jobId,
      oldStatus: 'VISIT_IN_PROGRESS',
      newStatus: 'VISIT_IN_PROGRESS',
      arrivalPending: true,
      visitId: visit.id,
    });

    this.invalidateVisitCache(visit.workerId, visit.job.customerId).catch(() => 0);
    return {
      success: true,
      otp,
      visitId: visit.id,
      jobId: visit.jobId,
      arrivedAt: arrivalPayload.arrivedAt,
      status: 'pending_otp',
    };
  }

  async verifyArrivalOtp(visitOrJobId: string, user: JwtPayload, submittedOtp: string) {
    const visit = await this.assertVisitAccess(visitOrJobId, user);

    const cleanInput = submittedOtp?.replace(/\D/g, '').trim();
    if (!cleanInput || cleanInput.length < 4) {
      throw new BadRequestException('Please enter the 4-digit OTP provided by the worker.');
    }

    const visitOtpKey = `${VISIT_ARRIVAL_OTP_PREFIX}${visit.id}`;
    const jobOtpKey = `${JOB_ARRIVAL_OTP_PREFIX}${visit.jobId}`;

    const expectedOtp = (await this.redis.get(visitOtpKey)) || (await this.redis.get(jobOtpKey));

    if (!expectedOtp) {
      throw new BadRequestException(
        'ARRIVAL_OTP_EXPIRED: No pending arrival OTP found or it has expired.',
      );
    }

    if (cleanInput !== expectedOtp) {
      throw new BadRequestException('ARRIVAL_OTP_INVALID: The OTP entered is incorrect.');
    }

    // OTP is valid! Remove Redis keys
    await this.redis.del(visitOtpKey);
    await this.redis.del(jobOtpKey);

    // Advance DB status
    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.visit.update({
        where: { id: visit.id },
        data: { status: 'COMPLETED' },
      });
      await tx.serviceRequest.update({
        where: { id: visit.jobId },
        data: { status: 'VISIT_COMPLETED' },
      });
      return v;
    });

    const verifiedPayload = {
      visitId: visit.id,
      jobId: visit.jobId,
      workerId: visit.workerId,
      customerId: visit.job.customerId,
      status: 'otp_verified',
    };

    this.eventBus.emit('visit.otp.verified', verifiedPayload);

    // Notify both Customer and Worker rooms in real-time
    this.realtime.emitToRoom(userRoom(visit.job.customerId), 'visit:otp:verified', verifiedPayload);
    this.realtime.emitToRoom(userRoom(visit.job.customerId), 'visit.otp.verified', verifiedPayload);
    this.realtime.emitToRoom(userRoom(visit.workerId), 'visit:otp:verified', verifiedPayload);
    this.realtime.emitToRoom(userRoom(visit.workerId), 'visit.otp.verified', verifiedPayload);

    this.realtime.emitToRoom(userRoom(visit.job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId: visit.jobId,
      oldStatus: 'VISIT_IN_PROGRESS',
      newStatus: 'VISIT_COMPLETED',
    });
    this.realtime.emitToRoom(userRoom(visit.workerId), JOB_EVENTS.jobStatusChanged, {
      jobId: visit.jobId,
      oldStatus: 'VISIT_IN_PROGRESS',
      newStatus: 'VISIT_COMPLETED',
    });

    this.invalidateVisitCache(visit.workerId, visit.job.customerId).catch(() => 0);
    return {
      success: true,
      message: 'OTP verified successfully. The worker is now allowed inside the premises.',
      visit: updated,
    };
  }

  async submitInspection(visitId: string, user: JwtPayload, dto: InspectionDto) {
    const visit = await this.assertVisitAccess(visitId, user);
    if (visit.status !== 'COMPLETED') {
      throw new BadRequestException('VISIT_INVALID_STATE: inspection requires a completed visit');
    }
    if (user.role !== Role.WORKER) {
      throw new ForbiddenException('Only the assigned worker can submit the inspection');
    }


    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.visit.update({
        where: { id: visit.id },
        data: {
          diagnosis: dto.diagnosis,
          repairPlan: dto.repairPlan,
          repairEstimate: dto.repairEstimate,
          inspectionPhotos: dto.inspectionPhotos ?? [],
          estimatedRepairTimeMin: dto.estimatedRepairTimeMin,
          inspectionSubmittedAt: new Date(),
        },
      });
      await tx.serviceRequest.update({
        where: { id: visit.jobId },
        data: { status: 'INSPECTION_DONE' },
      });
      return v;
    });

    this.eventBus.emit('visit.inspectionSubmitted', {
      visitId,
      jobId: visit.jobId,
      repairEstimate: dto.repairEstimate,
    });
    this.realtime.emitToRoom(userRoom(visit.job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId: visit.jobId,
      oldStatus: 'VISIT_COMPLETED',
      newStatus: 'INSPECTION_DONE',
    });
    this.invalidateVisitCache(visit.workerId, visit.job.customerId).catch(() => 0);
    return updated;
  }

  /**
   * Task 22 — inspection report for a job (worker submits via the visit; the job
   * owner — and the assigned worker — can both read the submitted report).
   */
  async getJobInspection(jobId: string, user: JwtPayload) {
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
      select: { id: true, customerId: true, selectedWorkerId: true },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (user.role === Role.CUSTOMER && job.customerId !== user.sub) {
      throw new ForbiddenException('You are not the owner of this job');
    }
    if (user.role === Role.WORKER && job.selectedWorkerId !== user.sub) {
      throw new ForbiddenException('You are not the assigned worker for this job');
    }

    const visit = await this.prisma.visit.findFirst({
      where: { jobId },
      select: {
        id: true,
        status: true,
        diagnosis: true,
        repairPlan: true,
        repairEstimate: true,
        inspectionPhotos: true,
        estimatedRepairTimeMin: true,
        inspectionSubmittedAt: true,
        worker: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    if (!visit || !visit.inspectionSubmittedAt) {
      throw new NotFoundException('INSPECTION_NOT_FOUND: no inspection has been submitted');
    }

    return {
      jobId,
      visitId: visit.id,
      visitStatus: visit.status,
      diagnosis: visit.diagnosis,
      repairPlan: visit.repairPlan,
      repairEstimate: Number(visit.repairEstimate),
      inspectionPhotos: visit.inspectionPhotos ?? [],
      estimatedRepairTimeMin: visit.estimatedRepairTimeMin,
      submittedAt: visit.inspectionSubmittedAt,
      worker: visit.worker,
    };
  }

  async trackLocation(user: JwtPayload, jobId: string | undefined, dto: TrackLocationDto) {
    const cleanJobId = jobId && isOrderCode(jobId) ? jobId : undefined;
    const record = await this.prisma.locationTracking.create({
      data: {
        userId: user.sub,
        jobId: cleanJobId ?? null,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
      },
    });
    if (cleanJobId) {
      this.realtime.emitToRoom(jobRoom(cleanJobId), LOCATION_EVENTS.locationUpdate, {
        jobId: cleanJobId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        recordedAt: record.recordedAt,
      });
    }
    return record;
  }

  async getLocationHistory(jobId: string, user: JwtPayload, limit = 100) {
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
      select: { customerId: true, selectedWorkerId: true },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (user.role === Role.WORKER && job.selectedWorkerId !== user.sub) {
      throw new ForbiddenException('You are not the assigned worker for this job');
    }
    if (user.role === Role.CUSTOMER && job.customerId !== user.sub) {
      throw new ForbiddenException('You are not the owner of this job');
    }
    return this.prisma.locationTracking.findMany({
      where: { jobId },
      orderBy: { recordedAt: 'asc' },
      take: Math.min(limit, 1000),
      select: { latitude: true, longitude: true, accuracy: true, recordedAt: true, userId: true },
    });
  }
}
