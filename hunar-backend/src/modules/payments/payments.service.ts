import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentGateway, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RealtimeService } from '../realtime/realtime.service';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { userRoom } from '../jobs/jobs.events';
import { toPageResult, normalizePage } from '../../common/helpers/pagination.util';
import { CreatePaymentDto, CustomerPaymentsQueryDto } from './payments.validation';
import { PaymentGatewayProvider } from './gateways/gateway.interface';

// Module-3 DOMAIN EVENTS (Payments Backend, Shafqat) — emitted on the shared event bus.
export const PAYMENT_EVENTS = {
  paymentInitiated: 'payment:initiated',
  paymentProcessing: 'payment:processing',
  paymentCompleted: 'payment:completed',
  paymentFailed: 'payment:failed',
  paymentRefunded: 'payment:refunded',
} as const;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * House gateway registry: gateway name -> charge implementation.
   * Gateways are resolved by `name` in the PaymentsModule DI container.
   */
  private readonly gateways: Record<PaymentGateway, PaymentGatewayProvider>;

  /**
   * Idempotency key for an in-flight (INITIATED/PROCESSING) charge on the same
   * (jobId, customerId, workerId, method, gateway). Prevents duplicate "Initiate
   * Payment" requests from double-charging when the customer taps twice.
   */
  private idempotencyKey(payment: {
    jobId: string;
    customerId: string;
    workerId: string;
    method: string;
    gateway?: string | null;
  }): string {
    return [payment.jobId, payment.customerId, payment.workerId, payment.method, payment.gateway ?? ''].join(':');
  }

  async createPayment(customerId: string, dto: CreatePaymentDto): Promise<unknown> {
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: dto.jobId },
      select: {
        id: true,
        customerId: true,
        selectedWorkerId: true,
        suggestedVisitCharge: true,
        lockedVisitCharge: true,
        status: true,
      },
    });
    if (!job) {
      throw new NotFoundException('Payment: job not found');
    }
    if (job.customerId !== customerId) {
      throw new ForbiddenException('Payment: not your job');
    }
    if (!job.selectedWorkerId) {
      throw new BadRequestException('Payment: job has no assigned worker yet');
    }

    const worker = await this.prisma.user.findUnique({
      where: { id: job.selectedWorkerId },
      select: { id: true, phone: true },
    });
    if (!worker) {
      throw new BadRequestException('Payment: assigned worker no longer exists');
    }

    const method = dto.method ?? PaymentMethod.COD;
    const gateway = (dto.gateway ?? null) as PaymentGateway | null;

    // Idempotency guard: already-initiated payment for this exact intent (same
    // job/customer/worker/method/gateway) — return the existing row, do not re-charge.
    const existing = await this.prisma.payment.findFirst({
      where: {
        jobId: job.id,
        customerId,
        workerId: job.selectedWorkerId!,
        method,
        ...(gateway ? { gateway } : {}),
        status: { in: [PaymentStatus.INITIATED, PaymentStatus.PROCESSING] },
      },
    });
    if (existing) {
      return { paymentId: existing.id, status: existing.status, idempotent: true };
    }

    const visitCharge = Number(job.lockedVisitCharge ?? job.suggestedVisitCharge ?? 0);

    const payment = await this.prisma.payment.create({
      data: {
        jobId: job.id,
        customerId,
        workerId: job.selectedWorkerId!,
        visitCharge,
        amount: dto.amount ?? visitCharge,
        method,
        status: PaymentStatus.INITIATED,
        ...(gateway ? { gateway } : {}),
        note: dto.note,
      },
    });

    await this.eventBus.emit(PAYMENT_EVENTS.paymentInitiated, {
      paymentId: payment.id,
      jobId: job.id,
      customerId,
      workerId: job.selectedWorkerId!,
      amount: Number(payment.amount),
    });
    await this.realtime?.emitToUsers?.(
      [customerId, job.selectedWorkerId!],
      'payment:initiated',
      { paymentId: payment.id, jobId: job.id, amount: Number(payment.amount) },
    );

    return { paymentId: payment.id, status: payment.status, idempotent: false };
  }

  async getCustomerPayments(customerId: string, query: CustomerPaymentsQueryDto) {
    const { page, limit, skip } = normalizePage(query);
    const take = limit;
    const where = {
      customerId,
      ...(query.status ? { status: query.status as PaymentStatus } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          job: { select: { id: true, title: true, status: true, area: true, city: true, createdAt: true } },
          worker: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return toPageResult(
      rows.map((p) => ({
        id: p.id,
        jobId: p.jobId,
        job: p.job,
        worker: p.worker,
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
