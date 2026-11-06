import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { VisitsService } from './visits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RealtimeService } from '../realtime/realtime.service';
import { WalletService } from '../payments/wallet.service';
import { JobsService } from '../jobs/jobs.service';
import { JwtPayload } from '../../common/types/jwt-payload.interface';

describe('AUDIT-006: Doorstep OTP Verification Security', () => {
  let service: VisitsService;
  let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let prisma: any;

  const customerUser: JwtPayload = {
    sub: 'cust-1',
    role: Role.CUSTOMER,
    phone: '03001234567',
  };

  const workerUser: JwtPayload = {
    sub: 'worker-1',
    role: Role.WORKER,
    phone: '03009876543',
  };

  const otherCustomerUser: JwtPayload = {
    sub: 'cust-999',
    role: Role.CUSTOMER,
    phone: '03001112233',
  };

  const mockVisit = {
    id: 'visit-100',
    jobId: 'job-100',
    workerId: 'worker-1',
    status: 'SCHEDULED',
    inspectionSubmittedAt: null,
    job: {
      customerId: 'cust-1',
    },
    worker: {
      id: 'worker-1',
      name: 'Test Worker',
      phone: '03009876543',
    },
    offer: {
      id: 'offer-1',
      visitCharge: 500,
      status: 'ACCEPTED',
    },
  };

  beforeEach(async () => {
    redis = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    prisma = {
      visit: {
        findUnique: jest.fn().mockResolvedValue(mockVisit),
        findFirst: jest.fn().mockResolvedValue(mockVisit),
        update: jest.fn().mockResolvedValue({ ...mockVisit, status: 'COMPLETED' }),
      },
      serviceRequest: {
        update: jest.fn().mockResolvedValue({ id: 'job-100', status: 'VISIT_COMPLETED' }),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: JobsService, useValue: {} },
        {
          provide: EventBusService,
          useValue: { emit: jest.fn() },
        },
        {
          provide: RealtimeService,
          useValue: { emitToRoom: jest.fn() },
        },
        {
          provide: WalletService,
          useValue: { holdCommissionForJob: jest.fn().mockResolvedValue({ held: true }) },
        },
      ],
    }).compile();

    service = module.get<VisitsService>(VisitsService);
  });

  describe('workerArrived', () => {
    it('generates a secure 4-digit OTP internally and stores it in Redis', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.workerArrived('visit-100', workerUser);

      expect(result.success).toBe(true);
      expect(result.otp).toMatch(/^\d{4}$/);
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('visit-100'),
        result.otp,
        expect.any(Number),
      );
    });

    it('rejects if called by a non-worker', async () => {
      await expect(service.workerArrived('visit-100', customerUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('verifyArrivalOtp (Security Enforcement)', () => {
    it('STOPS WORKER SELF-VERIFICATION: rejects worker calling verifyArrivalOtp with 403 Forbidden', async () => {
      await expect(service.verifyArrivalOtp('visit-100', workerUser, '1234')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.verifyArrivalOtp('visit-100', workerUser, '1234')).rejects.toThrow(
        /Only the customer who booked this service can verify/,
      );
    });

    it('rejects a customer who does not own the job with 403 Forbidden', async () => {
      await expect(service.verifyArrivalOtp('visit-100', otherCustomerUser, '1234')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects an incorrect OTP and decrements remaining attempts', async () => {
      redis.get
        .mockResolvedValueOnce(null) // attempts: 0
        .mockResolvedValueOnce('4821') // visitOtpKey
        .mockResolvedValueOnce('4821'); // jobOtpKey

      await expect(service.verifyArrivalOtp('visit-100', customerUser, '9999')).rejects.toThrow(
        /ARRIVAL_OTP_INVALID: The OTP entered is incorrect\. 4 attempt\(s\) remaining\./,
      );

      // Verify attempts was incremented in Redis
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('attempts:visit-100'),
        '1',
        expect.any(Number),
      );
    });

    it('locks OTP verification after 5 failed attempts (brute-force protection)', async () => {
      redis.get.mockResolvedValueOnce('5'); // attempts: 5

      await expect(service.verifyArrivalOtp('visit-100', customerUser, '4821')).rejects.toThrow(
        /ARRIVAL_OTP_LOCKED: Too many incorrect verification attempts/,
      );
    });

    it('successfully verifies when the genuine customer enters the correct OTP', async () => {
      redis.get
        .mockResolvedValueOnce(null) // attempts: 0
        .mockResolvedValueOnce('4821') // visitOtpKey
        .mockResolvedValueOnce('4821'); // jobOtpKey

      const result = await service.verifyArrivalOtp('visit-100', customerUser, '4821');

      expect(result.success).toBe(true);
      expect(prisma.visit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'visit-100' },
          data: { status: 'COMPLETED' },
        }),
      );
      // Redis keys deleted
      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe('submitInspection Base64 photo prevention (AUDIT-007)', () => {
    it('rejects inspection submission when inspectionPhotos contain Base64 data URLs', async () => {
      const workerUser = { sub: 'worker-1', phone: '+923000000000', role: 'WORKER' as any };
      prisma.visit.findUnique.mockResolvedValue({
        id: 'visit-100',
        jobId: 'job-100',
        workerId: 'worker-1',
        status: 'COMPLETED',
        job: { customerId: 'customer-1' },
      });

      await expect(
        service.submitInspection('visit-100', workerUser, {
          diagnosis: 'Compressor burned',
          repairPlan: 'Replace capacitor and fan motor',
          repairEstimate: 3500,
          inspectionPhotos: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='],
        }),
      ).rejects.toThrow(/Direct Base64 photo storage is not permitted/);
    });
  });

});
