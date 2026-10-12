
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma, Role, Urgency, WorkerVerificationStatus } from '@prisma/client';
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
import { expandSkillNames, getWorkerProfileCompletion } from '../../common/helpers/worker-profile.util';
import { sanitizeToAreaOrSector } from '../../common/helpers/location.util';
import { RealtimeService } from '../realtime/realtime.service';
import { JOB_EVENTS, userRoom } from './jobs.events';
import { generateUniqueOrderCode } from '../../common/helpers/order-code.util';

export interface JobCardRow {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  customerId: string;
  customerName: string | null;
  customerAvatarUrl: string | null;
  customerRating?: number | null;
  customerReviewCount?: number | null;
  customerTotalOrders?: number | null;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  area: string | null;
  status: JobStatus;
  urgency: Urgency;
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
  customerId: string;
  customer?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    rating?: number;
    reviewCount?: number;
    totalOrders?: number;
  };
  address: string;
  city: string;
  area: string | null;
  status: JobStatus;
  urgency: Urgency;
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
  const areaSector = sanitizeToAreaOrSector({
    area: row.area,
    address: row.address,
    city: row.city,
  });
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    customerId: row.customerId,
    customer: {
      id: row.customerId,
      name: row.customerName,
      avatarUrl: row.customerAvatarUrl,
      rating: row.customerRating != null ? Number(row.customerRating) : null,
      reviewCount: row.customerReviewCount != null ? Number(row.customerReviewCount) : 0,
      totalOrders: row.customerTotalOrders != null ? Number(row.customerTotalOrders) : 0,
    },
    address: areaSector,
    city: row.city,
    area: areaSector,
    status: row.status,
    urgency: row.urgency,
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
  ) { }

  async createJob(customerId: string, dto: CreateJobDto) {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id: dto.categoryId, isActive: true },
    });
    if (!category) {
      throw new BadRequestException('CATEGORY_NOT_FOUND: invalid or inactive category');
    }

    const visitCharge =
      dto.suggestedVisitCharge != null
        ? dto.suggestedVisitCharge
        : category.defaultVisitCharge != null
          ? Number(category.defaultVisitCharge)
          : null;

    if (visitCharge == null) {
      throw new BadRequestException(
        `Visiting fee is not configured for category "${category.name}". Please contact support.`,
      );
    }

    const orderCode = await generateUniqueOrderCode(this.prisma);

    const job = await this.prisma.serviceRequest.create({
      data: {
        id: orderCode,
        customerId,
        categoryId: category.id,
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
        suggestedVisitCharge: visitCharge,
        preferredVisitTime: dto.preferredVisitTime ? new Date(dto.preferredVisitTime) : null,
        status: 'OPEN',
      },
    });

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
      latitude: j.latitude,
      longitude: j.longitude,
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
    const skipWorkerRelevanceFilters = process.env.ALLOW_WORKER_JOB_TEST_MODE === 'true';
    const [profile, serviceAreaCount, cnicDocuments] = await Promise.all([
      this.prisma.workerProfile.findUnique({ where: { userId: worker.sub } }),
      this.prisma.serviceArea.count({ where: { userId: worker.sub } }),
      this.prisma.verificationDocument.findMany({
        where: { userId: worker.sub, type: { in: ['CNIC_FRONT', 'CNIC_BACK'] } },
        select: { type: true, url: true },
      }),
    ]);
    if (!skipWorkerRelevanceFilters) {
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
    }
    const workerLat = query.lat ?? 34.0045;
    const workerLng = query.lng ?? 71.477;
    const radiusMeters = (query.radiusKm ?? 10) * 1000;
    const workerRadiusKm = Number(profile?.serviceRadiusKm ?? 10);
    const { page, limit, skip } = normalizePage(query);

    const halfRadiusDeg = radiusMeters / 111000.0;
    const latOffset = halfRadiusDeg;
    const lngOffset = halfRadiusDeg / Math.max(Math.cos(workerLat * Math.PI / 180.0), 0.01);

    const conditions: Prisma.Sql[] = [Prisma.sql`sr."status" IN ('OPEN', 'OFFERS_RECEIVED')`];
    conditions.push(Prisma.sql`
      sr."latitude" BETWEEN ${workerLat - latOffset} AND ${workerLat + latOffset}
      AND sr."longitude" BETWEEN ${workerLng - lngOffset} AND ${workerLng + lngOffset}
    `);
    if (!skipWorkerRelevanceFilters) {
      if (profile && profile.skills.length > 0) {
        const searchNames = expandSkillNames(profile.skills);
        const matchingCategories = await this.prisma.serviceCategory.findMany({
          where: {
            OR: [
              { id: { in: profile.skills } },
              { name: { in: searchNames } },
            ],
            isActive: true,
          },
          select: { id: true },
        });
        const categoryIds = matchingCategories.map((c) => c.id);
        for (const s of profile.skills) {
          if (!categoryIds.includes(s) && (s.startsWith('seed-category-') || s.length > 20)) {
            categoryIds.push(s);
          }
        }
        if (categoryIds.length > 0) {
          conditions.push(Prisma.sql`sr."categoryId" = ANY (${categoryIds})`);
        } else {
          conditions.push(Prisma.sql`FALSE`);
        }
      } else {
        conditions.push(Prisma.sql`FALSE`);
      }
      conditions.push(Prisma.sql`
        EXISTS (
          SELECT 1
          FROM "ServiceArea" sa
          WHERE sa."userId" = ${worker.sub}
            AND (
              3956 * 2 * ASIN(
                SQRT(
                  POWER(SIN((sa."latitude" - ${query.lat}) * PI() / 180.0 / 2), 2) +
                  COS(sa."latitude" * PI() / 180.0) * COS(${query.lat} * PI() / 180.0) *
                  POWER(SIN((sa."longitude" - ${query.lng}) * PI() / 180.0 / 2), 2)
                )
              )
            ) <= ${workerRadiusKm}
        )
      `);
    }
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
        sr."customerId",
        u.name AS "customerName",
        u."avatarUrl" AS "customerAvatarUrl",
        (
          SELECT ROUND(AVG(r.rating)::numeric, 1)::float FROM "Review" r WHERE r."revieweeId" = sr."customerId"
        ) AS "customerRating",
        COALESCE(
          (SELECT COUNT(*)::int FROM "Review" r WHERE r."revieweeId" = sr."customerId"),
          0
        ) AS "customerReviewCount",
        COALESCE(
          (SELECT COUNT(*)::int FROM "ServiceRequest" s_total WHERE s_total."customerId" = sr."customerId"),
          0
        ) AS "customerTotalOrders",
        sr."latitude",
        sr."longitude",
        sr."address",
        sr."city",
        sr."area",
        sr."status",
        sr."urgency",
        sr."suggestedVisitCharge",
        sr."preferredVisitTime",
        sr."createdAt",
        sr."images",
        sr."voiceNoteUrl",
        (SELECT COUNT(*) FROM "JobOffer" o WHERE o."jobId" = sr.id) AS "offerCount",
        (
      3956 * 2 * ASIN(
        SQRT(
          POWER(SIN((sr."latitude" - ${query.lat}) * PI() / 180.0 / 2), 2) +
          COS(sr."latitude" * PI() / 180.0) * COS(${query.lat} * PI() / 180.0) *
          POWER(SIN((sr."longitude" - ${query.lng}) * PI() / 180.0 / 2), 2)
        )
      )
    ) AS "distanceKm"
  FROM "ServiceRequest" sr
  JOIN "ServiceCategory" c ON c.id = sr."categoryId"
  JOIN "User" u ON u.id = sr."customerId"
  WHERE ${where}
  ORDER BY sr."createdAt" DESC
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
            select: { id: true, status: true, scheduledDate: true, repairEstimate: true },
          },
          repairs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, amount: true, lockedAmount: true, status: true },
          },
          _count: { select: { offers: true } },
        },
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);
    const items = rows.map((j) => {
      const repairCost =
        j.repairs?.[0]?.lockedAmount != null
          ? Number(j.repairs[0].lockedAmount)
          : j.repairs?.[0]?.amount != null
          ? Number(j.repairs[0].amount)
          : j.visits?.[0]?.repairEstimate != null
          ? Number(j.visits[0].repairEstimate)
          : null;

      return {
        id: j.id,
        title: j.title,
        description: j.description,
        status: j.status,
        categoryId: j.categoryId,
        categoryName: j.category?.name,
        address: j.address,
        city: j.city,
        area: j.area,
        latitude: j.latitude,
        longitude: j.longitude,
        suggestedVisitCharge:
          j.suggestedVisitCharge != null ? Number(j.suggestedVisitCharge) : null,
        lockedVisitCharge: j.lockedVisitCharge != null ? Number(j.lockedVisitCharge) : null,
        preferredVisitTime: j.preferredVisitTime,
        images: j.images,
        voiceNoteUrl: j.voiceNoteUrl,
        nextVisit: j.visits?.[0] ?? null,
        repairEstimate: repairCost,
        repairCharge: repairCost,
        customer: j.customer,
        offerCount: j._count?.offers ?? 0,
        createdAt: j.createdAt,
      };
    });
    return toPageResult(items, total, page, limit);
  }

  /** Completed and terminal history jobs for the assigned worker. */
  async getHistoryJobs(workerId: string, query: CustomerJobsQueryDto = {}) {
    const { page, limit, skip } = normalizePage(query);
    const where: Prisma.ServiceRequestWhereInput = {
      selectedWorkerId: workerId,
      status: { in: ['COMPLETED', 'PAID', 'REVIEWED', 'CANCELLED'] },
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.serviceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, nameUrdu: true } },
          customer: { select: { id: true, name: true, phone: true } },
          reviews: {
            where: { isVisible: true },
            select: { rating: true, comment: true, createdAt: true },
            take: 1,
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
      urgency: j.urgency,
      categoryId: j.categoryId,
      categoryName: j.category?.name ?? 'General',
      categoryUrdu: j.category?.nameUrdu ?? undefined,
      address: j.address,
      city: j.city,
      area: j.area,
      latitude: j.latitude,
      longitude: j.longitude,
      suggestedVisitCharge:
        j.suggestedVisitCharge != null ? Number(j.suggestedVisitCharge) : null,
      lockedVisitCharge: j.lockedVisitCharge != null ? Number(j.lockedVisitCharge) : null,
      preferredVisitTime: j.preferredVisitTime,
      images: j.images,
      voiceNoteUrl: j.voiceNoteUrl,
      customer: j.customer,
      customerReview: j.reviews?.[0]
        ? {
            rating: j.reviews[0].rating,
            comment: j.reviews[0].comment ?? '',
            date: j.reviews[0].createdAt,
          }
        : null,
      offerCount: j._count.offers,
      createdAt: j.createdAt,
      completedAt: j.completedAt,
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
        visits: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            scheduledDate: true,
            repairEstimate: true,
            diagnosis: true,
            inspectionPhotos: true,
            estimatedRepairTimeMin: true,
            inspectionSubmittedAt: true,
          },
        },
        repairs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, amount: true, lockedAmount: true, status: true },
        },
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    let distanceKm: number | null = null;
    if (lat != null && lng != null) {
      const distance = await this.prisma.$queryRaw<{ m: number }[]>`
        SELECT 3956 * 2 * ASIN(
          SQRT(
            POWER(SIN((${job.latitude} - ${lat}) * PI() / 180.0 / 2), 2) +
            COS(${job.latitude} * PI() / 180.0) * COS(${lat} * PI() / 180.0) *
            POWER(SIN((${job.longitude} - ${lng}) * PI() / 180.0 / 2), 2)
          )
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

    const resolvedRepairCharge =
      job.repairs?.[0]?.lockedAmount != null
        ? Number(job.repairs[0].lockedAmount)
        : job.repairs?.[0]?.amount != null
        ? Number(job.repairs[0].amount)
        : job.visits?.[0]?.repairEstimate != null
        ? Number(job.visits[0].repairEstimate)
        : null;

    const { offers, ...rest } = job;

    const isAssignedWorker = user.role === Role.WORKER && job.selectedWorkerId === user.sub;
    const isOwnerCustomer = user.role === Role.CUSTOMER && job.customerId === user.sub;
    const isAdmin = user.role === Role.ADMIN;
    const canSeeFullAddress = isAssignedWorker || isOwnerCustomer || isAdmin;

    if (!canSeeFullAddress) {
      const areaSector = sanitizeToAreaOrSector({
        area: job.area,
        address: job.address,
        city: job.city,
      });
      return {
        ...rest,
        repairCharge: resolvedRepairCharge,
        repairEstimate: resolvedRepairCharge,
        address: areaSector,
        area: areaSector,
        latitude: 0,
        longitude: 0,
        customer: job.customer
          ? {
              id: job.customer.id,
              name: job.customer.name,
              phone: null,
            }
          : job.customer,
        distanceKm,
        offerCount: offers.length,
        myOffer,
      };
    }

    return {
      ...rest,
      repairCharge: resolvedRepairCharge,
      repairEstimate: resolvedRepairCharge,
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

  /** Complete a job, finishing any active repairs and advancing status to COMPLETED. */
  async completeJob(jobId: string, user: JwtPayload): Promise<{ newStatus: JobStatus; message: string }> {
    const job = await this.prisma.serviceRequest.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.selectedWorkerId !== user.sub && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only the assigned worker or admin can complete this job');
    }

    // Complete active approved repairs for this job.
    // If a repair was not accepted by the customer (e.g. PROPOSED or COUNTERED),
    // it was not approved, so mark it REJECTED and do not emit repair.completed.
    const activeRepair = await this.prisma.repair.findFirst({
      where: { jobId, status: { in: ['PROPOSED', 'COUNTERED', 'ACCEPTED'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (activeRepair) {
      if (activeRepair.status === 'ACCEPTED') {
        await this.prisma.repair.update({
          where: { id: activeRepair.id },
          data: {
            startedAt: activeRepair.startedAt ?? new Date(),
            completedAt: new Date(),
          },
        });
        this.eventBus.emit('repair.completed', { repairId: activeRepair.id, jobId });
      } else {
        // Customer never approved the repair quote; mark it REJECTED
        await this.prisma.repair.update({
          where: { id: activeRepair.id },
          data: {
            status: 'REJECTED',
          },
        });
      }
    }

    const result = await this.transitionJobState(jobId, JobStatus.COMPLETED);
    return { ...result, message: 'Job completed successfully' };
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

  async getCategories() {
    const list = await this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return list.map((c) => {
      const fee = c.defaultVisitCharge != null ? Number(c.defaultVisitCharge) : null;
      return {
        ...c,
        defaultVisitCharge: fee,
        suggestedFee: fee,
      };
    });
  }

  async createDispute(userId: string, dto: { jobId: string; type?: string; description: string; evidence?: any }) {
    const job = await this.prisma.serviceRequest.findUnique({ where: { id: dto.jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.customerId !== userId && job.selectedWorkerId !== userId) {
      throw new BadRequestException('You are not an authorized participant in this job');
    }
    const respondentId = job.customerId === userId ? (job.selectedWorkerId || userId) : job.customerId;
    const validTypes = ['PAYMENT', 'SERVICE_QUALITY', 'NO_SHOW', 'PRICE_CHANGE', 'OTHER'];
    const disputeType = validTypes.includes(dto.type?.toUpperCase() ?? '') ? (dto.type?.toUpperCase() as any) : 'OTHER';

    const dispute = await this.prisma.dispute.create({
      data: {
        jobId: job.id,
        reporterId: userId,
        respondentId,
        type: disputeType,
        description: dto.description,
        evidence: dto.evidence ?? null,
        status: 'OPEN',
      },
    });

    this.eventBus.emit('dispute.created', {
      disputeId: dispute.id,
      jobId: job.id,
      reporterId: userId,
    });

    return {
      success: true,
      id: dispute.id,
      caseNumber: `CASE-${dispute.id.slice(0, 8).toUpperCase()}`,
      dispute,
    };
  }

  async getMyDisputes(userId: string) {
    return this.prisma.dispute.findMany({
      where: {
        OR: [{ reporterId: userId }, { respondentId: userId }],
      },
      include: {
        job: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}


