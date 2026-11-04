import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentGateway, PaymentMethod, PaymentStatus, Role } from '@prisma/client';
import { PaymentsService, PAYMENT_EVENTS } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RealtimeService } from '../realtime/realtime.service';

describe('PaymentsService (AUDIT-016)', () => {
  let service: PaymentsService;
  let prismaMock: any;
  let eventBusMock: any;
  let realtimeMock: any;

  const mockJob = {
    id: 'job-1',
    customerId: 'cust-1',
    selectedWorkerId: 'worker-1',
    suggestedVisitCharge: 500,
    lockedVisitCharge: 500,
    status: 'WORKER_ASSIGNED',
  };

  const mockWorker = {
    id: 'worker-1',
    phone: '+923001111111',
  };

  beforeEach(() => {
    prismaMock = {
      serviceRequest: {
        findUnique: jest.fn(async () => ({ ...mockJob })),
      },
      user: {
        findUnique: jest.fn(async () => ({ ...mockWorker })),
      },
      repair: {
        findFirst: jest.fn(async () => null),
      },
      payment: {
        findFirst: jest.fn(async () => null),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(async ({ data }: any) => ({
          id: 'pay-1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        update: jest.fn(async ({ where, data }: any) => ({
          id: where.id,
          ...data,
        })),
        count: jest.fn(async () => 1),
      },
      $transaction: jest.fn(async (callbackOrQueries: any) => {
        if (typeof callbackOrQueries === 'function') {
          return callbackOrQueries(prismaMock);
        }
        return Promise.all(callbackOrQueries);
      }),
    };

    eventBusMock = {
      emit: jest.fn(async () => true),
    };

    realtimeMock = {
      emitToUsers: jest.fn(async () => true),
    };

    service = new PaymentsService(
      prismaMock as unknown as PrismaService,
      eventBusMock as unknown as EventBusService,
      realtimeMock as unknown as RealtimeService,
    );
  });

  describe('createPayment', () => {
    it('creates an INITIATED payment record for in-progress jobs', async () => {
      const res: any = await service.createPayment('cust-1', {
        jobId: 'job-1',
        method: PaymentMethod.COD,
        gateway: PaymentGateway.EASYPAISA,
      });

      expect(res.paymentId).toBe('pay-1');
      expect(res.status).toBe(PaymentStatus.INITIATED);
      expect(prismaMock.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobId: 'job-1',
            status: PaymentStatus.INITIATED,
            paidAt: null,
            verifiedAt: null,
          }),
        }),
      );
      expect(eventBusMock.emit).toHaveBeenCalledWith(
        PAYMENT_EVENTS.paymentInitiated,
        expect.objectContaining({ paymentId: 'pay-1' }),
      );
    });

    it('creates an immediately COMPLETED payment record when job is already COMPLETED', async () => {
      prismaMock.serviceRequest.findUnique.mockResolvedValue({
        ...mockJob,
        status: 'COMPLETED',
      });

      const res: any = await service.createPayment('cust-1', {
        jobId: 'job-1',
        method: PaymentMethod.COD,
        gateway: PaymentGateway.EASYPAISA,
      });

      expect(res.paymentId).toBe('pay-1');
      expect(res.status).toBe(PaymentStatus.COMPLETED);
      expect(prismaMock.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobId: 'job-1',
            status: PaymentStatus.COMPLETED,
            paidAt: expect.any(Date),
            verifiedAt: expect.any(Date),
          }),
        }),
      );
      expect(eventBusMock.emit).toHaveBeenCalledWith(
        PAYMENT_EVENTS.paymentCompleted,
        expect.objectContaining({ paymentId: 'pay-1' }),
      );
    });
  });

  describe('completePayment', () => {
    it('transitions an INITIATED payment to COMPLETED with paidAt and verifiedAt timestamps', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        jobId: 'job-1',
        customerId: 'cust-1',
        workerId: 'worker-1',
        amount: 500,
        status: PaymentStatus.INITIATED,
        paidAt: null,
        verifiedAt: null,
      });

      const actor = { sub: 'cust-1', phone: '+923000000001', role: Role.CUSTOMER };
      const res: any = await service.completePayment('pay-1', actor);

      expect(res.status).toBe(PaymentStatus.COMPLETED);
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: expect.any(Date),
          verifiedAt: expect.any(Date),
        },
      });
      expect(eventBusMock.emit).toHaveBeenCalledWith(
        PAYMENT_EVENTS.paymentCompleted,
        expect.objectContaining({ paymentId: 'pay-1' }),
      );
    });

    it('throws NotFoundException if payment row does not exist', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await expect(service.completePayment('pay-nonexistent')).rejects.toThrow(
        new NotFoundException('Payment not found'),
      );
    });

    it('throws ForbiddenException if non-participant attempts completion', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        customerId: 'cust-1',
        workerId: 'worker-1',
        status: PaymentStatus.INITIATED,
      });

      const intruder = { sub: 'intruder-id', phone: '+923000000009', role: Role.CUSTOMER };
      await expect(service.completePayment('pay-1', intruder)).rejects.toThrow(
        new ForbiddenException('Not authorized to complete this payment'),
      );
    });
  });

  describe('completePaymentsForJob', () => {
    it('transitions all in-flight payments for a job to COMPLETED', async () => {
      const inFlightPayments = [
        {
          id: 'pay-1',
          jobId: 'job-1',
          customerId: 'cust-1',
          workerId: 'worker-1',
          amount: 500,
          status: PaymentStatus.INITIATED,
        },
        {
          id: 'pay-2',
          jobId: 'job-1',
          customerId: 'cust-1',
          workerId: 'worker-1',
          amount: 1500,
          status: PaymentStatus.PROCESSING,
        },
      ];
      prismaMock.payment.findMany.mockResolvedValue(inFlightPayments);

      const count = await service.completePaymentsForJob('job-1');

      expect(count).toBe(2);
      expect(prismaMock.payment.update).toHaveBeenCalledTimes(2);
      expect(eventBusMock.emit).toHaveBeenCalledWith(
        PAYMENT_EVENTS.paymentCompleted,
        expect.objectContaining({ paymentId: 'pay-1' }),
      );
      expect(eventBusMock.emit).toHaveBeenCalledWith(
        PAYMENT_EVENTS.paymentCompleted,
        expect.objectContaining({ paymentId: 'pay-2' }),
      );
    });
  });
});
