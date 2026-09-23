import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletLedgerType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { calculateCommission } from '../../common/helpers/commission.util';
import { RealtimeService } from '../realtime/realtime.service';
import { WALLET_EVENTS, walletRoom } from './wallet.events';
import { LedgerService } from './ledger.service';
import { TopupDecideDto, TopupDto, TopupQueryDto } from './payments.validation';

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
  ) {}

  private get commissionRate(): number {
    return Number(this.config.get<string>('app.commissionRate', '0.10'));
  }

  private commissionFor(visitCharge: number): number {
    return calculateCommission(visitCharge, this.commissionRate);
  }

  private async getOrCreateWallet(userId: string) {
    return this.prisma.workerWallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
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

    return {
      grossEarnings,
      commissionsPaid,
      commissionsHeld,
      commissionsReversed,
      netEarnings: grossEarnings - commissionsPaid,
      topupsCredited,
      balance: Number(wallet.balance),
      heldBalance: Number(wallet.heldBalance),
      totalBalance: Number(wallet.balance) + Number(wallet.heldBalance),
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
    const amount = this.commissionFor(Number(job.lockedVisitCharge ?? 0));
    if (amount <= 0) {
      return { held: false, amount: 0, reason: 'NO_COMMISSION' };
    }

    const key = `${WALLET_IDEMPOTENCY_PREFIX}hold:${jobId}`;
    const claimed = await this.claimIdempotencyKey(key);
    if (!claimed) {
      const existing = await this.prisma.commission.findUnique({ where: { jobId } });
      return {
        held: true,
        alreadyHeld: true,
        commissionId: existing?.id,
        amount,
      };
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.workerWallet.upsert({
          where: { userId: workerId },
          update: {},
          create: { userId: workerId },
        });
        const balance = Number(wallet.balance);
        const heldBalance = Number(wallet.heldBalance);
        if (balance < amount) {
          throw new BadRequestException(
            `INSUFFICIENT_BALANCE: wallet balance Rs. ${balance} cannot cover the commission hold Rs. ${amount}. Top up your wallet before arriving.`,
          );
        }
        const newBalance = Math.round((balance - amount) * 100) / 100;
        const newHeld = Math.round((heldBalance + amount) * 100) / 100;
        await tx.workerWallet.update({
          where: { userId: workerId },
          data: { balance: newBalance, heldBalance: newHeld },
        });
        const commission = await tx.commission.upsert({
          where: { jobId },
          update: {},
          create: {
            jobId,
            workerId,
            visitCharge: job.lockedVisitCharge!,
            commissionRate: this.commissionRate,
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
          maxNegativeBalance: 0,
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
   * Credit a worker's earnings when a job completes. Gross = locked visit charge;
   * commission was already held separately. Idempotent per job.
   */
  async recordEarningsForJob(jobId: string) {
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
      select: { lockedVisitCharge: true, selectedWorkerId: true },
    });
    if (!job || !job.selectedWorkerId) return { credited: false, reason: 'NO_WORKER' };
    const amount = Number(job.lockedVisitCharge ?? 0);
    if (amount <= 0) return { credited: false, reason: 'NO_CHARGE' };
    const workerId = job.selectedWorkerId;

    const key = `${WALLET_IDEMPOTENCY_PREFIX}earnings:${jobId}`;
    const claimed = await this.claimIdempotencyKey(key);
    if (!claimed) return { credited: true, alreadyCredited: true, amount };

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.workerWallet.upsert({
          where: { userId: workerId },
          update: {},
          create: { userId: workerId },
        });
        const newBalance = Math.round((Number(wallet.balance) + amount) * 100) / 100;
        await tx.workerWallet.update({
          where: { userId: workerId },
          data: { balance: newBalance },
        });
        await this.ledger.insert(tx, {
          userId: workerId,
          type: WalletLedgerType.EARNINGS_CREDIT,
          amount,
          balanceAfter: newBalance,
          referenceType: 'job',
          referenceId: jobId,
          note: 'Earnings credited on job completion',
          idempotencyKey: `earnings:${jobId}`,
        });
        return { balanceAfter: newBalance, amount };
      });

      this.eventBus.emit('earnings.recorded', { jobId, workerId, amount });
      this.realtime.emitToRoom(walletRoom(workerId), WALLET_EVENTS.earningsRecorded, {
        jobId,
        amount,
      });
      await this.emitBalance(workerId);
      return { credited: true, amount, ...result };
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
