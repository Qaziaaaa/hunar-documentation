import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma, WalletLedgerType } from '@prisma/client';
import { createHash, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import {
  WALLET_IDEM_COMMISSION_DEDUCT,
  WALLET_IDEM_COMMISSION_HOLD,
  WALLET_IDEM_COMMISSION_REVERSE,
  WALLET_IDEM_EARNINGS_CREDIT,
  WALLET_IDEM_TOPUP_CREDIT,
  WALLET_IDEM_WITHDRAWAL,
  WALLET_OTP_ATTEMPTS_PREFIX,
  WALLET_OTP_PREFIX,
} from '../../common/redis/redis.constants';
import { generateOtp } from '../../common/helpers/otp.generator';
import { calculateCommission } from '../../common/helpers/commission.util';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { SmsService } from '../auth/sms.service';
import {
  INSUFFICIENT_BALANCE_MESSAGE,
  PLATFORM_WALLET_ID,
  roundMoney,
  WALLET_COMPLETION_OTP_MAX_ATTEMPTS,
  WALLET_COMPLETION_OTP_TTL_SECONDS,
  WALLET_IDEMPOTENCY_TTL_SECONDS,
  WALLET_MAX_NEGATIVE_BALANCE,
  WALLET_MIN_WITHDRAWAL,
  WALLET_TOPUP_PAYMENT_NUMBER,
} from './wallet.constants';
import {
  ConfirmCommissionDto,
  TopUpDto,
  VerifyTopUpDto,
  WalletQueryDto,
  WithdrawDto,
} from './wallet.validation';

type WalletDb = Prisma.TransactionClient;

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly sms: SmsService,
    private readonly eventBus: EventBusService,
  ) {}

  // ---------------- Public reads ----------------

  async getOrCreateWallet(workerId: string) {
    return this.prisma.workerWallet.upsert({
      where: { userId: workerId },
      update: {},
      create: { userId: workerId },
    });
  }

  async getBalance(workerId: string) {
    const wallet = await this.getOrCreateWallet(workerId);
    return { balance: this.toNumber(wallet.balance), currency: 'PKR' };
  }

  async getLedger(workerId: string, query: WalletQueryDto) {
    const wallet = await this.getOrCreateWallet(workerId);
    const { page, limit, skip } = normalizePage(query);
    const [entries, total] = await this.prisma.$transaction([
      this.prisma.walletLedger.findMany({
        where: { userId: wallet.userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletLedger.count({ where: { userId: wallet.userId } }),
    ]);
    return toPageResult(
      entries.map((e) => ({
        id: e.id,
        type: e.type,
        amount: this.toNumber(e.amount),
        balanceAfter: this.toNumber(e.balanceAfter),
        jobId: e.referenceType === 'job' ? e.referenceId : undefined,
        topUpId: e.referenceType === 'topup' ? e.referenceId : undefined,
        commissionId: e.referenceType === 'commission' ? e.referenceId : undefined,
        note: e.note,
        createdAt: e.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  async getPlatformBalance() {
    const platform = await this.prisma.platformWallet.findUnique({
      where: { id: PLATFORM_WALLET_ID },
    });
    return {
      balance: platform ? this.toNumber(platform.balance) : 0,
      currency: 'PKR',
    };
  }

  // ---------------- Top-up flow ----------------

  async requestTopUp(workerId: string, dto: TopUpDto) {
    const wallet = await this.getOrCreateWallet(workerId);
    const topUp = await this.prisma.walletTopup.create({
      data: {
        workerId,
        amount: new Prisma.Decimal(dto.amount),
        screenshotUrl: dto.screenshotUrl,
        note: dto.transactionRef ? `Ref: ${dto.transactionRef}` : undefined,
        status: 'PENDING',
      },
    });
    this.eventBus.emit('topup.submitted', {
      topUpId: topUp.id,
      workerId,
      amount: dto.amount,
    });
    return { ...this.toTopUpView(topUp), topUpTo: WALLET_TOPUP_PAYMENT_NUMBER };
  }

  async getTopUpStatus(workerId: string, query: WalletQueryDto) {
    const { page, limit, skip } = normalizePage(query);
    const where = { workerId };
    const [topUps, total] = await this.prisma.$transaction([
      this.prisma.walletTopup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTopup.count({ where }),
    ]);
    return toPageResult(topUps.map((t) => this.toTopUpView(t)), total, page, limit);
  }

  async verifyTopUp(topUpId: string, action: 'approve' | 'reject', note?: string) {
    const topUp = await this.prisma.walletTopup.findUnique({ where: { id: topUpId } });
    if (!topUp) {
      throw new NotFoundException('WALLET_TOPUP_NOT_FOUND: top-up not found');
    }
    if (topUp.status !== 'PENDING') {
      throw new ConflictException(
        'WALLET_TOPUP_ALREADY_DECIDED: this top-up has already been verified',
      );
    }

    if (action === 'approve') {
      const idemKey = `${WALLET_IDEM_TOPUP_CREDIT}${topUpId}`;
      await this.ensureNotIdempotent(idemKey, 'WALLET_TOPUP_ALREADY_DECIDED');
      const amount = this.toNumber(topUp.amount);
      await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.workerWallet.findUnique({ where: { userId: topUp.workerId } });
        if (!wallet) {
          throw new NotFoundException('WALLET_NOT_FOUND');
        }
        const balanceAfter = roundMoney(this.toNumber(wallet.balance) + amount);
        await tx.workerWallet.update({
          where: { userId: wallet.userId },
          data: { balance: new Prisma.Decimal(balanceAfter) },
        });
        await tx.walletTopup.update({
          where: { id: topUpId },
          data: { status: 'APPROVED', reason: note, decidedAt: new Date() },
        });
        await this.addLedgerEntry(tx, wallet.userId, 'TOPUP_CREDIT', amount, balanceAfter, {
          referenceType: 'topup',
          referenceId: topUpId,
          note,
          idempotencyKey: idemKey,
        });
        await this.enforceOfflineRule(tx, topUp.workerId, balanceAfter);
      });
      await this.markIdempotent(idemKey);
      this.eventBus.emit('topup.approved', { topUpId, workerId: topUp.workerId, amount });
    } else {
      await this.prisma.walletTopup.update({
        where: { id: topUpId },
        data: { status: 'REJECTED', reason: note, decidedAt: new Date() },
      });
      this.eventBus.emit('topup.rejected', {
        topUpId,
        workerId: topUp.workerId,
        amount: this.toNumber(topUp.amount),
        reason: note,
      });
    }
    return this.prisma.walletTopup.findUniqueOrThrow({ where: { id: topUpId } });
  }

  // ---------------- Commission lifecycle ----------------

  /** Hold 10% of the locked visit charge on "I've Arrived". Idempotent per job. */
  async holdCommission(
    params: { jobId: string; workerId: string },
    tx?: WalletDb,
  ): Promise<{
    commission: { id: string; status: string; amount: number } | null;
    balanceAfter: number;
    held: boolean;
    skipped: boolean;
  }> {
    if (tx) {
      return this.applyHold(tx, params);
    }
    return this.prisma.$transaction((t) => this.applyHold(t, params));
  }

  /** Finalize the hold + credit the platform wallet on customer-OTP confirmation. */
  async confirmCommission(workerId: string, dto: ConfirmCommissionDto) {
    const existing = await this.prisma.commission.findFirst({
      where: { jobId: dto.jobId },
      select: { id: true, status: true, amount: true },
    });
    if (existing && (existing.status === 'RECEIVED' || existing.status === 'VERIFIED')) {
      return { commission: existing, balanceAfter: 0, finalized: true, alreadyFinalized: true };
    }
    await this.verifyCompletionOtp(dto.jobId, dto.otp);
    return this.prisma.$transaction((t) => this.applyConfirm(t, workerId, dto.jobId));
  }

  /** Reverse a held commission when the job is cancelled before OTP. Idempotent. */
  async reverseCommission(jobId: string, workerId?: string) {
    return this.prisma.$transaction((t) => this.applyReverse(t, jobId, workerId));
  }

  // ---------------- Withdraw ----------------

  async withdraw(workerId: string, dto: WithdrawDto) {
    const amount = roundMoney(dto.amount);
    if (amount < WALLET_MIN_WITHDRAWAL) {
      throw new BadRequestException(
        `WALLET_WITHDRAWAL_MIN: minimum withdrawal is Rs. ${WALLET_MIN_WITHDRAWAL}`,
      );
    }
    let idemKey: string | null = null;
    if (dto.requestId) {
      idemKey = `${WALLET_IDEM_WITHDRAWAL}${dto.requestId}`;
      if (await this.isIdempotent(idemKey)) {
        return { status: 'ALREADY_PROCESSED', amount };
      }
    }
    return this.prisma.$transaction(async (tx) => {
      const wallet = await this.getOrCreateWalletWith(tx, workerId);
      const balance = this.toNumber(wallet.balance);
      if (balance < amount) {
        throw new BadRequestException(
          'WALLET_INSUFFICIENT_BALANCE: withdrawal exceeds available balance',
        );
      }
      const balanceAfter = roundMoney(balance - amount);
      await tx.workerWallet.update({
        where: { userId: wallet.userId },
        data: { balance: new Prisma.Decimal(balanceAfter) },
      });
      await this.addLedgerEntry(tx, wallet.userId, 'WITHDRAWAL', amount, balanceAfter, {
        note: 'Self-service withdrawal payout',
        idempotencyKey: idemKey ?? undefined,
      });
      await this.enforceOfflineRule(tx, workerId, balanceAfter);
      if (idemKey) {
        await this.markIdempotent(idemKey);
      }
      return { status: 'PROCESSED', amount, balanceAfter };
    });
  }

  // ---------------- Earnings + completion OTP (repair.completed) ----------------

  @OnEvent('repair.completed')
  async handleRepairCompleted(payload: { repairId: string; jobId: string }) {
    await this.safe('repair.completed.wallet-earnings', async () => {
      const repair = await this.prisma.repair.findUnique({
        where: { id: payload.repairId },
        include: { job: true },
      });
      if (!repair || repair.job.lockedVisitCharge == null) {
        return;
      }
      const jobId = payload.jobId;
      const workerId = repair.workerId;
      const amount = this.toNumber(repair.job.lockedVisitCharge);
      const existingCredit = await this.prisma.walletLedger.findFirst({
        where: { userId: workerId, referenceType: 'job', referenceId: jobId, type: 'EARNINGS_CREDIT' },
      });
      if (existingCredit) {
        return;
      }
      await this.prisma.$transaction(async (tx) => {
        const wallet = await this.getOrCreateWalletWith(tx, workerId);
        const balanceAfter = roundMoney(this.toNumber(wallet.balance) + amount);
        await tx.workerWallet.update({
          where: { userId: wallet.userId },
          data: { balance: new Prisma.Decimal(balanceAfter) },
        });
        await this.addLedgerEntry(tx, wallet.userId, 'EARNINGS_CREDIT', amount, balanceAfter, {
          referenceType: 'job',
          referenceId: jobId,
          idempotencyKey: `${WALLET_IDEM_EARNINGS_CREDIT}${jobId}`,
        });
        await this.enforceOfflineRule(tx, workerId, balanceAfter);
      });
      await this.markIdempotent(`${WALLET_IDEM_EARNINGS_CREDIT}${jobId}`);
      this.eventBus.emit('earnings.recorded', { jobId, workerId, amount });

      // The platform sends the completion OTP to the customer (Section 12.3).
      const otp = generateOtp();
      await this.redis.set(
        `${WALLET_OTP_PREFIX}${jobId}`,
        JSON.stringify({ hash: this.hashValue(otp) }),
        WALLET_COMPLETION_OTP_TTL_SECONDS,
      );
      const customer = await this.prisma.user.findUnique({
        where: { id: repair.job.customerId },
        select: { phone: true },
      });
      if (customer) {
        await this.sms.sendOtp(customer.phone, otp);
      }
    });
  }

  // ---------------- Auto reverse on cancellation ----------------

  @OnEvent('job.cancelled')
  async handleJobCancelled(payload: { jobId: string; reason?: string }) {
    await this.safe('job.cancelled.wallet-reverse', async () => {
      await this.reverseCommission(payload.jobId);
    });
  }

  // ---------------- Hold internals ----------------

  private async applyHold(db: WalletDb, params: { jobId: string; workerId: string }) {
    const job = await db.serviceRequest.findUnique({ where: { id: params.jobId } });
    if (!job) {
      throw new NotFoundException('WALLET_JOB_NOT_FOUND: job does not exist');
    }
    if (job.lockedVisitCharge == null) {
      return { commission: null, balanceAfter: 0, held: false, skipped: true };
    }

    const existing = await db.commission.findFirst({ where: { jobId: params.jobId } });
    if (existing) {
      if (existing.status !== 'PENDING') {
        throw new BadRequestException(
          `WALLET_COMMISSION_NOT_HOLDABLE: commission is already ${existing.status}`,
        );
      }
      return {
        commission: { id: existing.id, status: existing.status, amount: this.toNumber(existing.amount) },
        balanceAfter: 0,
        held: true,
        skipped: false,
      };
    }

    const rate = this.config.get<number>('app.commissionRate', 0.1);
    const amount = calculateCommission(this.toNumber(job.lockedVisitCharge), rate);
    const wallet = await this.getOrCreateWalletWith(db, params.workerId);
    const balance = this.toNumber(wallet.balance);

    if (balance < amount) {
      this.eventBus.emit('wallet.insufficientBalance', {
        workerId: params.workerId,
        balance,
        required: amount,
        maxNegativeBalance: WALLET_MAX_NEGATIVE_BALANCE,
      });
      throw new BadRequestException(INSUFFICIENT_BALANCE_MESSAGE);
    }

    const balanceAfter = roundMoney(balance - amount);
    const commission = await db.commission.create({
      data: {
        jobId: params.jobId,
        workerId: params.workerId,
        visitCharge: job.lockedVisitCharge,
        commissionRate: new Prisma.Decimal(rate),
        amount: new Prisma.Decimal(amount),
        status: 'PENDING',
      },
    });
    await db.workerWallet.update({
      where: { userId: wallet.userId },
      data: { balance: new Prisma.Decimal(balanceAfter) },
    });
    await this.addLedgerEntry(db, wallet.userId, 'COMMISSION_HELD', amount, balanceAfter, {
      referenceType: 'commission',
      referenceId: commission.id,
      idempotencyKey: `${WALLET_IDEM_COMMISSION_HOLD}${params.jobId}`,
    });
    await this.enforceOfflineRule(db, params.workerId, balanceAfter);
    await this.markIdempotent(`${WALLET_IDEM_COMMISSION_HOLD}${params.jobId}`);

    this.eventBus.emit('commission.held', {
      commissionId: commission.id,
      jobId: params.jobId,
      workerId: params.workerId,
      amount,
    });
    return {
      commission: { id: commission.id, status: commission.status, amount },
      balanceAfter,
      held: true,
      skipped: false,
    };
  }

  private async applyConfirm(db: WalletDb, workerId: string, jobId: string) {
    const commission = await db.commission.findFirst({ where: { jobId } });
    if (!commission) {
      throw new NotFoundException('WALLET_COMMISSION_NOT_FOUND: no commission held for this job');
    }
    if (commission.workerId !== workerId) {
      throw new ForbiddenException('WALLET_COMMISSION_WORKER_MISMATCH');
    }
    if (commission.status === 'RECEIVED' || commission.status === 'VERIFIED') {
      return { commission: { id: commission.id, status: commission.status, amount: this.toNumber(commission.amount) }, balanceAfter: 0, finalized: true, alreadyFinalized: true };
    }
    if (commission.status !== 'PENDING') {
      throw new BadRequestException(
        `WALLET_COMMISSION_NOT_HELD: cannot confirm a ${commission.status} commission`,
      );
    }

    const amount = this.toNumber(commission.amount);
    const wallet = await db.workerWallet.findUnique({ where: { userId: workerId } });
    if (!wallet) {
      throw new NotFoundException('WALLET_NOT_FOUND');
    }
    const updated = await db.commission.update({
      where: { id: commission.id },
      data: { status: 'RECEIVED', verifiedAt: new Date() },
    });
    await db.platformWallet.upsert({
      where: { id: PLATFORM_WALLET_ID },
      update: { balance: { increment: commission.amount } },
      create: { id: PLATFORM_WALLET_ID, balance: new Prisma.Decimal(amount) },
    });
    const balanceAfter = this.toNumber(wallet.balance);
    await this.addLedgerEntry(db, wallet.userId, 'COMMISSION_DEDUCTED', amount, balanceAfter, {
      referenceType: 'commission',
      referenceId: commission.id,
      idempotencyKey: `${WALLET_IDEM_COMMISSION_DEDUCT}${jobId}`,
    });
    await this.markIdempotent(`${WALLET_IDEM_COMMISSION_DEDUCT}${jobId}`);
    await this.redis.del(`${WALLET_OTP_PREFIX}${jobId}`);
    await this.redis.del(`${WALLET_OTP_ATTEMPTS_PREFIX}${jobId}`);

    this.eventBus.emit('commission.deducted', {
      commissionId: commission.id,
      jobId,
      workerId,
      amount,
    });
    return {
      commission: { id: updated.id, status: updated.status, amount },
      balanceAfter,
      finalized: true,
      alreadyFinalized: false,
    };
  }

  private async applyReverse(db: WalletDb, jobId: string, requireWorkerId?: string) {
    const commission = await db.commission.findFirst({ where: { jobId } });
    if (!commission) {
      return null;
    }
    if (requireWorkerId && commission.workerId !== requireWorkerId) {
      throw new ForbiddenException('WALLET_COMMISSION_WORKER_MISMATCH');
    }
    // Can only reverse if commission is still in PENDING state (not yet confirmed/deducted)
    if (commission.status !== 'PENDING') {
      return {
        commission: { id: commission.id, status: commission.status, amount: this.toNumber(commission.amount) },
        balanceAfter: 0,
        reversed: false,
        alreadyReversed: true,
        reason: 'Commission already confirmed or verified',
      };
    }

    const amount = this.toNumber(commission.amount);
    const workerId = commission.workerId;
    const wallet = await db.workerWallet.findUnique({ where: { userId: workerId } });
    if (!wallet) {
      throw new NotFoundException('WALLET_NOT_FOUND');
    }
    const balanceAfter = roundMoney(this.toNumber(wallet.balance) + amount);
    await db.workerWallet.update({
      where: { userId: wallet.userId },
      data: { balance: new Prisma.Decimal(balanceAfter) },
    });
    await this.addLedgerEntry(db, wallet.userId, 'COMMISSION_RELEASED', amount, balanceAfter, {
      referenceType: 'commission',
      referenceId: commission.id,
      idempotencyKey: `${WALLET_IDEM_COMMISSION_REVERSE}${jobId}`,
    });
    await this.markIdempotent(`${WALLET_IDEM_COMMISSION_REVERSE}${jobId}`);

    this.eventBus.emit('commission.reversed', {
      commissionId: commission.id,
      jobId,
      workerId,
      amount,
    });
    return {
      commission: { id: commission.id, status: commission.status, amount },
      balanceAfter,
      reversed: true,
      alreadyReversed: false,
    };
  }

  // ---------------- Shared helpers ----------------

  private async getOrCreateWalletWith(db: WalletDb, workerId: string) {
    return db.workerWallet.upsert({
      where: { userId: workerId },
      update: {},
      create: { userId: workerId },
    });
  }

  private async addLedgerEntry(
    db: WalletDb,
    userId: string,
    type: WalletLedgerType,
    amount: number,
    balanceAfter: number,
    ref: { referenceType?: string; referenceId?: string; jobId?: string; note?: string; idempotencyKey?: string } = {},
  ) {
    const idempotencyKey = ref.idempotencyKey ?? `${type}:${userId}:${ref.referenceType ?? 'none'}:${ref.referenceId ?? ref.jobId ?? 'none'}:${Date.now()}`;
    await db.walletLedger.create({
      data: {
        userId,
        type,
        amount: new Prisma.Decimal(amount),
        balanceAfter: new Prisma.Decimal(balanceAfter),
        referenceType: ref.referenceType,
        referenceId: ref.referenceId,
        note: ref.note,
        idempotencyKey,
      },
    });
  }

  private async enforceOfflineRule(db: WalletDb, workerId: string, balance: number) {
    if (balance < WALLET_MAX_NEGATIVE_BALANCE) {
      await db.workerProfile.updateMany({
        where: { userId: workerId },
        data: { isAvailable: false },
      });
    }
  }

  private async verifyCompletionOtp(jobId: string, otp: string) {
    const key = `${WALLET_OTP_PREFIX}${jobId}`;
    const storedRaw = await this.redis.get(key);
    if (!storedRaw) {
      throw new BadRequestException(
        'WALLET_OTP_MISSING: no completion OTP has been sent for this job',
      );
    }
    const ttl = await this.redis.ttl(key);
    const attemptsKey = `${WALLET_OTP_ATTEMPTS_PREFIX}${jobId}`;
    const attempts = await this.redis.incr(attemptsKey);
    await this.redis.expire(attemptsKey, Math.max(ttl, 1));

    if (attempts > WALLET_COMPLETION_OTP_MAX_ATTEMPTS) {
      await this.redis.del(key);
      await this.redis.del(attemptsKey);
      throw new BadRequestException(
        'WALLET_OTP_ATTEMPTS_EXCEEDED: too many attempts, no completion OTP available',
      );
    }

    let stored: { hash: string };
    try {
      stored = JSON.parse(storedRaw) as { hash: string };
    } catch {
      throw new BadRequestException('WALLET_OTP_INVALID: could not read the stored completion OTP');
    }

    const a = Buffer.from(this.hashValue(otp), 'hex');
    const b = Buffer.from(stored.hash, 'hex');
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return;
    }
    throw new BadRequestException(
      `WALLET_OTP_INVALID: ${WALLET_COMPLETION_OTP_MAX_ATTEMPTS - attempts} attempts remaining`,
    );
  }

  private async ensureNotIdempotent(key: string, message: string) {
    if (await this.isIdempotent(key)) {
      throw new ConflictException(message);
    }
  }

  private async isIdempotent(key: string): Promise<boolean> {
    return this.redis.exists(key);
  }

  private async markIdempotent(key: string | null) {
    if (!key) return;
    await this.redis.set(key, '1', WALLET_IDEMPOTENCY_TTL_SECONDS);
  }

  private toTopUpView(t: {
    id: string;
    amount: Prisma.Decimal | number;
    screenshotUrl: string;
    note: string | null;
    status: string;
    reason: string | null;
    decidedBy: string | null;
    decidedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: t.id,
      amount: this.toNumber(t.amount),
      screenshotUrl: t.screenshotUrl,
      note: t.note,
      status: t.status,
      reason: t.reason,
      decidedBy: t.decidedBy,
      decidedAt: t.decidedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }

  private toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
    return value === null || value === undefined ? 0 : Number(value);
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private async safe(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.logger.error(
        `wallet event handler failed for ${name}`,
        error instanceof Error ? error.stack ?? error.message : String(error),
      );
    }
  }
}