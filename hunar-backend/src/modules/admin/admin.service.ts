import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { CommissionStatus, JobStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RealtimeService } from '../realtime/realtime.service';
import { JOB_EVENTS, userRoom } from '../jobs/jobs.events';
import { JobStateMachine } from '../jobs/jobs.state-machine';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { AUDIT_ACTIONS, AuditService } from './audit.service';
import {
  AdminUserListQueryDto,
  AdminJobListQueryDto,
  AdminWorkerListQueryDto,
  AdminTransactionListQueryDto,
} from './admin.validation';

// Job states that mean the customer has paid for the (locked) visit charge.
const PAID_JOB_STATUSES: JobStatus[] = [JobStatus.COMPLETED, JobStatus.PAID, JobStatus.REVIEWED];

const LIST_USER_SELECT = {
  id: true,
  phone: true,
  name: true,
  avatarUrl: true,
  isActive: true,
  isVerified: true,
  createdAt: true,
  workerProfile: {
    select: {
      verificationStatus: true,
      experienceYears: true,
      skills: true,
      isAvailable: true,
    },
  },
  _count: { select: { customerJobs: true, offers: true } },
} satisfies Prisma.UserSelect;

type AdminUserRow = Prisma.UserGetPayload<{ select: typeof LIST_USER_SELECT }>;

const LIST_JOB_SELECT = {
  id: true,
  title: true,
  description: true,
  images: true,
  status: true,
  urgency: true,
  city: true,
  area: true,
  suggestedVisitCharge: true,
  lockedVisitCharge: true,
  cancelReason: true,
  cancelledAt: true,
  completedAt: true,
  createdAt: true,
  category: { select: { id: true, name: true, nameUrdu: true } },
  customer: { select: { id: true, name: true, phone: true } },
  selectedWorker: { select: { id: true, name: true, phone: true } },
} satisfies Prisma.ServiceRequestSelect;

type AdminJobRow = Prisma.ServiceRequestGetPayload<{ select: typeof LIST_JOB_SELECT }>;

// Admin-only transactions feed (Admin flow §8 — Step F). Read/oversight, never moves money.
const TRANSACTION_SELECT = {
  id: true,
  type: true,
  amount: true,
  balanceAfter: true,
  referenceType: true,
  referenceId: true,
  note: true,
  createdAt: true,
  user: { select: { id: true, name: true, phone: true } },
} satisfies Prisma.WalletLedgerSelect;

