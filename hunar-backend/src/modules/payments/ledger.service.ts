import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma, WalletLedgerType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePage, PageResult, toPageResult } from '../../common/helpers/pagination.util';
import { CustomerPaymentsQueryDto } from './payments.validation';

// One signed wallet movement. `amount` is positive for credits (+),
// negative for debits (ΓêÆ). `balanceAfter` is the available balance snapshot
// after the movement is applied (held money is tracked separately).
export interface LedgerEntry {
  userId: string;
  type: WalletLedgerType;
  amount: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  note?: string;
  idempotencyKey: string;
}

export interface LedgerQuery {
  page?: number;
  limit?: number;
  type?: WalletLedgerType;
}

/**
 * Wallet-transaction shape consumed by the worker wallet screen
 * (frontend `WalletTransaction`). The signed ledger row is the source of truth;
 * this is a presentation projection on top of it, so the raw fields
 * (`balanceAfter`, `referenceType`, `referenceId`, `note`, `createdAt`) are kept
 * alongside the display fields instead of being renamed away.
 */
export interface WalletTransactionView {
  id: string;
  /** Credit vs debit, derived from the sign of the signed ledger `amount`. */
  type: 'TOP_UP' | 'DEDUCTION';
  /** Always positive — the sign is carried by `type`. */
  amount: number;
  /** ISO timestamp, for clients that prefer to localise it themselves. */
  date: string;
  /** Pre-grouped day header, e.g. "23 September 2026". */
  displayDate: string;
  displayTime: string;
  description: string;
  resultingBalance: number;
  jobId?: string;
  jobTitle?: string;
  ledgerType: WalletLedgerType;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  note?: string;
  createdAt: Date;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DEFAULT_DESCRIPTIONS: Record<WalletLedgerType, string> = {
  [WalletLedgerType.TOPUP_CREDIT]: 'Wallet top-up',
  [WalletLedgerType.EARNINGS_CREDIT]: 'Earnings credited',
  [WalletLedgerType.COMMISSION_HELD]: 'Visit commission held',
  [WalletLedgerType.COMMISSION_DEDUCTED]: 'Visit commission deducted',
  [WalletLedgerType.COMMISSION_RELEASED]: 'Commission hold released',
  [WalletLedgerType.WITHDRAWAL]: 'Wallet withdrawal',
};

/** "23 September 2026" — the day bucket the wallet history groups rows under. */
export function formatLedgerDay(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "02:30 PM" — 12-hour clock with a zero-padded hour. */
export function formatLedgerTime(date: Date): string {
  const hours24 = date.getHours();
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${String(hours12).padStart(2, '0')}:${minutes} ${suffix}`;
}

/**
 * Worker payout ledger (Module 3 ΓÇö Payments Backend, Shafqat).
 *
 * A read-only, money-in-transit projection over the same `Payment` rows that
 * PaymentsService owns ΓÇö the ledger is never a second source of truth. It
 * answers the house/worker question "what have I been promised, what is
 * verified, and where is the rest sitting right now?" from the authoritative
 * Payment workflow (INITIATED -> PROCESSING -> COMPLETED/FAILED -> REFUNDED,
 * with `verifiedAt` set when a verifier confirms the screenshot).
 */

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /** Insert a ledger row inside the caller's interactive transaction. */
  async insert(tx: Prisma.TransactionClient, entry: LedgerEntry) {
    return tx.walletLedger.create({
      data: {
        userId: entry.userId,
        type: entry.type,
        amount: entry.amount,
        balanceAfter: entry.balanceAfter,
        referenceType: entry.referenceType,
        referenceId: entry.referenceId,
        note: entry.note,
        idempotencyKey: entry.idempotencyKey,
      },
    });
  }

  /** Paginated ledger for one worker, newest first. */
  async listForWorker(userId: string, query: LedgerQuery = {}) {
    const { page, limit, skip } = normalizePage(query);
    const where = {
      userId,
      ...(query.type ? { type: query.type as WalletLedgerType } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.walletLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletLedger.count({ where }),
    ]);
    return toPageResult(
      rows.map((r) => ({
        id: r.id,
        type: r.type,
        amount: Number(r.amount),
        balanceAfter: Number(r.balanceAfter),
        referenceType: r.referenceType,
        referenceId: r.referenceId,
        note: r.note,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  /**
   * Ledger rows projected onto the worker wallet screen's transaction shape.
   *
   * Resolves the job behind each row in two hops when needed: rows written by
   * the commission lifecycle carry `referenceType: 'commission'`, so the
   * commission id is mapped to its job first, then the job titles are fetched
   * for the whole page in a single `findMany` (no N+1).
   */
  async listTransactionsForWorker(
    userId: string,
    query: LedgerQuery = {},
  ): Promise<PageResult<WalletTransactionView>> {
    const page = await this.listForWorker(userId, query);
    const jobIds = await this.resolveJobIds(page.items);
    const titles = await this.loadJobTitles([...new Set(jobIds.values())]);

    return {
      items: page.items.map((row) => {
        const jobId = jobIds.get(row.id);
        const amount = Number(row.amount);
        const createdAt = row.createdAt;
        return {
          id: row.id,
          type: amount < 0 ? 'DEDUCTION' : 'TOP_UP',
          amount: Math.abs(amount),
          date: createdAt.toISOString(),
          displayDate: formatLedgerDay(createdAt),
          displayTime: formatLedgerTime(createdAt),
          description: row.note ?? DEFAULT_DESCRIPTIONS[row.type],
          resultingBalance: row.balanceAfter,
          ...(jobId ? { jobId, jobTitle: titles.get(jobId) } : {}),
          ledgerType: row.type,
          balanceAfter: row.balanceAfter,
          referenceType: row.referenceType,
          referenceId: row.referenceId,
          note: row.note,
          createdAt,
        };
      }),
      meta: page.meta,
    };
  }

  /** ledgerRowId -> jobId, for every row that can be traced back to a job. */
  private async resolveJobIds(
    rows: Array<{ id: string; referenceType?: string; referenceId?: string }>,
  ): Promise<Map<string, string>> {
    const resolved = new Map<string, string>();
    const commissionRefs = rows
      .filter((r) => r.referenceType === 'commission' && r.referenceId)
      .map((r) => r.referenceId as string);

    if (commissionRefs.length > 0) {
      const commissions = await this.prisma.commission.findMany({
        where: { id: { in: commissionRefs } },
        select: { id: true, jobId: true },
      });
      const jobIdByCommission = new Map(commissions.map((c) => [c.id, c.jobId]));
      for (const row of rows) {
        if (row.referenceType !== 'commission' || !row.referenceId) continue;
        const jobId = jobIdByCommission.get(row.referenceId);
        if (jobId) resolved.set(row.id, jobId);
      }
    }

    for (const row of rows) {
      if (row.referenceType === 'job' && row.referenceId) {
        resolved.set(row.id, row.referenceId);
      }
    }
    return resolved;
  }

  private async loadJobTitles(jobIds: string[]): Promise<Map<string, string>> {
    if (jobIds.length === 0) return new Map();
    const jobs = await this.prisma.serviceRequest.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true },
    });
    return new Map(jobs.map((j) => [j.id, j.title]));
  }

  async getWorkerLedger(workerId: string, query: CustomerPaymentsQueryDto) {
    const { page, limit, skip } = normalizePage(query);
    const inFlight: PaymentStatus[] = [PaymentStatus.INITIATED, PaymentStatus.PROCESSING];
    const where = {
      workerId,
      ...(query.status ? { status: query.status as PaymentStatus } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
              area: true,
              city: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    // Money in transit = in-flight (INITIATED/PROCESSING) rows ΓÇö amounts already
    // promised to this worker but not yet verified by the house on the screenshot.
    const [inFlightAgg, verifiedAgg] = await this.prisma.$transaction([
      this.prisma.payment.aggregate({
        where: { workerId, status: { in: inFlight } },
        _sum: { amount: true, visitCharge: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          workerId,
          status: PaymentStatus.COMPLETED,
          verifiedAt: { not: null },
        },
        _sum: { amount: true, visitCharge: true },
      }),
    ]);

    return toPageResult(
      rows.map((p) => ({
        id: p.id,
        jobId: p.jobId,
        job: p.job,
        visitCharge: Number(p.visitCharge),
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        gateway: p.gateway,
        transactionRef: p.transactionRef,
        paidAt: p.paidAt,
        verifiedAt: p.verifiedAt,
        createdAt: p.createdAt,
      })),
      total,
      page,
      limit,
    );
  }
}
