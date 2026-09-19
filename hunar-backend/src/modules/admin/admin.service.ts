import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommissionStatus, JobStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { AUDIT_ACTIONS, AuditService } from './audit.service';
import { AdminUserListQueryDto, AdminWorkerListQueryDto } from './admin.validation';

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

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
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
        totalPaid: payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
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
}
