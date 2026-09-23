import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma, Role, WorkerVerificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { JobStateMachine } from './jobs.state-machine';
import {
  AvailableJobsQueryDto,
  CancelJobDto,
  CreateJobDto,
  CustomerJobsQueryDto,
} from './jobs.validation';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { getWorkerProfileCompletion } from '../../common/helpers/worker-profile.util';
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

/**
 * Job statuses that count as "active" for an assigned worker: the job has moved
 * past the offer stage (worker selected) and has not reached a terminal state.
 * Everything from the chosen-worker/visit stage through the in-progress repair.
 */
const ACTIVE_JOB_STATUSES: JobStatus[] = [
  'WORKER_ASSIGNED',
  'VISIT_SCHEDULED',
  'VISIT_IN_PROGRESS',
  'VISIT_COMPLETED',
  'INSPECTION_DONE',
  'REPAIR_NEGOTIATING',
  'REPAIR_APPROVED',
  'IN_PROGRESS',
];

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

  async getCustomerJobs(customerId: string, query: CustomerJobsQueryDto) {
    const { page, limit, skip } = normalizePage(query);
    const where: Prisma.ServiceRequestWhereInput = {
      customerId,
      ...(query.status ? { status: query.status } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.serviceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { offers: true } },
        },
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);
    const items = rows.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      categoryId: j.categoryId,
      categoryName: j.category.name,
      address: j.address,
      city: j.city,
      area: j.area,
      suggestedVisitCharge: j.suggestedVisitCharge != null ? Number(j.suggestedVisitCharge) : null,
      preferredVisitTime: j.preferredVisitTime,
      offerCount: j._count.offers,
      images: j.images,
      voiceNoteUrl: j.voiceNoteUrl,
      createdAt: j.createdAt,
    }));
    return toPageResult(items, total, page, limit);
  }

  async getAvailableJobs(worker: JwtPayload, query: AvailableJobsQueryDto) {
    if (worker.role !== Role.WORKER) {
      throw new ForbiddenException('Only workers can view the nearby jobs feed');
    }
    const user = await this.prisma.user.findUnique({ where: { id: worker.sub } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const [profile, serviceAreaCount, cnicDocuments] = await Promise.all([
      this.prisma.workerProfile.findUnique({ where: { userId: worker.sub } }),
      this.prisma.serviceArea.count({ where: { userId: worker.sub } }),
      this.prisma.verificationDocument.findMany({
        where: { userId: worker.sub, type: { in: ['CNIC_FRONT', 'CNIC_BACK'] } },
        select: { type: true, url: true },
      }),
    ]);
    if (
      !user.isVerified ||
      !profile ||
      profile.verificationStatus !== WorkerVerificationStatus.APPROVED
    ) {
      throw new ForbiddenException('WORKER_NOT_VERIFIED: verify your profile before viewing jobs');
    }
    const cnicFront = cnicDocuments.find((d) => d.type === 'CNIC_FRONT');
    const cnicBack = cnicDocuments.find((d) => d.type === 'CNIC_BACK');
    const completion = getWorkerProfileCompletion({
      name: user.name,
      avatarUrl: user.avatarUrl,
      skills: profile.skills,
      experienceYears: profile.experienceYears,
      bio: profile.bio,
      serviceAreaCount,
      cnicFrontUrl: cnicFront?.url ?? null,
      cnicBackUrl: cnicBack?.url ?? null,
    });
    if (!completion.complete) {
      throw new ForbiddenException(
        `WORKER_PROFILE_INCOMPLETE: complete your profile (missing ${completion.missingSteps.join(
          ', ',
        )}) before viewing jobs`,
      );
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

  /** Tasks 23 — active jobs for the assigned worker (all non-terminal states). */
  async getActiveJobs(workerId: string, query: CustomerJobsQueryDto = {}) {
    const { page, limit, skip } = normalizePage(query);
    const where: Prisma.ServiceRequestWhereInput = {
      selectedWorkerId: workerId,
      status: { in: ACTIVE_JOB_STATUSES },
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.serviceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, phone: true } },
          visits: {
            where: { workerId },
            orderBy: { scheduledDate: 'asc' },
            take: 1,
            select: { id: true, status: true, scheduledDate: true },
          },
          _count: { select: { offers: true } },
        },
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);
    const items = rows.map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      status: j.status,
      categoryId: j.categoryId,
      categoryName: j.category.name,
      address: j.address,
      city: j.city,
      area: j.area,
      suggestedVisitCharge:
        j.suggestedVisitCharge != null ? Number(j.suggestedVisitCharge) : null,
      lockedVisitCharge: j.lockedVisitCharge != null ? Number(j.lockedVisitCharge) : null,
      preferredVisitTime: j.preferredVisitTime,
      images: j.images,
      voiceNoteUrl: j.voiceNoteUrl,
      nextVisit: j.visits[0] ?? null,
      customer: j.customer,
      offerCount: j._count.offers,
      createdAt: j.createdAt,
    }));
    return toPageResult(items, total, page, limit);
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
