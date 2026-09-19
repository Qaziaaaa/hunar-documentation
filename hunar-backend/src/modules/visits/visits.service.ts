import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { JobsService } from '../jobs/jobs.service';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { RealtimeService } from '../realtime/realtime.service';
import { WalletService } from '../payments/wallet.service';
import { JOB_EVENTS, jobRoom, LOCATION_EVENTS, userRoom } from '../jobs/jobs.events';
import { InspectionDto, TrackLocationDto, VisitQueryDto } from './visits.validation';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly jobsService: JobsService,
    private readonly realtime: RealtimeService,
    private readonly wallet: WalletService,
  ) {}

  private async assertVisitAccess(visitId: string, user: JwtPayload) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        job: true,
        worker: { select: { id: true, name: true, phone: true } },
        offer: { select: { id: true, visitCharge: true, status: true } },
      },
    });
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
    const repairs = await this.prisma.repair.findMany({
      where: { visitId },
      include: { revisions: { orderBy: { createdAt: 'desc' } } },
    });
    return {
      ...visit,
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
    const where =
      user.role === Role.WORKER ? { workerId: user.sub } : { job: { customerId: user.sub } };
    const whereWithStatus = query.status ? { ...where, status: query.status as never } : where;

    const [visits, total] = await this.prisma.$transaction([
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
              status: true,
              lockedVisitCharge: true,
            },
          },
        },
      }),
      this.prisma.visit.count({ where: whereWithStatus }),
    ]);
    return toPageResult(visits, total, page, limit);
  }

  async rescheduleVisit(visitId: string, user: JwtPayload, scheduledTime: Date) {
    const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
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
        where: { id: visitId },
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
    return updated;
  }

  async startVisit(visitId: string, user: JwtPayload) {
    const visit = await this.assertVisitAccess(visitId, user);
    if (visit.status !== 'SCHEDULED') {
      throw new BadRequestException('VISIT_INVALID_STATE: visit must be scheduled before starting');
    }
    if (user.role !== Role.WORKER) {
      throw new ForbiddenException('Only the assigned worker can start the visit');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.visit.update({
        where: { id: visitId },
        data: { status: 'IN_PROGRESS', actualDate: new Date() },
      });
      await tx.serviceRequest.update({
        where: { id: visit.jobId },
        data: { status: 'VISIT_IN_PROGRESS' },
      });
      return v;
    });

    this.eventBus.emit('visit.started', {
      visitId,
      jobId: visit.jobId,
      workerId: visit.workerId,
      customerId: visit.job.customerId,
    });
    this.realtime.emitToRoom(userRoom(visit.job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId: visit.jobId,
      oldStatus: 'VISIT_SCHEDULED',
      newStatus: 'VISIT_IN_PROGRESS',
    });
    return updated;
  }

  async workerArrived(visitId: string, user: JwtPayload) {
    const visit = await this.assertVisitAccess(visitId, user);
    if (visit.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'VISIT_INVALID_STATE: live tracking must be running before arrival',
      );
    }
    if (user.role !== Role.WORKER) {
      throw new ForbiddenException('Only the assigned worker can mark arrival');
    }

    // Task 7 — hold 10% of the locked visit charge on arrival. Throws
    // INSUFFICIENT_BALANCE when the worker's wallet cannot cover the hold,
    // which blocks arrival (the rule in the wallet spec).
    await this.wallet.holdCommissionForJob(visit.workerId, visit.jobId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.visit.update({
        where: { id: visitId },
        data: { status: 'COMPLETED' },
      });
      await tx.serviceRequest.update({
        where: { id: visit.jobId },
        data: { status: 'VISIT_COMPLETED' },
      });
      return v;
    });

    this.eventBus.emit('visit.arrived', {
      visitId,
      jobId: visit.jobId,
      workerId: visit.workerId,
      customerId: visit.job.customerId,
    });
    this.realtime.emitToRoom(userRoom(visit.job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId: visit.jobId,
      oldStatus: 'VISIT_IN_PROGRESS',
      newStatus: 'VISIT_COMPLETED',
    });
    return updated;
  }

  async submitInspection(visitId: string, user: JwtPayload, dto: InspectionDto) {
    const visit = await this.assertVisitAccess(visitId, user);
    if (visit.status !== 'COMPLETED') {
      throw new BadRequestException('VISIT_INVALID_STATE: inspection requires a completed visit');
    }
    if (user.role !== Role.WORKER) {
      throw new ForbiddenException('Only the assigned worker can submit the inspection');
    }
    if (visit.inspectionSubmittedAt) {
      throw new BadRequestException('INSPECTION_ALREADY_SUBMITTED');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.visit.update({
        where: { id: visitId },
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
    return updated;
  }

  async trackLocation(user: JwtPayload, jobId: string | undefined, dto: TrackLocationDto) {
    const cleanJobId =
      jobId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId)
        ? jobId
        : undefined;
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