type AdminTransactionRow = Prisma.WalletLedgerGetPayload<{ select: typeof TRANSACTION_SELECT }>;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Optional() private readonly eventBus?: EventBusService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  // ----- Customers -----

  listCustomers(query: AdminUserListQueryDto) {
    return this.listUsers(Role.CUSTOMER, query);
  }

  async getCustomerDetail(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: Role.CUSTOMER },
      select: {
        id: true,
        phone: true,
        name: true,
        avatarUrl: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { customerJobs: true } },
      },
    });
    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    const [jobs, reviews] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          status: true,
          urgency: true,
          city: true,
          area: true,
          suggestedVisitCharge: true,
          lockedVisitCharge: true,
          selectedWorkerId: true,
          createdAt: true,
          completedAt: true,
          cancelledAt: true,
          category: { select: { id: true, name: true, nameUrdu: true } },
        },
      }),
      this.prisma.review.findMany({
        where: { revieweeId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          jobId: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: { select: { id: true, name: true } },
        },
      }),
    ]);

    const payments = jobs
      .filter((job) => PAID_JOB_STATUSES.includes(job.status))
      .map((job) => ({
        jobId: job.id,
        title: job.title,
        amount: job.lockedVisitCharge ?? job.suggestedVisitCharge ?? null,
        status: job.status,
        paidAt: job.completedAt ?? job.createdAt,
      }));

    return {
      profile: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      stats: {
        jobsCount: user._count.customerJobs,
        reviewsCount: reviews.length,
        ratingAverage: this.averageRating(reviews),
        totalPaid: Number(
          payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0).toFixed(2),
        ),
      },
      jobs,
      payments,
      reviews,
    };
  }

  suspendCustomer(id: string, actor: JwtPayload, reason: string) {
    return this.setUserStatus(Role.CUSTOMER, id, false, actor, reason);
  }

  reactivateCustomer(id: string, actor: JwtPayload) {
    return this.setUserStatus(Role.CUSTOMER, id, true, actor);
  }

  // ----- Workers -----

  listWorkers(query: AdminWorkerListQueryDto) {
    return this.listUsers(Role.WORKER, query, query.verificationStatus);
  }

  async getWorkerDetail(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: Role.WORKER },
      select: {
        id: true,
        phone: true,
        name: true,
        avatarUrl: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        workerProfile: true,
        serviceAreas: { orderBy: { createdAt: 'asc' } },
        verificationDocuments: { orderBy: { uploadedAt: 'asc' } },
      },
    });
    if (!user) {
      throw new NotFoundException('Worker not found');
    }

    const skillIds = user.workerProfile?.skills ?? [];
    const [skills, jobs, earningsAggregate, commissions, reviews] = await Promise.all([
      skillIds.length
        ? this.prisma.serviceCategory.findMany({
            where: { id: { in: skillIds } },
            select: { id: true, name: true, nameUrdu: true },
          })
        : Promise.resolve([]),
      this.prisma.serviceRequest.findMany({
        where: { OR: [{ selectedWorkerId: id }, { offers: { some: { workerId: id } } }] },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          status: true,
          city: true,
          area: true,
          suggestedVisitCharge: true,
          lockedVisitCharge: true,
          createdAt: true,
          completedAt: true,
          category: { select: { id: true, name: true } },
        },
      }),
      this.prisma.commission.aggregate({
        where: {
          workerId: id,
          status: { in: [CommissionStatus.RECEIVED, CommissionStatus.VERIFIED] },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.commission.findMany({
        where: { workerId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          jobId: true,
          amount: true,
          status: true,
          commissionRate: true,
          visitCharge: true,
          createdAt: true,
          verifiedAt: true,
        },
      }),
      this.prisma.review.findMany({
        where: { revieweeId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          jobId: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      profile: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        skills,
        experienceYears: user.workerProfile?.experienceYears ?? null,
        bio: user.workerProfile?.bio ?? null,
        isAvailable: user.workerProfile?.isAvailable ?? false,
        serviceRadiusKm: user.workerProfile?.serviceRadiusKm ?? null,
        verificationStatus: user.workerProfile?.verificationStatus ?? null,
        rejectionReason: user.workerProfile?.rejectionReason ?? null,
        adminNote: user.workerProfile?.adminNote ?? null,
        submittedAt: user.workerProfile?.submittedAt ?? null,
        verifiedAt: user.workerProfile?.verifiedAt ?? null,
      },
      documents: user.verificationDocuments,
      serviceAreas: user.serviceAreas,
      jobs,
      earnings: {
        total: earningsAggregate._sum.amount ?? 0,
        count: earningsAggregate._count._all,
        commissions,
      },
      reviews,
      stats: {
        jobsCount: jobs.length,
        reviewsCount: reviews.length,
        ratingAverage: this.averageRating(reviews),
      },
    };
  }

  suspendWorker(id: string, actor: JwtPayload, reason: string) {
    return this.setUserStatus(Role.WORKER, id, false, actor, reason);
  }

  reactivateWorker(id: string, actor: JwtPayload) {
    return this.setUserStatus(Role.WORKER, id, true, actor);
  }

  // ----- Shared internals -----

  // Job directory with search, status, category, city/area and date-range filters.
  async listJobs(query: AdminJobListQueryDto) {
    const { page, limit, skip } = normalizePage(query);

    const where: Prisma.ServiceRequestWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.city ? { city: query.city } : {}),
      ...(query.area ? { area: query.area } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { customer: { is: { name: { contains: query.search, mode: 'insensitive' } } } },
              { customer: { is: { phone: { contains: query.search } } } },
            ],
          }
        : {}),
    };

    const [jobs, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: LIST_JOB_SELECT,
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);

    const items = jobs.map((job: AdminJobRow) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      images: job.images,
      status: job.status,
      urgency: job.urgency,
      city: job.city,
      area: job.area,
      suggestedVisitCharge: job.suggestedVisitCharge,
      lockedVisitCharge: job.lockedVisitCharge,
      category: job.category,
      customer: job.customer,
      worker: job.selectedWorker,
      cancelReason: job.cancelReason,
      cancelledAt: job.cancelledAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
    }));

    return toPageResult(items, total, page, limit);
  }

  // Wallet ledger feed for admins (Admin flow §8 — Step F): type, worker search and
  // date-range filters, sorted newest-first. Amounts are signed (+credit / −debit).
  async listTransactions(query: AdminTransactionListQueryDto) {
    const { page, limit, skip } = normalizePage(query);

    const where: Prisma.WalletLedgerWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            user: {
              is: {
                OR: [
                  { name: { contains: query.search, mode: 'insensitive' } },
                  { phone: { contains: query.search } },
                ],
              },
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.walletLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: TRANSACTION_SELECT,
      }),
      this.prisma.walletLedger.count({ where }),
    ]);

    const items = rows.map((row: AdminTransactionRow) => ({
      id: row.id,
      type: row.type,
      amount: row.amount,
      balanceAfter: row.balanceAfter,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      note: row.note,
      worker: row.user,
      timestamp: row.createdAt,
    }));

    return toPageResult(items, total, page, limit);
  }

  // Full job detail with its entire audit history (Admin flow §7.2):
  // offers, visits, repairs + revisions, commission, review, payments and a merged timeline.
  async getJobDetail(id: string) {
    const job = await this.prisma.serviceRequest.findFirst({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        images: true,
        voiceNoteUrl: true,
        status: true,
        urgency: true,
        city: true,
        area: true,
        address: true,
        suggestedVisitCharge: true,
        lockedVisitCharge: true,
        preferredVisitTime: true,
        cancelReason: true,
        cancelledAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true, nameUrdu: true } },
        customer: { select: { id: true, name: true, phone: true } },
        selectedWorker: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const [offers, visits, repairs, commission, reviews] = await Promise.all([
      this.prisma.jobOffer.findMany({
        where: { jobId: id },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          workerId: true,
          visitCharge: true,
          message: true,
          status: true,
          negotiationRound: true,
          negotiationHistory: true,
          lockedAt: true,
          createdAt: true,
          updatedAt: true,
          worker: { select: { id: true, name: true, phone: true } },
        },
      }),
      this.prisma.visit.findMany({
        where: { jobId: id },
        orderBy: { scheduledDate: 'asc' },
        select: {
          id: true,
          workerId: true,
          scheduledDate: true,
          actualDate: true,
          status: true,
          diagnosis: true,
          repairPlan: true,
          repairEstimate: true,
          estimatedRepairTimeMin: true,
          inspectionSubmittedAt: true,
          createdAt: true,
          worker: { select: { id: true, name: true, phone: true } },
        },
      }),
      this.prisma.repair.findMany({
        where: { jobId: id },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          visitId: true,
          workerId: true,
          description: true,
          amount: true,
          itemsBreakdown: true,
          status: true,
          negotiationRound: true,
          lockedAmount: true,
          lockedAt: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          worker: { select: { id: true, name: true, phone: true } },
          revisions: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              proposedAmount: true,
              reason: true,
              status: true,
              requestedBy: true,
              createdAt: true,
              decidedAt: true,
            },
          },
        },
      }),
      this.prisma.commission.findFirst({
        where: { jobId: id },
        select: {
          id: true,
          workerId: true,
          visitCharge: true,
          commissionRate: true,
          amount: true,
          status: true,
          screenshotUrl: true,
          paidAt: true,
          verifiedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.review.findMany({
        where: { jobId: id },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          reviewerId: true,
          revieweeId: true,
          rating: true,
          comment: true,
          isVisible: true,
          createdAt: true,
          reviewer: { select: { id: true, name: true } },
          reviewee: { select: { id: true, name: true } },
        },
      }),
    ]);

    const payments = PAID_JOB_STATUSES.includes(job.status)
      ? [
          {
            jobId: job.id,
            amount: job.lockedVisitCharge ?? job.suggestedVisitCharge ?? null,
            status: job.status,
            paidAt: job.completedAt ?? job.createdAt,
          },
        ]
      : [];

    return {
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        images: job.images,
        voiceNoteUrl: job.voiceNoteUrl,
        status: job.status,
        urgency: job.urgency,
        city: job.city,
        area: job.area,
        address: job.address,
        suggestedVisitCharge: job.suggestedVisitCharge,
        lockedVisitCharge: job.lockedVisitCharge,
        preferredVisitTime: job.preferredVisitTime,
        cancelReason: job.cancelReason,
        cancelledAt: job.cancelledAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        category: job.category,
        customer: job.customer,
        worker: job.selectedWorker,
      },
      timeline: this.buildJobTimeline({
        job,
        offers,
        visits,
        repairs,
        commission,
        reviews,
      }),
      offers,
      visits,
      repairs,
      commission,
      reviews,
      payments,
    };
  }

  // Admin force-cancel a job. Mandatory reason, state-machine check, audit trail, and both
  // parties (customer + assigned worker) are notified in realtime (Admin flow §7 / rules 11, 14).
  async forceCancelJob(id: string, actor: JwtPayload, reason: string) {
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        customerId: true,
        selectedWorkerId: true,
        status: true,
        title: true,
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    JobStateMachine.assertCanTransition(job.status, JobStatus.CANCELLED);

    const updated = await this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.serviceRequest.update({
        where: { id },
        data: { status: JobStatus.CANCELLED, cancelReason: reason, cancelledAt: new Date() },
        select: { id: true, status: true, cancelReason: true, cancelledAt: true },
      });

      await this.audit.record(
        {
          actorId: actor.sub,
          actorRole: actor.role,
          action: AUDIT_ACTIONS.JOB_FORCE_CANCELLED,
          targetType: 'SERVICE_REQUEST',
          targetId: id,
          reason,
          metadata: { jobTitle: job.title },
        },
        tx,
      );

      return cancelled;
    });

    this.eventBus.emit('job.cancelled', { jobId: id, reason });
    const recipients = job.selectedWorkerId
      ? [job.customerId, job.selectedWorkerId]
      : [job.customerId];
    recipients.forEach((userId) => {
      this.realtime.emitToRoom(userRoom(userId), JOB_EVENTS.jobCancelled, { jobId: id });
    });

    return updated;
  }

  private async listUsers(
    role: Role,
    query: AdminUserListQueryDto,
    verificationStatus?: AdminWorkerListQueryDto['verificationStatus'],
  ) {
    const { page, limit, skip } = normalizePage(query);

    const where: Prisma.UserWhereInput = {
      role,
      ...(query.status ? { isActive: query.status === 'active' } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
      ...(verificationStatus ? { workerProfile: { is: { verificationStatus } } } : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: LIST_USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    const items = users.map((user: AdminUserRow) => ({
      id: user.id,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      jobsCount: role === Role.WORKER ? user._count.offers : user._count.customerJobs,
      verificationStatus: user.workerProfile?.verificationStatus ?? null,
      experienceYears: user.workerProfile?.experienceYears ?? null,
      skills: user.workerProfile?.skills ?? [],
      isAvailable: user.workerProfile?.isAvailable ?? false,
    }));

    return toPageResult(items, total, page, limit);
  }

  // Suspend/reactivate a user in a specific role. Suspension always states a reason and is audit-logged.
  private async setUserStatus(
    role: Role,
    id: string,
    activate: boolean,
    actor: JwtPayload,
    reason?: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, role },
      select: { id: true, phone: true, name: true, isActive: true },
    });
    if (!user) {
      throw new NotFoundException(
        role === Role.CUSTOMER ? 'Customer not found' : 'Worker not found',
      );
    }
    if (user.isActive === activate) {
      throw new BadRequestException(
        activate ? 'Account is already active' : 'Account is already suspended',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { isActive: activate },
        select: { id: true, isActive: true, updatedAt: true },
      });

      await this.audit.record(
        {
          actorId: actor.sub,
          actorRole: actor.role,
          action: activate ? AUDIT_ACTIONS.USER_REACTIVATED : AUDIT_ACTIONS.USER_SUSPENDED,
          targetType: role,
          targetId: id,
          reason: activate ? null : (reason ?? null),
          metadata: { phone: user.phone, name: user.name },
        },
        tx,
      );

      return { id: updated.id, role, isActive: updated.isActive, updatedAt: updated.updatedAt };
    });
  }

  private averageRating(reviews: Array<{ rating: number }>): number | null {
    if (reviews.length === 0) {
      return null;
    }
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / reviews.length).toFixed(2));
  }

  // Merges every job-lifecycle event into one chronological audit timeline (§7.2),
  // used by admins as the record of truth when resolving a dispute.
  private buildJobTimeline(input: {
    job: {
      createdAt: Date;
      completedAt: Date | null;
      cancelledAt: Date | null;
      cancelReason: string | null;
      selectedWorker?: { id: string; name: string } | null;
    };
    offers: Array<{
      createdAt: Date;
      visitCharge: { toNumber(): number } | number | string;
      status: string;
      worker?: { id: string; name: string } | null;
    }>;
    visits: Array<{
      scheduledDate: Date;
      actualDate: Date | null;
      status: string;
      worker?: { id: string; name: string } | null;
    }>;
    repairs: Array<{
      createdAt: Date;
      startedAt: Date | null;
      completedAt: Date | null;
      amount: { toNumber(): number } | number | string;
      description: string;
      status: string;
      revisions?: Array<{
        createdAt: Date;
        proposedAmount: { toNumber(): number } | number | string;
        status: string;
        reason: string;
        requestedBy: string;
      }>;
    }>;
    commission: {
      createdAt: Date;
      amount: { toNumber(): number } | number | string;
      status: string;
      verifiedAt: Date | null;
      paidAt: Date | null;
    } | null;
    reviews: Array<{ createdAt: Date; rating: number; comment: string | null }>;
  }): Array<{ at: Date; type: string; detail: string }> {
    const events: Array<{ at: Date; type: string; detail: string }> = [];

    events.push({
      at: input.job.createdAt,
      type: 'JOB_CREATED',
      detail: 'Service request created',
    });
    if (input.job.cancelledAt) {
      events.push({
        at: input.job.cancelledAt,
        type: 'JOB_CANCELLED',
        detail: input.job.cancelReason ?? 'Cancelled by customer or admin',
      });
    }
    if (input.job.completedAt) {
      events.push({ at: input.job.completedAt, type: 'JOB_COMPLETED', detail: 'Job completed' });
    }

    for (const offer of input.offers) {
      const charge = Number(offer.visitCharge);
      events.push({
        at: offer.createdAt,
        type: 'OFFER_CREATED',
        detail: `${offer.worker?.name ?? 'Worker'} offered Rs ${charge} (${offer.status})`,
      });
    }

    for (const visit of input.visits) {
      events.push({
        at: visit.scheduledDate,
        type: 'VISIT_SCHEDULED',
        detail: `Visit scheduled with ${visit.worker?.name ?? 'worker'}`,
      });
      if (visit.actualDate) {
        events.push({
          at: visit.actualDate,
          type: `VISIT_${visit.status}`,
          detail: `Visit ${visit.status.toLowerCase().replaceAll('_', ' ')}`,
        });
      }
    }

    for (const repair of input.repairs) {
      events.push({
        at: repair.createdAt,
        type: 'REPAIR_PROPOSED',
        detail: `${repair.description} — Rs ${Number(repair.amount)} (${repair.status})`,
      });
      if (repair.startedAt) {
        events.push({
          at: repair.startedAt,
          type: 'REPAIR_STARTED',
          detail: 'Repair work started',
        });
      }
      if (repair.completedAt) {
        events.push({
          at: repair.completedAt,
          type: 'REPAIR_COMPLETED',
          detail: 'Repair work completed',
        });
      }
      for (const revision of repair.revisions ?? []) {
        events.push({
          at: revision.createdAt,
          type: 'REPAIR_REVISION',
          detail: `${revision.requestedBy} proposed Rs ${Number(revision.proposedAmount)} — ${revision.reason} (${revision.status})`,
        });
      }
    }

    if (input.commission) {
      events.push({
        at: input.commission.createdAt,
        type: 'COMMISSION_ISSUED',
        detail: `Platform commission Rs ${Number(input.commission.amount)} (${input.commission.status})`,
      });
      if (input.commission.verifiedAt) {
        events.push({
          at: input.commission.verifiedAt,
          type: 'COMMISSION_VERIFIED',
          detail: 'Commission verified by admin',
        });
      }
      if (input.commission.paidAt) {
        events.push({
          at: input.commission.paidAt,
          type: 'COMMISSION_PAID',
          detail: 'Commission paid to worker',
        });
      }
    }

    for (const review of input.reviews) {
      events.push({
        at: review.createdAt,
        type: 'REVIEW',
        detail: `${review.rating}/5 star${review.comment ? ` — ${review.comment}` : ''}`,
      });
    }

    return events.sort((a, b) => a.at.getTime() - b.at.getTime());
  }
}
