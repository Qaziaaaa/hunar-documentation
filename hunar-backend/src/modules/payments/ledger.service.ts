import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  normalizePage,
  toPageResult,
} from '../../common/helpers/pagination.util';
import { CustomerPaymentsQueryDto } from './payments.validation';

/**
 * Worker payout ledger (Module 3 — Payments Backend, Shafqat).
 *
 * A read-only, money-in-transit projection over the same `Payment` rows that
 * PaymentsService owns — the ledger is never a second source of truth. It
 * answers the house/worker question "what have I been promised, what is
 * verified, and where is the rest sitting right now?" from the authoritative
 * Payment workflow (INITIATED -> PROCESSING -> COMPLETED/FAILED -> REFUNDED,
 * with `verifiedAt` set when a verifier confirms the screenshot).
 */
@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Money in transit = in-flight (INITIATED/PROCESSING) rows — amounts already
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
