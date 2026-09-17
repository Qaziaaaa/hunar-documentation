import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { JobStateMachine } from './jobs.state-machine';
import { AvailableJobsQueryDto, CancelJobDto, CreateJobDto } from './jobs.validation';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { RealtimeService } from '../realtime/realtime.service';
import { JOB_EVENTS, userRoom } from './jobs.events';

export interface JobCardRow {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  area: string | null;
  status: JobStatus;
  suggestedVisitCharge: string | number | null;
  preferredVisitTime: Date | null;
  createdAt: Date;
  images: string[];
  voiceNoteUrl: string | null;
  offerCount: string | number;
  distanceKm: string | number | null;
}

export interface JobCard {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  address: string;
  city: string;
  area: string | null;
  status: JobStatus;
  suggestedVisitCharge: number | null;
  preferredVisitTime: Date | null;
  postedTime: string;
  hasMedia: boolean;
  images: string[];
  voiceNoteUrl: string | null;
  offerCount: number;
  distanceKm: number | null;
}

function mapJobCard(row: JobCardRow): JobCard {
  const images = Array.isArray(row.images) ? row.images : [];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    address: row.address,
    city: row.city,
    area: row.area,
    status: row.status,
    suggestedVisitCharge:
      row.suggestedVisitCharge != null ? Number(row.suggestedVisitCharge) : null,
    preferredVisitTime: row.preferredVisitTime,
    postedTime: new Date(row.createdAt).toISOString(),
    hasMedia: images.length > 0 || Boolean(row.voiceNoteUrl),
    images,
    voiceNoteUrl: row.voiceNoteUrl,
    offerCount: Number(row.offerCount ?? 0),
    distanceKm: row.distanceKm != null ? Number(row.distanceKm) : null,
  };
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly realtime: RealtimeService,
  ) {}

  private async syncLocation(jobId: string, longitude: number, latitude: number): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "ServiceRequest"
      SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      WHERE id = ${jobId}
    `;
  }

  async createJob(customerId: string, dto: CreateJobDto) {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id: dto.categoryId, isActive: true },
    });
    if (!category) {
      throw new BadRequestException('CATEGORY_NOT_FOUND: invalid or inactive category');
    }

    const job = await this.prisma.serviceRequest.create({
      data: {
        customerId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        images: dto.images ?? [],
        voiceNoteUrl: dto.voiceNoteUrl,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        city: dto.city,
        area: dto.area,
        urgency: dto.urgency ?? 'NORMAL',
        suggestedVisitCharge: dto.suggestedVisitCharge,
        preferredVisitTime: dto.preferredVisitTime ? new Date(dto.preferredVisitTime) : null,
        status: 'OPEN',
      },
    });

    await this.syncLocation(job.id, dto.longitude, dto.latitude);

    this.eventBus.emit('job.created', {
      jobId: job.id,
      customerId: job.customerId,
      categoryId: job.categoryId,
      latitude: job.latitude,
      longitude: job.longitude,
    });

    return job;
  }

  async getAvailableJobs(worker: JwtPayload, query: AvailableJobsQueryDto) {
    if (worker.role !== Role.WORKER) {
      throw new ForbiddenException('Only workers can view the nearby jobs feed');
    }
    const user = await this.prisma.user.findUnique({ where: { id: worker.sub } });
    if (!user?.isVerified) {
      throw new ForbiddenException('WORKER_NOT_VERIFIED: verify your profile before viewing jobs');
    }
    if (query.lat == null || query.lng == null) {
      throw new BadRequestException('lat and lng are required for PostGIS proximity matching');
    }

    const radiusMeters = (query.radiusKm ?? 10) * 1000;
    const { page, limit, skip } = normalizePage(query);

    const conditions: Prisma.Sql[] = [Prisma.sql`sr."status" IN ('OPEN', 'OFFERS_RECEIVED')`];
    conditions.push(Prisma.sql`
      ST_DWithin(
        ST_SetSRID(ST_MakePoint(sr."longitude", sr."latitude"), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
        ${radiusMeters}
      )
    `);
    if (query.categoryId) {
      conditions.push(Prisma.sql`sr."categoryId" = ${query.categoryId}`);
    }
    if (query.area) {
      conditions.push(Prisma.sql`sr."area" = ${query.area}`);
    }
    if (query.city) {
      conditions.push(Prisma.sql`sr."city" = ${query.city}`);
    }
    if (query.minCharge != null) {
      conditions.push(
        Prisma.sql`sr."suggestedVisitCharge" IS NOT NULL AND sr."suggestedVisitCharge" >= ${query.minCharge}`,
      );
    }
    if (query.maxCharge != null) {
      conditions.push(
        Prisma.sql`sr."suggestedVisitCharge" IS NOT NULL AND sr."suggestedVisitCharge" <= ${query.maxCharge}`,
      );
    }
    if (query.postedWithinMin) {
      conditions.push(
        Prisma.sql`sr."createdAt" >= NOW() - (${query.postedWithinMin} * INTERVAL '1 minute')`,
      );
    }
    if (query.hasNoOffers) {
      conditions.push(Prisma.sql`NOT EXISTS (SELECT 1 FROM "JobOffer" o WHERE o."jobId" = sr.id)`);
    }

    const where = Prisma.join(conditions, ' AND ');

    const rows = await this.prisma.$queryRaw<JobCardRow[]>(Prisma.sql`
      SELECT
        sr.id,
        sr.title,
        sr.description,
        sr."categoryId",
        c.name AS "categoryName",
        sr."latitude",
        sr."longitude",
        sr."address",
        sr."city",
        sr."area",
        sr."status",
        sr."suggestedVisitCharge",
        sr."preferredVisitTime",
        sr."createdAt",
        sr."images",
        sr."voiceNoteUrl",
        (SELECT COUNT(*) FROM "JobOffer" o WHERE o."jobId" = sr.id) AS "offerCount",
        ST_Distance(
          ST_SetSRID(ST_MakePoint(sr."longitude", sr."latitude"), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography
        ) / 1000.0 AS "distanceKm"
      FROM "ServiceRequest" sr
      JOIN "ServiceCategory" c ON c.id = sr."categoryId"
      WHERE ${where}
      ORDER BY "distanceKm" ASC, sr."createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `);

    const countRows = await this.prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM "ServiceRequest" sr
      WHERE ${where}
    `);
    const total = Number(countRows[0]?.total ?? 0);

    return toPageResult(rows.map(mapJobCard), total, page, limit);
  }

  async getJobDetail(jobId: string, user: JwtPayload, lat?: number, lng?: number) {
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
      include: {
        category: true,
        customer: { select: { id: true, name: true, phone: true } },
        offers: { select: { id: true, workerId: true, status: true, visitCharge: true } },
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    let distanceKm: number | null = null;
    if (lat != null && lng != null) {
      const distance = await this.prisma.$queryRaw<{ m: number }[]>`
        SELECT ST_Distance(
          ST_SetSRID(ST_MakePoint(${job.longitude}, ${job.latitude}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS m
      `;
      distanceKm = distance[0] ? Number(distance[0].m) / 1000 : null;
    }

    let myOffer = null;
    if (user.role === Role.WORKER) {
      myOffer = job.offers.find((o) => o.workerId === user.sub)
        ? {
            id: job.offers.find((o) => o.workerId === user.sub)!.id,
            status: job.offers.find((o) => o.workerId === user.sub)!.status,
          }
        : null;
    }

    const { offers, ...rest } = job;
    return {
      ...rest,
      distanceKm,
      offerCount: offers.length,
      myOffer,
    };
  }

  async cancelJob(jobId: string, user: JwtPayload, dto: CancelJobDto) {
    const job = await this.prisma.serviceRequest.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (['CANCELLED', 'COMPLETED', 'PAID', 'REVIEWED', 'DISPUTED'].includes(job.status)) {
      throw new BadRequestException(
        'JOB_INVALID_STATE: job cannot be cancelled in its current state',
      );
    }

    if (user.role === Role.WORKER) {
      if (job.selectedWorkerId !== user.sub) {
        throw new ForbiddenException('You are not the assigned worker for this job');
      }
      const preVisit = ['WORKER_ASSIGNED', 'VISIT_SCHEDULED'].includes(job.status);
      if (preVisit) {
        // Worker cancels before the visit → job returns to open; other offers remain valid.
        JobStateMachine.assertCanTransition(job.status, 'OPEN');
        const updated = await this.prisma.$transaction(async (tx) => {
          const j = await tx.serviceRequest.update({
            where: { id: jobId },
            data: { status: 'OPEN', selectedWorkerId: null, lockedVisitCharge: null },
          });
          await tx.jobOffer.updateMany({
            where: { jobId, workerId: job.selectedWorkerId },
            data: { status: 'REJECTED' },
          });
          // Restore previously auto-rejected pending offers so they remain valid on the reopened job.
          await tx.jobOffer.updateMany({
            where: { jobId, status: 'REJECTED', NOT: { workerId: job.selectedWorkerId } },
            data: { status: 'PENDING' },
          });
          return j;
        });
        this.eventBus.emit('job.statusChanged', {
          jobId,
          oldStatus: job.status,
          newStatus: updated.status,
        });
        this.realtime.emitToRoom(userRoom(job.customerId), JOB_EVENTS.jobStatusChanged, {
          jobId,
          oldStatus: job.status,
          newStatus: updated.status,
        });
        return updated;
      }
      // Worker cancels after arrival → reason required.
      if (
        job.status === 'VISIT_IN_PROGRESS' ||
        job.status === 'VISIT_COMPLETED' ||
        job.status === 'INSPECTION_DONE'
      ) {
        if (!dto.reason) {
          throw new BadRequestException('A cancellation reason is required after arrival');
        }
        JobStateMachine.assertCanTransition(job.status, 'CANCELLED');
        const updated = await this.prisma.serviceRequest.update({
          where: { id: jobId },
          data: { status: 'CANCELLED', cancelReason: dto.reason, cancelledAt: new Date() },
        });
        this.eventBus.emit('job.cancelled', { jobId, reason: dto.reason });
        this.realtime.emitToRoom(userRoom(job.customerId), JOB_EVENTS.jobCancelled, { jobId });
        return updated;
      }
      throw new BadRequestException('Worker cannot cancel the job in its current state');
    }

    if (user.role === Role.CUSTOMER) {
      if (job.customerId !== user.sub) {
        throw new ForbiddenException('You are not the owner of this job');
      }
      JobStateMachine.assertCanTransition(job.status, 'CANCELLED');
      const updated = await this.prisma.serviceRequest.update({
        where: { id: jobId },
        data: { status: 'CANCELLED', cancelReason: dto.reason, cancelledAt: new Date() },
      });
      this.eventBus.emit('job.cancelled', { jobId, reason: dto.reason });
      if (job.selectedWorkerId) {
        this.realtime.emitToRoom(userRoom(job.selectedWorkerId), JOB_EVENTS.jobCancelled, {
          jobId,
        });
      }
      return updated;
    }

    throw new ForbiddenException('Only the job owner or the assigned worker can cancel a job');
  }

  /** Validate + apply a state transition, emitting events. Reused by Offers/Visits/Repair modules. */
  async transitionJobState(jobId: string, to: JobStatus): Promise<{ newStatus: JobStatus }> {
    const job = await this.prisma.serviceRequest.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    JobStateMachine.assertCanTransition(job.status, to);
    const updated = await this.prisma.serviceRequest.update({
      where: { id: jobId },
      data: { status: to, completedAt: to === 'COMPLETED' ? new Date() : job.completedAt },
    });
    this.eventBus.emit('job.statusChanged', {
      jobId,
      oldStatus: job.status,
      newStatus: updated.status,
    });
    const recipients = [job.customerId];
    if (job.selectedWorkerId) {
      recipients.push(job.selectedWorkerId);
    }
    for (const userId of recipients) {
      this.realtime.emitToRoom(userRoom(userId), JOB_EVENTS.jobStatusChanged, {
        jobId,
        oldStatus: job.status,
        newStatus: updated.status,
      });
    }
    return { newStatus: updated.status };
  }
}
