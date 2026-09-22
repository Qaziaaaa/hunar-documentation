import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { CommissionStatus, DisputeStatus, DisputeType, JobStatus, Prisma, Role, WithdrawalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RealtimeService } from '../realtime/realtime.service';
import { JOB_EVENTS, userRoom } from '../jobs/jobs.events';
import { ADMIN_EVENTS, ADMIN_ROOM } from './admin.events';
import { JobStateMachine } from '../jobs/jobs.state-machine';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { AUDIT_ACTIONS, AuditService } from './audit.service';
import {
  AdminUserListQueryDto,
  AdminJobListQueryDto,
  AdminWorkerListQueryDto,
  AdminTransactionListQueryDto,
  AdminPaymentListQueryDto,
  AdminCommissionListQueryDto,
  AdminWithdrawalListQueryDto,
  AdminFreezeWalletDto,
  AdminDisputeListQueryDto,
  AdminResolveDisputeDto,
  AdminCategoryListQueryDto,
  AdminCreateCategoryDto,
  AdminUpdateCategoryDto,
  AdminUpdateCommissionRateDto,
  AdminUpdateSettingsDto,
  AdminReportQueryDto,
  AdminAuditListQueryDto,
  AdminNotificationListQueryDto,
  AdminMarkNotificationsReadDto,
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

// Payments feed (Admin flow §8 — Step F). Payments are derived from paid jobs.
const PAYMENT_SELECT = {
  id: true,
  title: true,
  status: true,
  lockedVisitCharge: true,
  suggestedVisitCharge: true,
  city: true,
  area: true,
  completedAt: true,
  createdAt: true,
  category: { select: { id: true, name: true, nameUrdu: true } },
  customer: { select: { id: true, name: true, phone: true } },
  selectedWorker: { select: { id: true, name: true, phone: true } },
} satisfies Prisma.ServiceRequestSelect;

type AdminPaymentRow = Prisma.ServiceRequestGetPayload<{ select: typeof PAYMENT_SELECT }>;

// Commission snapshot feed (Admin flow §8 — Step F). Platform revenue = Commission.amount.
const COMMISSION_SELECT = {
  id: true,
  jobId: true,
  visitCharge: true,
  commissionRate: true,
  amount: true,
  status: true,
  paidAt: true,
  verifiedAt: true,
  createdAt: true,
  worker: { select: { id: true, name: true, phone: true } },
  job: { select: { id: true, title: true } },
} satisfies Prisma.CommissionSelect;

type AdminCommissionRow = Prisma.CommissionGetPayload<{ select: typeof COMMISSION_SELECT }>;

// Withdrawal queue feed (Admin flow §8 — Step F). Worker withdrawal requests.
const WITHDRAWAL_SELECT = {
  id: true,
  workerId: true,
  amount: true,
  status: true,
  note: true,
  requestedAt: true,
  processedAt: true,
  processedBy: true,
  createdAt: true,
  worker: { select: { id: true, name: true, phone: true } },
} satisfies Prisma.WithdrawalSelect;

type AdminWithdrawalRow = Prisma.WithdrawalGetPayload<{ select: typeof WITHDRAWAL_SELECT }>;

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

  // Payments feed (Admin flow §8 — Step F): all paid jobs with amount, job, customer, worker,
  // date and status. Amount = locked visit charge (falling back to suggested charge).
  async listPayments(query: AdminPaymentListQueryDto) {
    const { page, limit, skip } = normalizePage(query);

    const where: Prisma.ServiceRequestWhereInput = {
      status: { in: PAID_JOB_STATUSES },
      ...(query.status ? { status: query.status } : {}),
      ...(query.city ? { city: query.city } : {}),
      ...(query.area ? { area: query.area } : {}),
      ...(query.from || query.to
        ? {
            completedAt: {
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
              { selectedWorker: { is: { name: { contains: query.search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where,
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
        select: PAYMENT_SELECT,
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);

    const items = rows.map((row: AdminPaymentRow) => ({
      id: row.id,
      jobTitle: row.title,
      amount: row.lockedVisitCharge ?? row.suggestedVisitCharge ?? null,
      status: row.status,
      paidAt: row.completedAt ?? row.createdAt,
      city: row.city,
      area: row.area,
      category: row.category,
      customer: row.customer,
      worker: row.selectedWorker,
    }));

    return toPageResult(items, total, page, limit);
  }

  // Commission snapshot (Admin flow §8 — Step F): total platform revenue (sum of commission
  // amounts / visit charges, avg rate) + the per-transaction list with worker and job.
  async getCommissionSnapshot(query: AdminCommissionListQueryDto) {
    const { page, limit, skip } = normalizePage(query);

    const where: Prisma.CommissionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
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
              { job: { is: { title: { contains: query.search, mode: 'insensitive' } } } },
              { worker: { is: { name: { contains: query.search, mode: 'insensitive' } } } },
              { worker: { is: { phone: { contains: query.search } } } },
            ],
          }
        : {}),
    };

    const [rows, total, agg] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: COMMISSION_SELECT,
      }),
      this.prisma.commission.count({ where }),
      this.prisma.commission.aggregate({
        where,
        _sum: { amount: true, visitCharge: true },
        _avg: { commissionRate: true },
      }),
    ]);

    const items = rows.map((row: AdminCommissionRow) => ({
      id: row.id,
      jobId: row.jobId,
      jobTitle: row.job.title,
      worker: row.worker,
      visitCharge: row.visitCharge,
      rate: row.commissionRate,
      amount: row.amount,
      status: row.status,
      paidAt: row.paidAt,
      date: row.createdAt,
    }));

    return {
      summary: {
        totalRevenue: (agg._sum.amount ?? 0).toFixed(2),
        totalVisitCharges: (agg._sum.visitCharge ?? 0).toFixed(2),
        totalCount: total,
        averageRate: agg._avg.commissionRate ?? null,
      },
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Withdrawal queue (Admin flow §8 — Step F): list of worker withdrawal requests with
  // status (pending/processed/failed/rejected), filters, and pagination.
  async listWithdrawals(query: AdminWithdrawalListQueryDto) {
    const { page, limit, skip } = normalizePage(query);

    const where: Prisma.WithdrawalWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            requestedAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { worker: { is: { name: { contains: query.search, mode: 'insensitive' } } } },
              { worker: { is: { phone: { contains: query.search } } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
        select: WITHDRAWAL_SELECT,
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    const items = rows.map((row: AdminWithdrawalRow) => ({
      id: row.id,
      workerId: row.workerId,
      worker: row.worker,
      amount: row.amount,
      status: row.status,
      note: row.note,
      requestedAt: row.requestedAt,
      processedAt: row.processedAt,
      processedBy: row.processedBy,
    }));

    return toPageResult(items, total, page, limit);
  }

  // Admin processes a withdrawal request (approve/reject). On approve, moves money and
  // creates wallet ledger entry. Audit-logged.
  async processWithdrawal(id: string, actor: JwtPayload, action: 'approve' | 'reject', note?: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
      select: { id: true, workerId: true, amount: true, status: true },
    });
    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }
    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Withdrawal already processed');
    }

    if (action === 'approve') {
      const wallet = await this.prisma.workerWallet.findUnique({
        where: { userId: withdrawal.workerId },
        select: { userId: true, balance: true },
      });
      if (!wallet) {
        throw new NotFoundException('Worker wallet not found');
      }
      const balance = Number(wallet.balance);
      const amount = Number(withdrawal.amount);
      if (balance < amount) {
        throw new BadRequestException('Insufficient balance for withdrawal');
      }
      const balanceAfter = balance - amount;

      return this.prisma.$transaction(async (tx) => {
        await tx.workerWallet.update({
          where: { userId: wallet.userId },
          data: { balance: new Prisma.Decimal(balanceAfter) },
        });

        await tx.walletLedger.create({
          data: {
            user: { connect: { id: wallet.userId } },
            type: 'WITHDRAWAL',
            amount: new Prisma.Decimal(-amount),
            balanceAfter: new Prisma.Decimal(balanceAfter),
            note: 'Admin-approved withdrawal payout',
            idempotencyKey: `withdrawal-${id}-${Date.now()}`,
          },
        });

        const updated = await tx.withdrawal.update({
          where: { id },
          data: {
            status: 'PROCESSED',
            processedAt: new Date(),
            processedBy: actor.sub,
            note,
          },
          select: {
            id: true,
            workerId: true,
            amount: true,
            status: true,
            processedAt: true,
            processedBy: true,
            note: true,
          },
        });

        await this.audit.record(
          {
            actorId: actor.sub,
            actorRole: actor.role,
            action: 'WITHDRAWAL_APPROVED',
            targetType: 'WITHDRAWAL',
            targetId: id,
            reason: note,
            metadata: { workerId: withdrawal.workerId, amount: withdrawal.amount },
          },
          tx,
        );

        return updated;
      });
    }

    this.emitWithdrawalAlert('approve', id, withdrawal.workerId, Number(withdrawal.amount), actor.sub);

    const updated = await this.prisma.withdrawal.update({
      where: { id },
      data: { status: 'REJECTED', processedAt: new Date(), processedBy: actor.sub, note },
      select: {
        id: true,
        workerId: true,
        amount: true,
        status: true,
        processedAt: true,
        processedBy: true,
        note: true,
      },
    });

    await this.audit.record(
      {
        actorId: actor.sub,
        actorRole: actor.role,
        action: 'WITHDRAWAL_REJECTED',
        targetType: 'WITHDRAWAL',
        targetId: id,
        reason: note,
        metadata: { workerId: withdrawal.workerId, amount: withdrawal.amount },
      },
    );

    this.emitWithdrawalAlert('rejected', id, withdrawal.workerId, Number(withdrawal.amount), actor.sub);

    return updated;
  }

  private emitWithdrawalAlert(action: string, withdrawalId: string, workerId: string, amount: number, actorId: string): void {
    const adminEvent = action === 'approve' ? ADMIN_EVENTS.withdrawalProcessed : ADMIN_EVENTS.withdrawalRejected;
    this.realtime.emitToRoom(ADMIN_ROOM, adminEvent, {
      withdrawalId,
      workerId,
      amount,
      processedBy: actorId,
      timestamp: new Date(),
    });
    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.newAlert, {
      type: 'withdrawal',
      event: adminEvent,
      withdrawalId,
      workerId,
      amount,
      timestamp: new Date(),
    });
  }

  // Wallet freeze (Admin flow §8). Admin freezes a worker's wallet during a dispute.
  async freezeWallet(workerId: string, actor: JwtPayload, dto: AdminFreezeWalletDto) {
    const wallet = await this.prisma.workerWallet.findUnique({
      where: { userId: workerId },
      select: { userId: true, isFrozen: true, balance: true },
    });
    if (!wallet) {
      throw new NotFoundException('Worker wallet not found');
    }
    if (wallet.isFrozen) {
      throw new BadRequestException('Wallet is already frozen');
    }

    const updated = await this.prisma.workerWallet.update({
      where: { userId: workerId },
      data: {
        isFrozen: true,
        frozenAt: new Date(),
        frozenBy: actor.sub,
      },
      select: { userId: true, isFrozen: true, frozenAt: true, frozenBy: true },
    });

    await this.audit.record(
      {
        actorId: actor.sub,
        actorRole: actor.role,
        action: 'WALLET_FROZEN',
        targetType: 'WORKER_WALLET',
        targetId: workerId,
        reason: dto.reason,
        metadata: { balance: wallet.balance },
      },
    );

    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.walletFrozen, {
      workerId,
      reason: dto.reason,
      frozenBy: actor.sub,
      timestamp: new Date(),
    });
    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.newAlert, {
      type: 'wallet',
      event: ADMIN_EVENTS.walletFrozen,
      workerId,
      timestamp: new Date(),
    });

    return updated;
  }

  // Admin unfreezes a worker's wallet.
  async unfreezeWallet(workerId: string, actor: JwtPayload) {
    const wallet = await this.prisma.workerWallet.findUnique({
      where: { userId: workerId },
      select: { userId: true, isFrozen: true },
    });
    if (!wallet) {
      throw new NotFoundException('Worker wallet not found');
    }
    if (!wallet.isFrozen) {
      throw new BadRequestException('Wallet is not frozen');
    }

    const updated = await this.prisma.workerWallet.update({
      where: { userId: workerId },
      data: {
        isFrozen: false,
        frozenAt: null,
        frozenBy: null,
      },
      select: { userId: true, isFrozen: true, frozenAt: true, frozenBy: true },
    });

    await this.audit.record(
      {
        actorId: actor.sub,
        actorRole: actor.role,
        action: 'WALLET_UNFROZEN',
        targetType: 'WORKER_WALLET',
        targetId: workerId,
        reason: null,
        metadata: {},
      },
    );

    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.walletUnfrozen, {
      workerId,
      unfrozenBy: actor.sub,
      timestamp: new Date(),
    });
    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.newAlert, {
      type: 'wallet',
      event: ADMIN_EVENTS.walletUnfrozen,
      workerId,
      timestamp: new Date(),
    });

    return updated;
  }

  // Dispute queue (Admin flow §10). List disputes with filters and pagination.
  async listDisputes(query: AdminDisputeListQueryDto) {
    const { page, limit, skip } = normalizePage(query);

    const where: Prisma.DisputeWhereInput = {
      ...(query.status ? { status: query.status } : {}),
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
            OR: [
              { job: { is: { title: { contains: query.search, mode: 'insensitive' } } } },
              { reporter: { is: { name: { contains: query.search, mode: 'insensitive' } } } },
              { respondent: { is: { name: { contains: query.search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          jobId: true,
          type: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          reporter: { select: { id: true, name: true, phone: true } },
          respondent: { select: { id: true, name: true, phone: true } },
          job: { select: { id: true, title: true, status: true } },
        },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      jobTitle: row.job.title,
      jobStatus: row.job.status,
      type: row.type,
      description: row.description,
      status: row.status,
      reporter: row.reporter,
      respondent: row.respondent,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return toPageResult(items, total, page, limit);
  }

  // Dispute detail (Admin flow §10). Full dispute with job evidence trail.
  async getDisputeDetail(id: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      select: {
        id: true,
        jobId: true,
        type: true,
        description: true,
        evidence: true,
        status: true,
        resolution: true,
        resolvedBy: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        reporter: { select: { id: true, name: true, phone: true } },
        respondent: { select: { id: true, name: true, phone: true } },
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            city: true,
            area: true,
            suggestedVisitCharge: true,
            lockedVisitCharge: true,
            customer: { select: { id: true, name: true, phone: true } },
            selectedWorker: { select: { id: true, name: true, phone: true } },
            category: { select: { id: true, name: true } },
            createdAt: true,
            completedAt: true,
          },
        },
      },
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    return dispute;
  }

  // Dispute resolution (Admin flow §10). Admin resolves, dismisses, or escalates a dispute.
  async resolveDispute(id: string, actor: JwtPayload, dto: AdminResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      select: { id: true, jobId: true, status: true, reporterId: true, respondentId: true },
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('Dispute already resolved');
    }

    let newStatus: DisputeStatus;
    let action: string;
    let auditAction: 'DISPUTE_RESOLVED' | 'DISPUTE_DISMISSED' | 'DISPUTE_ESCALATED';

    if (dto.action === 'resolve') {
      if (!dto.resolution) {
        throw new BadRequestException('Resolution is required when resolving a dispute');
      }
      newStatus = 'RESOLVED';
      action = 'resolved';
      auditAction = 'DISPUTE_RESOLVED';
    } else if (dto.action === 'dismiss') {
      newStatus = 'DISMISSED';
      action = 'dismissed';
      auditAction = 'DISPUTE_DISMISSED';
    } else {
      newStatus = 'ESCALATED';
      action = 'escalated';
      auditAction = 'DISPUTE_ESCALATED';
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.dispute.update({
        where: { id },
        data: {
          status: newStatus,
          resolution: dto.resolution ?? dto.note ?? null,
          resolvedBy: actor.sub,
          resolvedAt: new Date(),
        },
        select: {
          id: true,
          jobId: true,
          type: true,
          status: true,
          resolution: true,
          resolvedBy: true,
          resolvedAt: true,
        },
      });

      await this.audit.record(
        {
          actorId: actor.sub,
          actorRole: actor.role,
          action: auditAction,
          targetType: 'DISPUTE',
          targetId: id,
          reason: dto.resolution ?? dto.note,
          metadata: { jobId: dispute.jobId, previousStatus: dispute.status },
        },
        tx,
      );

      return updated;
    });

    // Emit admin alert for dispute resolution
    this.emitDisputeAlert(action, id, dispute.jobId, actor.sub);

    return { ...updated, action };
  }

  private emitDisputeAlert(action: string, disputeId: string, jobId: string, actorId: string): void {
    let adminEvent: string;
    switch (action) {
      case 'resolved':
        adminEvent = ADMIN_EVENTS.disputeResolved;
        break;
      case 'dismissed':
        adminEvent = ADMIN_EVENTS.disputeDismissed;
        break;
      case 'escalated':
        adminEvent = ADMIN_EVENTS.disputeEscalated;
        break;
      default:
        adminEvent = ADMIN_EVENTS.disputeCreated;
    }
    this.realtime.emitToRoom(ADMIN_ROOM, adminEvent, {
      disputeId,
      jobId,
      resolvedBy: actorId,
      timestamp: new Date(),
    });
    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.newAlert, {
      type: 'dispute',
      event: adminEvent,
      disputeId,
      jobId,
      timestamp: new Date(),
    });
  }

  // Category management (Admin flow §11). List categories with filters.
  async listCategories(query: AdminCategoryListQueryDto) {
    const { page, limit, skip } = normalizePage(query);

    const where: Prisma.ServiceCategoryWhereInput = {
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { nameUrdu: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.serviceCategory.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
        select: { id: true, name: true, nameUrdu: true, isActive: true, sortOrder: true, createdAt: true },
      }),
      this.prisma.serviceCategory.count({ where }),
    ]);

    return toPageResult(rows, total, page, limit);
  }

  // Create a new category.
  async createCategory(dto: AdminCreateCategoryDto, actor: JwtPayload) {
    const category = await this.prisma.serviceCategory.create({
      data: {
        name: dto.name,
        nameUrdu: dto.nameUrdu,
        sortOrder: dto.sortOrder ?? 0,
      },
      select: { id: true, name: true, nameUrdu: true, isActive: true, sortOrder: true, createdAt: true },
    });

    await this.audit.record(
      {
        actorId: actor.sub,
        actorRole: actor.role,
        action: 'CATEGORY_CREATED',
        targetType: 'SERVICE_CATEGORY',
        targetId: category.id,
        reason: null,
        metadata: { name: category.name, nameUrdu: category.nameUrdu, sortOrder: category.sortOrder },
      },
    );

    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.categoryCreated, {
      categoryId: category.id,
      name: category.name,
      nameUrdu: category.nameUrdu,
      createdBy: actor.sub,
      timestamp: new Date(),
    });
    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.newAlert, {
      type: 'category',
      event: ADMIN_EVENTS.categoryCreated,
      categoryId: category.id,
      name: category.name,
      timestamp: new Date(),
    });

    return category;
  }

  // Update a category.
  async updateCategory(id: string, dto: AdminUpdateCategoryDto, actor: JwtPayload) {
    const existing = await this.prisma.serviceCategory.findUnique({
      where: { id },
      select: { id: true, name: true, nameUrdu: true, isActive: true, sortOrder: true },
    });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const updated = await this.prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.nameUrdu !== undefined ? { nameUrdu: dto.nameUrdu } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
      select: { id: true, name: true, nameUrdu: true, isActive: true, sortOrder: true },
    });

    await this.audit.record(
      {
        actorId: actor.sub,
        actorRole: actor.role,
        action: 'CATEGORY_UPDATED',
        targetType: 'SERVICE_CATEGORY',
        targetId: id,
        reason: null,
        metadata: { from: existing, to: updated },
      },
    );

    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.categoryUpdated, {
      categoryId: id,
      changes: { from: existing, to: updated },
      updatedBy: actor.sub,
      timestamp: new Date(),
    });
    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.newAlert, {
      type: 'category',
      event: ADMIN_EVENTS.categoryUpdated,
      categoryId: id,
      timestamp: new Date(),
    });

    return updated;
  }

  // Deactivate a category (soft delete - existing jobs finish, new posts blocked).
  async deactivateCategory(id: string, actor: JwtPayload) {
    const existing = await this.prisma.serviceCategory.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }
    if (!existing.isActive) {
      throw new BadRequestException('Category is already deactivated');
    }

    const updated = await this.prisma.serviceCategory.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, isActive: true },
    });

    await this.audit.record(
      {
        actorId: actor.sub,
        actorRole: actor.role,
        action: 'CATEGORY_DEACTIVATED',
        targetType: 'SERVICE_CATEGORY',
        targetId: id,
        reason: null,
        metadata: { name: existing.name },
      },
    );

    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.categoryDeactivated, {
      categoryId: id,
      name: existing.name,
      deactivatedBy: actor.sub,
      timestamp: new Date(),
    });
    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.newAlert, {
      type: 'category',
      event: ADMIN_EVENTS.categoryDeactivated,
      categoryId: id,
      name: existing.name,
      timestamp: new Date(),
    });

    return updated;
  }

  // Platform settings (Admin flow §12). Get all platform settings.
  async getSettings() {
    const settings = await this.prisma.platformSetting.findMany({
      select: { key: true, value: true, updatedAt: true },
    });
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  }

  // Update commission rate (super-admin only).
  async updateCommissionRate(dto: AdminUpdateCommissionRateDto, actor: JwtPayload) {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only super-admin can change commission rate');
    }

    const existing = await this.prisma.platformSetting.findUnique({
      where: { key: 'commissionRate' },
      select: { key: true, value: true },
    });
    const oldValue = existing?.value ?? '0.1';

    const updated = await this.prisma.platformSetting.upsert({
      where: { key: 'commissionRate' },
      update: { value: dto.commissionRate.toString() },
      create: { key: 'commissionRate', value: dto.commissionRate.toString() },
      select: { key: true, value: true, updatedAt: true },
    });

    await this.audit.record(
      {
        actorId: actor.sub,
        actorRole: actor.role,
        action: 'COMMISSION_RATE_CHANGED',
        targetType: 'PLATFORM_SETTING',
        targetId: 'commissionRate',
        reason: null,
        metadata: { from: oldValue, to: updated.value },
      },
    );

    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.commissionRateChanged, {
      oldRate: oldValue,
      newRate: updated.value,
      changedBy: actor.sub,
      timestamp: new Date(),
    });
    this.realtime.emitToRoom(ADMIN_ROOM, ADMIN_EVENTS.newAlert, {
      type: 'settings',
      event: ADMIN_EVENTS.commissionRateChanged,
      oldRate: oldValue,
      newRate: updated.value,
      timestamp: new Date(),
    });

    return updated;
  }

  // Update other platform settings.
  async updateSettings(dto: AdminUpdateSettingsDto, actor: JwtPayload) {
    const results = [];

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        const existing = await this.prisma.platformSetting.findUnique({
          where: { key },
          select: { key: true, value: true },
        });
        const oldValue = existing?.value ?? null;

        const updated = await this.prisma.platformSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
          select: { key: true, value: true, updatedAt: true },
        });

        await this.audit.record(
          {
            actorId: actor.sub,
            actorRole: actor.role,
            action: 'SETTING_UPDATED',
            targetType: 'PLATFORM_SETTING',
            targetId: key,
            reason: null,
            metadata: { from: oldValue, to: updated.value },
          },
        );

        results.push(updated);
      }
    }

    return results;
  }

  // Reports (Admin flow §13). Generate analytics reports.
  async getReport(query: AdminReportQueryDto) {
    const { type, from, to } = query;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const dateFilter = { gte: fromDate, lte: toDate };

    switch (type) {
      case 'jobs-funnel': {
        const [posted, offersReceived, accepted, completed, cancelled] = await Promise.all([
          this.prisma.serviceRequest.count({ where: { createdAt: dateFilter } }),
          this.prisma.serviceRequest.count({ where: { status: { in: ['OFFERS_RECEIVED', 'OFFER_ACCEPTED'] }, createdAt: dateFilter } }),
          this.prisma.serviceRequest.count({ where: { status: { in: ['WORKER_ASSIGNED', 'VISIT_SCHEDULED', 'VISIT_IN_PROGRESS', 'INSPECTION_DONE', 'REPAIR_NEGOTIATING', 'REPAIR_APPROVED', 'IN_PROGRESS'] }, createdAt: dateFilter } }),
          this.prisma.serviceRequest.count({ where: { status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] }, completedAt: dateFilter } }),
          this.prisma.serviceRequest.count({ where: { status: 'CANCELLED', cancelledAt: dateFilter } }),
        ]);
        return {
          type: 'jobs-funnel',
          period: { from: fromDate, to: toDate },
          data: {
            posted,
            offersReceived,
            accepted,
            completed,
            cancelled,
            conversionRate: posted > 0 ? ((completed / posted) * 100).toFixed(2) : '0',
          },
        };
      }

      case 'worker-performance': {
        const workers = await this.prisma.user.findMany({
          where: { role: 'WORKER', createdAt: dateFilter },
          select: {
            id: true,
            name: true,
            phone: true,
            workerProfile: { select: { verificationStatus: true, skills: true, experienceYears: true } },
            _count: { select: { selectedJobs: true, offers: true } },
            commissions: { where: { status: { in: ['RECEIVED', 'VERIFIED'] }, createdAt: dateFilter }, select: { amount: true } },
          },
        });
        const data = workers.map((w) => ({
          workerId: w.id,
          name: w.name,
          phone: w.phone,
          verificationStatus: w.workerProfile?.verificationStatus,
          skills: w.workerProfile?.skills,
          experienceYears: w.workerProfile?.experienceYears,
          jobsCount: w._count.selectedJobs,
          offersCount: w._count.offers,
          totalEarnings: w.commissions.reduce((sum, c) => sum + Number(c.amount), 0).toFixed(2),
        }));
        return { type: 'worker-performance', period: { from: fromDate, to: toDate }, data };
      }

      case 'revenue': {
        const [totalCommissions, totalVisitCharges, avgRate, topCategories] = await Promise.all([
          this.prisma.commission.aggregate({ where: { status: { in: ['RECEIVED', 'VERIFIED'] }, createdAt: dateFilter }, _sum: { amount: true } }),
          this.prisma.commission.aggregate({ where: { status: { in: ['RECEIVED', 'VERIFIED'] }, createdAt: dateFilter }, _sum: { visitCharge: true } }),
          this.prisma.commission.aggregate({ where: { status: { in: ['RECEIVED', 'VERIFIED'] }, createdAt: dateFilter }, _avg: { commissionRate: true } }),
          this.prisma.serviceRequest.groupBy({
            by: ['categoryId'],
            where: { status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] }, completedAt: dateFilter },
            _sum: { lockedVisitCharge: true },
            _count: { _all: true },
            orderBy: { _sum: { lockedVisitCharge: 'desc' } },
            take: 10,
          }),
        ]);
        const categories = await Promise.all(
          topCategories.map(async (c) => {
            const cat = await this.prisma.serviceCategory.findUnique({ where: { id: c.categoryId }, select: { name: true } });
            return { category: cat?.name ?? c.categoryId, revenue: c._sum.lockedVisitCharge?.toFixed(2) ?? '0', jobsCount: c._count._all };
          }),
        );
        return {
          type: 'revenue',
          period: { from: fromDate, to: toDate },
          data: {
            totalCommissions: totalCommissions._sum.amount?.toFixed(2) ?? '0',
            totalVisitCharges: totalVisitCharges._sum.visitCharge?.toFixed(2) ?? '0',
            averageCommissionRate: avgRate._avg.commissionRate ?? 0,
            topCategories: categories,
          },
        };
      }

      case 'growth': {
        const [newCustomers, newWorkers, newJobs] = await Promise.all([
          this.prisma.user.count({ where: { role: 'CUSTOMER', createdAt: dateFilter } }),
          this.prisma.user.count({ where: { role: 'WORKER', createdAt: dateFilter } }),
          this.prisma.serviceRequest.count({ where: { createdAt: dateFilter } }),
        ]);
        return {
          type: 'growth',
          period: { from: fromDate, to: toDate },
          data: { newCustomers, newWorkers, newJobs },
        };
      }

      default:
        throw new BadRequestException('Invalid report type');
    }
  }

  // Audit trail (Admin flow §15). Admin views audit log with filters.
  async listAuditLogs(query: AdminAuditListQueryDto) {
    const { page, limit, skip } = normalizePage(query);

    const where: Prisma.AuditLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          actorId: true,
          actorRole: true,
          action: true,
          targetType: true,
          targetId: true,
          reason: true,
          metadata: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return toPageResult(rows, total, page, limit);
  }

  // Admin notifications (Admin flow §14). List admin notifications with filters.
  async listNotifications(query: AdminNotificationListQueryDto) {
    const { page, limit, skip } = normalizePage(query);

    const where: Prisma.AdminNotificationWhereInput = {
      ...(query.isRead !== undefined ? { isRead: query.isRead === 'true' } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: { id: true, type: true, title: true, body: true, data: true, isRead: true, readAt: true, createdAt: true },
      }),
      this.prisma.adminNotification.count({ where }),
    ]);

    return toPageResult(rows, total, page, limit);
  }

  // Admin marks notifications as read.
  async markNotificationsRead(dto: AdminMarkNotificationsReadDto, actor: JwtPayload) {
    await this.prisma.adminNotification.updateMany({
      where: { id: { in: dto.notificationIds } },
      data: { isRead: true, readAt: new Date() },
    });

    await this.audit.record(
      {
        actorId: actor.sub,
        actorRole: actor.role,
        action: 'NOTIFICATIONS_MARKED_READ',
        targetType: 'ADMIN_NOTIFICATION',
        targetId: dto.notificationIds.join(','),
        reason: null,
        metadata: { count: dto.notificationIds.length },
      },
    );

    return { markedRead: dto.notificationIds.length };
  }

  // Export report as CSV or PDF (Admin flow §13).
  async exportReport(query: AdminReportQueryDto, res: ExpressResponse): Promise<void> {
    const report = await this.getReport(query);
    const format = query.format ?? 'csv';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${query.type}-report-${timestamp}.${format}`;

    if (format === 'csv') {
      const csv = this.convertReportToCsv(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      // For PDF, we'll return JSON with a note that PDF generation requires a library
      // In production, integrate with a PDF library like pdfkit or puppeteer
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename.replace('.pdf', '.json')}"`);
      res.send(JSON.stringify({ ...report, note: 'PDF generation not implemented. Use CSV format or integrate a PDF library.' }, null, 2));
    }
  }

  private convertReportToCsv(report: any): string {
    const { type, period, data } = report;

    if (type === 'jobs-funnel') {
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Posted', data.posted],
        ['Offers Received', data.offersReceived],
        ['Accepted', data.accepted],
        ['Completed', data.completed],
        ['Cancelled', data.cancelled],
        ['Conversion Rate (%)', data.conversionRate],
      ];
      return this.arrayToCsv([headers, ...rows]);
    }

    if (type === 'worker-performance') {
      const headers = ['Worker ID', 'Name', 'Phone', 'Verification Status', 'Skills', 'Experience (Years)', 'Jobs Count', 'Offers Count', 'Total Earnings'];
      const rows = data.data.map((w: any) => [
        w.workerId,
        w.name,
        w.phone,
        w.verificationStatus,
        (w.skills ?? []).join('; '),
        w.experienceYears ?? '',
        w.jobsCount,
        w.offersCount,
        w.totalEarnings,
      ]);
      return this.arrayToCsv([headers, ...rows]);
    }

    if (type === 'revenue') {
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Total Commissions', data.totalCommissions],
        ['Total Visit Charges', data.totalVisitCharges],
        ['Average Commission Rate', data.averageCommissionRate],
      ];
      const csv = this.arrayToCsv([headers, ...rows]);
      if (data.topCategories?.length) {
        const catHeaders = ['\nTop Categories', 'Revenue', 'Jobs Count'];
        const catRows = data.topCategories.map((c: any) => [c.category, c.revenue, c.jobsCount]);
        return csv + this.arrayToCsv([catHeaders, ...catRows]);
      }
      return csv;
    }

    if (type === 'growth') {
      const headers = ['Metric', 'Value'];
      const rows = [
        ['New Customers', data.newCustomers],
        ['New Workers', data.newWorkers],
        ['New Jobs', data.newJobs],
      ];
      return this.arrayToCsv([headers, ...rows]);
    }

    return 'Report type not supported for CSV export';
  }

  private arrayToCsv(data: string[][]): string {
    return data
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
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
