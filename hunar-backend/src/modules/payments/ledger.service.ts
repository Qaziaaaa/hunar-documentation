import { Injectable } from '@nestjs/common';
import { Prisma, WalletLedgerType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';

// One signed wallet movement. `amount` is positive for credits (+),
// negative for debits (−). `balanceAfter` is the available balance snapshot
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
}