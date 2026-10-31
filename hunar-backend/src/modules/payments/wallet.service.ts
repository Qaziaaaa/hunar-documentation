import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobStatus, WalletLedgerType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { calculateCommission } from '../../common/helpers/commission.util';
import { RealtimeService } from '../realtime/realtime.service';
import { WALLET_EVENTS, walletRoom } from './wallet.events';
import { LedgerService } from './ledger.service';
import { TopupDecideDto, TopupDto, TopupQueryDto } from './payments.validation';
import { SETTINGS_DEFAULTS, SettingsService } from '../../common/settings/settings.service';

// Redis idempotency markers keep every money movement safe against double-fires
// (webhooks, retries, concurrent requests). The DB-unique WalletLedger.idempotencyKey
// column is the authoritative guard; Redis is the fast path.
const WALLET_IDEMPOTENCY_PREFIX = 'wallet:';
const WALLET_IDEMPOTENCY_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface WalletSnapshot {
  userId: string;
  balance: number;
  heldBalance: number;
  totalBalance: number;
}

export const PLATFORM_WALLET_ID = 'platform';
const PLATFORM_COMMISSION_NOTICE = 'Commission deducted (Task 7 wallet)';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventBus: EventBusService,
    private readonly realtime: RealtimeService,
    private readonly config: ConfigService,
    private readonly ledger: LedgerService,
    @Optional() private readonly settings?: SettingsService,
  ) {}

  // PlatformSetting['commissionRate'] is the admin-managed source of truth;
  // SettingsService owns the 60s read cache (single source for all settings).
  private async getCommissionRate(): Promise<number> {
    if (this.settings) return this.settings.getCommissionRate();
    // Unit tests construct WalletService manually without SettingsService.
    return Number(this.config.get<string>('app.commissionRate', '0.10')) || SETTINGS_DEFAULTS.commissionRate;
  }

  /** Admin-configured negative-balance floor (legacy default: Rs. -500). */
  private async getWalletMaxNegativeBalance(): Promise<number> {
    if (this.settings) return this.settings.getWalletMaxNegativeBalance();
    return SETTINGS_DEFAULTS.walletMaxNegativeBalance;
  }

  private async getOrCreateWallet(userId: string) {
    // findUnique, not upsert: Prisma's upsert runs BEGIN + 3 SELECTs + COMMIT
    // (~5 RTT, measured 1.3–2.0s at this DB latency) even when the row exists.
    // This is a read hot path (balance polling); creation only happens on
    // genuine first touch, and the unique PK makes the concurrent-create race
    // resolve to a read-back.
    const existing = await this.prisma.workerWallet.findUnique({ where: { userId } });
    if (existing) return existing;
    try {
      return await this.prisma.workerWallet.create({ data: { userId } });
    } catch {
      return this.prisma.workerWallet.findUniqueOrThrow({ where: { userId } });
    }
  }

  private snapshot(wallet: {
    userId: string;
    balance: unknown;
    heldBalance: unknown;
  }): WalletSnapshot {
    const balance = Number(wallet.balance);
    const heldBalance = Number(wallet.heldBalance);
    return {
      userId: wallet.userId,
      balance,
      heldBalance,
      totalBalance: balance + heldBalance,
    };
  }

  private async emitBalance(userId: string): Promise<void> {
    const snapshot = await this.getBalance(userId);
    this.realtime.emitToRoom(walletRoom(userId), WALLET_EVENTS.balanceUpdated, snapshot);
    return undefined;
  }

  // ----- Read models -----------------------------------------------------

  async getBalance(userId: string): Promise<WalletSnapshot> {
    const wallet = await this.getOrCreateWallet(userId);
    return this.snapshot(wallet);
  }

  async getLedger(
    userId: string,
    query: { page?: number; limit?: number; type?: WalletLedgerType },
  ) {
    return this.ledger.listForWorker(userId, query);
  }

  /**
   * Earnings summary derived from the signed wallet ledger:
   * gross = EARNINGS_CREDIT, commissionsPaid = |COMMISSION_DEDUCTED|,
   * net = gross − commissionsPaid, plus top-ups credited and the live balance.
   */
  async getEarningsSummary(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const agg = (await this.prisma.walletLedger.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
    })) as unknown as Array<{ type: WalletLedgerType; _sum: { amount: number | null } }>;

    const sumBy = (type: WalletLedgerType): number => {
      const row = agg.find((a) => a.type === type);
      return row ? Number(row._sum.amount ?? 0) : 0;
    };

    const grossEarnings = sumBy(WalletLedgerType.EARNINGS_CREDIT);
    const commissionsPaid = Math.abs(sumBy(WalletLedgerType.COMMISSION_DEDUCTED));
    const commissionsHeld = Math.abs(sumBy(WalletLedgerType.COMMISSION_HELD));
    const commissionsReversed = Math.abs(sumBy(WalletLedgerType.COMMISSION_RELEASED));
    const topupsCredited = sumBy(WalletLedgerType.TOPUP_CREDIT);

    // Retrieve completed jobs for this worker to generate statement breakdown
    const completedJobs = await this.prisma.serviceRequest.findMany({
      where: {
        selectedWorkerId: userId,
        status: { in: [JobStatus.COMPLETED, JobStatus.PAID, JobStatus.REVIEWED] },
      },
      include: {
        category: { select: { id: true, name: true, nameUrdu: true } },
        repairs: {
          where: { status: 'ACCEPTED' },
          select: { lockedAmount: true, amount: true },
        },
      },
      orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const completedJobsGross = completedJobs.reduce((sum, j) => {
      const visitFee = Number(j.lockedVisitCharge ?? j.suggestedVisitCharge ?? 0);
      const repairFee = j.repairs?.[0]
        ? Number(j.repairs[0].lockedAmount ?? j.repairs[0].amount ?? 0)
        : 0;
      return sum + visitFee + repairFee;
    }, 0);

    const commissionRate = await this.getCommissionRate();
    const totalCommissions = completedJobs.reduce((sum, j) => {
      const visitFee = Number(j.lockedVisitCharge ?? j.suggestedVisitCharge ?? 0);
      return sum + calculateCommission(visitFee, commissionRate);
    }, 0);

    const effectiveGross = completedJobsGross;
    const effectiveNet =
      effectiveGross - (totalCommissions > 0 ? totalCommissions : commissionsPaid);

    const records = completedJobs.map((j) => {
      const visitFee = Number(j.lockedVisitCharge ?? j.suggestedVisitCharge ?? 0);
      const repairFee = j.repairs?.[0]
        ? Number(j.repairs[0].lockedAmount ?? j.repairs[0].amount ?? 0)
        : 0;
      const gross = visitFee + repairFee;
      const commission = calculateCommission(visitFee, commissionRate);
      const net = Math.round((gross - commission) * 100) / 100;
      return {
        id: j.id,
        jobId: `JOB-${j.id.slice(0, 8).toUpperCase()}`,
        jobTitle: j.title,
        category: j.category?.name ?? 'General Service',
        categoryUrdu: j.category?.nameUrdu ?? undefined,
        amount: gross,
        grossAmount: gross,
        repairAmount: repairFee,
        commission,
        netAmount: net,
        date: (j.completedAt ?? j.updatedAt ?? j.createdAt).toISOString(),
        status: j.status,
      };
    });

    return {
      grossEarnings: effectiveGross,
      commissionsPaid: totalCommissions > 0 ? totalCommissions : commissionsPaid,
      commissionsHeld,
      commissionsReversed,
      netEarnings: effectiveNet,
      topupsCredited,
      balance: Number(wallet.balance),
      heldBalance: Number(wallet.heldBalance),
      totalBalance: Number(wallet.balance) + Number(wallet.heldBalance),
      completedJobsCount: completedJobs.length,
      records,
    };
  }

  // ----- Top-ups ---------------------------------------------------------

  async submitTopup(workerId: string, dto: TopupDto) {
    const topUp = await this.prisma.walletTopup.create({
      data: {
        workerId,
        amount: dto.amount,
        screenshotUrl: dto.screenshotUrl,
        note: dto.note,
      },
    });
    this.eventBus.emit('topup.submitted', {
      topUpId: topUp.id,
      workerId,
      amount: dto.amount,
    });
    this.realtime.emitToRoom(walletRoom(workerId), WALLET_EVENTS.topupSubmitted, {
      topUpId: topUp.id,
      amount: Number(topUp.amount),
      status: 'PENDING',
    });
    return {
      id: topUp.id,
      amount: Number(topUp.amount),
      status: topUp.status,
      createdAt: topUp.createdAt,
    };
  }

  async getMyTopups(workerId: string, query: TopupQueryDto = {}) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 20;
    const where = {
      workerId,
      ...(query.status ? { status: query.status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.walletTopup.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTopup.count({ where }),
    ]);
    return {
      items: items.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        screenshotUrl: t.screenshotUrl,
        note: t.note,
        status: t.status,
        reason: t.reason,
        createdAt: t.createdAt,
      })),
      page,
      limit,
      total,
    };
  }

  /** Admin approves/rejects a pending top-up. Approval credits the worker wallet. */
  async decideTopup(topupId: string, adminId: string, dto: TopupDecideDto) {
    const topUp = await this.prisma.walletTopup.findUnique({ where: { id: topupId } });
    if (!topUp) {
      throw new NotFoundException('Top-up not found');
    }
    if (topUp.status !== 'PENDING') {
      throw new BadRequestException('TOPUP_ALREADY_DECIDED: top-up has already been processed');
    }

    if (dto.action === 'REJECTED') {
      const rejected = await this.prisma.walletTopup.update({
        where: { id: topupId },
        data: { status: 'REJECTED', reason: dto.reason, decidedBy: adminId, decidedAt: new Date() },
      });
      this.eventBus.emit('topup.rejected', {
        topUpId: topupId,
        workerId: topUp.workerId,
        amount: Number(topUp.amount),
        reason: dto.reason,
      });
      this.realtime.emitToRoom(walletRoom(topUp.workerId), WALLET_EVENTS.topupDecided, {
        topUpId: topupId,
        status: 'REJECTED',
        reason: dto.reason,
      });
      return rejected;
    }

    const credited = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.workerWallet.upsert({
        where: { userId: topUp.workerId },
        update: {},
        create: { userId: topUp.workerId },
      });
      const newBalance = Math.round((Number(wallet.balance) + Number(topUp.amount)) * 100) / 100;
      await tx.workerWallet.update({
        where: { userId: topUp.workerId },
        data: { balance: newBalance },
      });
      await this.ledger.insert(tx, {
        userId: topUp.workerId,
        type: WalletLedgerType.TOPUP_CREDIT,
        amount: Number(topUp.amount),
        balanceAfter: newBalance,
        referenceType: 'topup',
        referenceId: topupId,
        note: 'Wallet top-up verified by admin',
        idempotencyKey: `topup:${topupId}`,
      });
      return tx.walletTopup.update({
        where: { id: topupId },
        data: { status: 'APPROVED', decidedBy: adminId, decidedAt: new Date() },
      });
    });

    this.eventBus.emit('topup.approved', {
      topUpId: topupId,
      workerId: topUp.workerId,
      amount: Number(topUp.amount),
    });
    this.realtime.emitToRoom(walletRoom(topUp.workerId), WALLET_EVENTS.topupDecided, {
      topUpId: topupId,
      status: 'APPROVED',
      amount: Number(topUp.amount),
    });
    await this.emitBalance(topUp.workerId);
    return credited;
  }

  // ----- Commission lifecycle -------------------------------------------

  /**
   * Hold 10% of the locked visit charge at arrival. Blocks arrival when the
   * worker's wallet cannot cover the hold (INSUFFICIENT_BALANCE). Idempotent
   * per job via a Redis marker + the unique WalletLedger.idempotencyKey.
   */
  async holdCommissionForJob(workerId: string, jobId: string) {
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
      select: { lockedVisitCharge: true, selectedWorkerId: true },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const rate = await this.getCommissionRate();
    const amount = calculateCommission(Number(job.lockedVisitCharge ?? 0), rate);
    if (amount <= 0) {
      return { held: false, amount: 0, reason: 'NO_COMMISSION' };
    }

    // Database source-of-truth check: if commission or hold ledger already exists, consider already held
    const [existingCommission, existingHoldLedger] = await Promise.all([
      this.prisma.commission.findUnique({ where: { jobId } }),
      this.prisma.walletLedger.findUnique({ where: { idempotencyKey: `hold:${jobId}` } }),
    ]);
    if (existingCommission) {
      return {
        held: true,
        alreadyHeld: true,
        commissionId: existingCommission.id,
        amount,
      };
    }
    if (existingHoldLedger) {
      return {
        held: true,
        alreadyHeld: true,
        amount,
      };
    }

    const key = `${WALLET_IDEMPOTENCY_PREFIX}hold:${jobId}`;
    const claimed = await this.claimIdempotencyKey(key);
    if (!claimed) {
      return {
        held: true,
        alreadyHeld: true,
        commissionId: existingCommission?.id,
        amount,
      };
    }

    // Admin-configured negative-balance floor (settings page → walletMaxNegativeBalance).
    const floor = await this.getWalletMaxNegativeBalance();

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.workerWallet.upsert({
          where: { userId: workerId },
          update: {},
          create: { userId: workerId },
        });
        const balance = Number(wallet.balance);
        const heldBalance = Number(wallet.heldBalance);
        const newBalance = Math.round((balance - amount) * 100) / 100;
        if (newBalance < floor) {
          throw new BadRequestException(
            `INSUFFICIENT_BALANCE: wallet balance Rs. ${balance} cannot cover the commission hold Rs. ${amount} without falling below the minimum balance Rs. ${floor}. Top up your wallet before arriving.`,
          );
        }
        const newHeld = Math.round((heldBalance + amount) * 100) / 100;
        await tx.workerWallet.update({
          where: { userId: workerId },
          data: { balance: newBalance, heldBalance: newHeld },
        });
        // Offline rule: a worker with negative balance cannot take/send new work until they top up.
        if (newBalance < 0) {
          await tx.workerProfile.updateMany({
            where: { userId: workerId, isAvailable: true },
            data: { isAvailable: false },
          });
        }
        const commission = await tx.commission.upsert({
          where: { jobId },
          update: {},
          create: {
            jobId,
            workerId,
            visitCharge: job.lockedVisitCharge!,
            commissionRate: rate,
            amount,
            status: 'PENDING',
          },
        });
        await this.ledger.insert(tx, {
          userId: workerId,
          type: WalletLedgerType.COMMISSION_HELD,
          amount: -amount,
          balanceAfter: newBalance,
          referenceType: 'job',
          referenceId: jobId,
          note: `Commission held for job ${jobId}`,
          idempotencyKey: `hold:${jobId}`,
        });
        return {
          commissionId: commission.id,
          held: true,
          amount,
          balanceAfter: newBalance,
          heldAfter: newHeld,
        };
      });

      this.eventBus.emit('commission.held', {
        commissionId: result.commissionId,
        jobId,
        workerId,
        amount,
      });
      this.realtime.emitToRoom(walletRoom(workerId), WALLET_EVENTS.commissionHeld, {
        jobId,
        commissionId: result.commissionId,
        amount,
      });
      await this.emitBalance(workerId);
      return { held: true, amount, ...result };
    } catch (error) {
      // Release the marker on failure so the same job can be retried.
      await this.redis.del(key);
      if (
        error instanceof BadRequestException &&
        String(error.message).startsWith('INSUFFICIENT_BALANCE')
      ) {
        const wallet = await this.getBalance(workerId);
        this.eventBus.emit('wallet.insufficientBalance', {
          workerId,
          balance: wallet.balance,
          required: amount,
          maxNegativeBalance: floor,
        });
      }
      throw error;
    }
  }

  /**
   * Transfer a held commission to the platform wallet. Incoming payments are
   * confirmed via the Commission -> RECEIVED transition (payment screenshot
   * submitted). Idempotent per job.
   */
  async confirmCommission(jobId: string, commissionId: string) {
    const commission = await this.prisma.commission.findUnique({ where: { id: commissionId } });
    if (!commission || commission.jobId !== jobId) {
      throw new NotFoundException('Commission not found');
    }
    if (commission.status !== 'RECEIVED') {
      return {
        confirmed: false,
        reason: commission.status === 'VERIFIED' ? 'ALREADY_CONFIRMED' : 'NOT_RECEIVED',
      };
    }
    const workerId = commission.workerId;
    const amount = Number(commission.amount);

    const key = `${WALLET_IDEMPOTENCY_PREFIX}confirm:${jobId}`;
    const claimed = await this.claimIdempotencyKey(key);
    if (!claimed) {
      return { confirmed: true, alreadyConfirmed: true, amount };
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.workerWallet.upsert({
          where: { userId: workerId },
          update: {},
          create: { userId: workerId },
        });
        const heldBalance = Number(wallet.heldBalance);
        if (heldBalance < amount) {
          throw new BadRequestException(
            `COMMISSION_NOT_HELD: no ${amount}-rupee hold exists for this job`,
          );
        }
        const newHeld = Math.round((heldBalance - amount) * 100) / 100;
        await tx.workerWallet.update({
          where: { userId: workerId },
          data: { heldBalance: newHeld },
        });
        await this.ledger.insert(tx, {
          userId: workerId,
          type: WalletLedgerType.COMMISSION_DEDUCTED,
          amount: -amount,
          balanceAfter: Number(wallet.balance),
          referenceType: 'commission',
          referenceId: commissionId,
          note: PLATFORM_COMMISSION_NOTICE,
          idempotencyKey: `confirm:${jobId}`,
        });
        await tx.platformWallet.upsert({
          where: { id: PLATFORM_WALLET_ID },
          update: {
            balance: { increment: amount },
            totalCommissions: { increment: amount },
          },
          create: {
            id: PLATFORM_WALLET_ID,
            balance: amount,
            totalCommissions: amount,
          },
        });
        await tx.commission.update({
          where: { id: commissionId },
          data: { status: 'VERIFIED', verifiedAt: new Date() },
        });
        return { heldAfter: newHeld, amount };
      });

      this.eventBus.emit('commission.deducted', { commissionId, jobId, workerId, amount });
      this.realtime.emitToRoom(walletRoom(workerId), WALLET_EVENTS.commissionDeducted, {
        jobId,
        commissionId,
        amount,
      });
      await this.emitBalance(workerId);
      return { confirmed: true, amount, ...result };
    } catch (error) {
      await this.redis.del(key);
      throw error;
    }
  }

  /**
   * Reverse a held commission back into the worker's available balance. Only
   * PENDING (not yet paid/confirmed) commissions can be reversed. Idempotent.
   */
  async reverseCommissionForJob(jobId: string) {
    const commission = await this.prisma.commission.findUnique({
      where: { jobId },
      select: { id: true, workerId: true, amount: true, status: true },
    });
    if (!commission || commission.status !== 'PENDING') {
      return {
        reversed: false,
        reason: commission?.status === 'RECEIVED' ? 'ALREADY_CONFIRMED' : 'NOT_HELD',
      };
    }
    const workerId = commission.workerId;
    const amount = Number(commission.amount);

    const key = `${WALLET_IDEMPOTENCY_PREFIX}reverse:${jobId}`;
    const claimed = await this.claimIdempotencyKey(key);
    if (!claimed) {
      return { reversed: true, alreadyReversed: true, amount };
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.workerWallet.upsert({
          where: { userId: workerId },
          update: {},
          create: { userId: workerId },
        });
        const heldBalance = Number(wallet.heldBalance);
        if (heldBalance < amount) {
          throw new BadRequestException('COMMISSION_NOT_HELD: nothing to reverse');
        }
        const balance = Number(wallet.balance);
        const newBalance = Math.round((balance + amount) * 100) / 100;
        const newHeld = Math.round((heldBalance - amount) * 100) / 100;
        await tx.workerWallet.update({
          where: { userId: workerId },
          data: { balance: newBalance, heldBalance: newHeld },
        });
        await this.ledger.insert(tx, {
          userId: workerId,
          type: WalletLedgerType.COMMISSION_RELEASED,
          amount,
          balanceAfter: newBalance,
          referenceType: 'commission',
          referenceId: commission.id,
          note: 'Commission reversed — job cancelled before confirmation',
          idempotencyKey: `reverse:${jobId}`,
        });
        // A reversed hold was never paid; remove the commission row entirely.
        await tx.commission.delete({ where: { id: commission.id } });
        return { balanceAfter: newBalance, heldAfter: newHeld, amount };
      });

      this.eventBus.emit('commission.reversed', {
        commissionId: commission.id,
        jobId,
        workerId,
        amount,
      });
      this.realtime.emitToRoom(walletRoom(workerId), WALLET_EVENTS.commissionReversed, {
        jobId,
        commissionId: commission.id,
        amount,
      });
      await this.emitBalance(workerId);
      return { reversed: true, amount, ...result };
    } catch (error) {
      await this.redis.del(key);
      throw error;
    }
  }

  /**
   * Credit a worker's earnings when a job completes:
   * - Worker Earnings = locked visit charge + approved repair charge (only if ACCEPTED).
   *   If repair quote was rejected, repair earnings = 0, so Earnings = visit charge only.
   * - Wallet Deduction = 10% of locked visit charge ONLY.
   *   The repair price must NOT be deducted from the worker wallet.
   * - Worker wallet balance must NEVER increase from job completion or earnings.
   *   (Only Admin wallet top-up increases worker wallet balance).
   * - If commission was held at visit arrival, the hold is confirmed/released without
   *   double deduction, and wallet balance does not increase.
   * - If commission was not held, 10% of visit charge is deducted from wallet balance.
   * - Idempotent per job.
   */
  async recordEarningsForJob(jobId: string) {
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
      select: {
        lockedVisitCharge: true,
        suggestedVisitCharge: true,
        selectedWorkerId: true,
        repairs: {
          where: { status: 'ACCEPTED' },
          select: { lockedAmount: true, amount: true },
        },
      },
    });
    if (!job || !job.selectedWorkerId) return { credited: false, reason: 'NO_WORKER' };
    const visitFee = Number(job.lockedVisitCharge ?? job.suggestedVisitCharge ?? 0);
    const repairFee = job.repairs?.[0]
      ? Number(job.repairs[0].lockedAmount ?? job.repairs[0].amount ?? 0)
      : 0;
    const grossAmount = visitFee + repairFee;
    if (grossAmount <= 0) return { credited: false, reason: 'NO_CHARGE' };
    const workerId = job.selectedWorkerId;

    // Database source-of-truth check: if commission ledger entry already exists, consider already processed
    const existingCommissionLedger = await this.prisma.walletLedger.findUnique({
      where: { idempotencyKey: `commission:${jobId}` },
    });
    if (existingCommissionLedger) {
      return { credited: true, alreadyCredited: true, amount: grossAmount };
    }

    const key = `${WALLET_IDEMPOTENCY_PREFIX}earnings:${jobId}`;
    const claimed = await this.claimIdempotencyKey(key);
    if (!claimed) return { credited: true, alreadyCredited: true, amount: grossAmount };

    // Platform commission is 10% of Visit Fee ONLY!
    const rate = await this.getCommissionRate();
    const commissionAmount = calculateCommission(visitFee, rate);
    const netAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.workerWallet.upsert({
          where: { userId: workerId },
          update: {},
          create: { userId: workerId },
        });

        // Check if commission was already held for this job at visit arrival
        const existingCommission = await tx.commission.findUnique({ where: { jobId } });
        let heldToRelease = 0;
        if (existingCommission && existingCommission.status === 'PENDING') {
          heldToRelease = Number(existingCommission.amount);
        }
        const currentHeld = Number(wallet.heldBalance);
        const currentBalance = Number(wallet.balance);

        let finalBalance = currentBalance;
        let finalHeld = currentHeld;

        if (heldToRelease > 0 && currentHeld >= heldToRelease) {
          // Commission was already held at arrival (balance was already decremented by heldToRelease at arrival).
          // Now confirm deduction by releasing held money from heldBalance.
          // Wallet balance must NEVER increase from job earnings!
          finalHeld = Math.max(0, Math.round((currentHeld - heldToRelease) * 100) / 100);
        } else if (commissionAmount > 0) {
          // Commission was not held at arrival or heldBalance is 0 -> deduct 10% of visit fee directly from wallet balance
          finalBalance = Math.round((currentBalance - commissionAmount) * 100) / 100;
          finalHeld = Math.max(0, Math.round((currentHeld - heldToRelease) * 100) / 100);
        }

        await tx.workerWallet.update({
          where: { userId: workerId },
          data: { balance: finalBalance, heldBalance: finalHeld },
        });

        if (finalBalance < 0) {
          await tx.workerProfile.updateMany({
            where: { userId: workerId, isAvailable: true },
            data: { isAvailable: false },
          });
        }

        // Platform Commission deduction ledger entry (10% of Visit Fee only)
        if (commissionAmount > 0) {
          await this.ledger.insert(tx, {
            userId: workerId,
            type: WalletLedgerType.COMMISSION_DEDUCTED,
            amount: -commissionAmount,
            balanceAfter: finalBalance,
            referenceType: 'commission',
            referenceId: existingCommission?.id ?? jobId,
            note: `Platform commission deduction (10% of visit fee): -Rs. ${commissionAmount}`,
            idempotencyKey: `commission:${jobId}`,
          });

          // Credit platform wallet
          await tx.platformWallet.upsert({
            where: { id: PLATFORM_WALLET_ID },
            update: {
              balance: { increment: commissionAmount },
              totalCommissions: { increment: commissionAmount },
            },
            create: {
              id: PLATFORM_WALLET_ID,
              balance: commissionAmount,
              totalCommissions: commissionAmount,
            },
          });
        }

        // Mark commission VERIFIED
        await tx.commission.upsert({
          where: { jobId },
          update: {
            amount: commissionAmount,
            visitCharge: visitFee,
            status: 'VERIFIED',
            verifiedAt: new Date(),
          },
          create: {
            jobId,
            workerId,
            visitCharge: visitFee,
            commissionRate: rate,
            amount: commissionAmount,
            status: 'VERIFIED',
            verifiedAt: new Date(),
          },
        });

        return {
          grossAmount,
          repairAmount: repairFee,
          commissionAmount,
          netAmount,
          balanceAfter: finalBalance,
          heldAfter: finalHeld,
        };
      });

      this.eventBus.emit('earnings.recorded', {
        jobId,
        workerId,
        amount: grossAmount,
        grossAmount,
        commission: commissionAmount,
      });
      this.realtime.emitToRoom(walletRoom(workerId), WALLET_EVENTS.earningsRecorded, {
        jobId,
        amount: grossAmount,
        grossAmount,
        repairAmount: repairFee,
        commission: commissionAmount,
        netAmount,
      });
      await this.emitBalance(workerId);
      return { credited: true, amount: grossAmount, ...result };
    } catch (error) {
      await this.redis.del(key);
      throw error;
    }
  }

  async getPlatformWallet() {
    return this.prisma.platformWallet.findUnique({ where: { id: PLATFORM_WALLET_ID } });
  }

  /** Atomic SET NX marker. Returns false when the key already exists (already processed). */
  private async claimIdempotencyKey(key: string): Promise<boolean> {
    const client = this.redis.getClient();
    const result = await client.set(key, '1', 'EX', WALLET_IDEMPOTENCY_TTL_SECONDS, 'NX');
    return result !== null;
  }
}
