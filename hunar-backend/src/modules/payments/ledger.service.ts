import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma, WalletLedgerType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
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

  async getWorkerLedger(workerId: string, query: CustomerPaymentsQueryDto) {
    const { page, limit, skip } = normalizePage(query);
    const inFlight: PaymentStatus[] = [
      PaymentStatus.INITIATED,
      PaymentStatus.PROCESSING,
    ];
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
