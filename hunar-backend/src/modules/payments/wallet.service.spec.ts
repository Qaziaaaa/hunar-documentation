import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WalletService, WalletSnapshot } from './wallet.service';
import { TopupDto, TopupDecideDto } from './payments.validation';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RealtimeService } from '../realtime/realtime.service';
import { LedgerService } from './ledger.service';

describe('WalletService', () => {
  let moduleRef: TestingModule;
  let service: WalletService;

  const prisma = {
    workerWallet: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    walletTopup: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    walletLedger: {
      create: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    serviceRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    commission: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    platformWallet: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg(prisma);
      }
      return Promise.resolve(arg);
    }),
  };

  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getClient: jest.fn().mockReturnValue({ set: jest.fn().mockResolvedValue('OK') }),
  };
  const realtime = { emitToRoom: jest.fn() };
  const eventBus = { emit: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('0.10') };
  const ledger = new LedgerService(prisma as any);

  beforeEach(async () => {
    jest.clearAllMocks();
    moduleRef = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: EventBusService, useValue: eventBus },
        { provide: RealtimeService, useValue: realtime },
        { provide: ConfigService, useValue: config },
        { provide: LedgerService, useValue: ledger },
      ],
    }).compile();
    service = moduleRef.get(WalletService);
  });

  describe('submitTopup', () => {
    it('persists a PENDING topup and emits the submitted event', async () => {
      const dto: TopupDto = {
        amount: 250,
        screenshotUrl: 'https://cdn.example.com/topup/abc.png',
        note: 'first recharge',
      };
      prisma.walletTopup.create.mockResolvedValue({
        id: 'topup_1',
        workerId: 'worker_1',
        amount: BigInt(250),
        screenshotUrl: dto.screenshotUrl,
        note: dto.note,
        status: 'PENDING',
        createdAt: new Date('2026-01-10T10:00:00Z'),
      });

      const result = await service.submitTopup('worker_1', dto);

      expect(prisma.walletTopup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workerId: 'worker_1',
            amount: 250,
          }),
        }),
      );
      expect(result.status).toBe('PENDING');
      expect(result.amount).toBe(250);
      expect(eventBus.emit).toHaveBeenCalledWith('topup.submitted', {
        topUpId: 'topup_1',
        workerId: 'worker_1',
        amount: 250,
      });
      expect(realtime.emitToRoom).toHaveBeenCalled();
    });
  });

  describe('decideTopup', () => {
    it('approves a pending topup and credits the wallet', async () => {
      prisma.walletTopup.findUnique.mockResolvedValue({
        id: 'topup_1',
        workerId: 'worker_1',
        amount: BigInt(250),
        status: 'PENDING',
        createdAt: new Date('2026-01-10T10:00:00Z'),
      });
      prisma.walletTopup.update.mockResolvedValue({
        id: 'topup_1',
        workerId: 'worker_1',
        amount: BigInt(250),
        status: 'APPROVED',
      });
      prisma.workerWallet.upsert.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(250),
        heldBalance: BigInt(0),
      });

      const dto: TopupDecideDto = { action: 'APPROVED', reason: 'screenshot verified' };
      await expect(service.decideTopup('topup_1', 'admin_1', dto)).resolves.toMatchObject({
        status: 'APPROVED',
      });
      expect(prisma.walletTopup.update).toHaveBeenCalled();
      expect(realtime.emitToRoom).toHaveBeenCalled();
    });
  });

  describe('getBalance / snapshot', () => {
    it('derives snapshot totals from the wallet row', async () => {
      prisma.workerWallet.upsert.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(1750),
        heldBalance: BigInt(250),
      });
      const snap: WalletSnapshot = await service.getBalance('worker_1');
      expect(snap.balance).toBe(1750);
      expect(snap.heldBalance).toBe(250);
      expect(snap.totalBalance).toBe(2000);
    });
  });

  describe('recordEarningsForJob', () => {
    it('Scenario A: Customer denies repair -> calculates earnings based only on Rs. 300 visit fee', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValue({
        id: 'job_denied',
        lockedVisitCharge: 300,
        selectedWorkerId: 'worker_1',
        repairs: [], // Customer denied repair -> repairs query with status 'ACCEPTED' returns empty
      });
      prisma.workerWallet.upsert.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(0),
        heldBalance: BigInt(0),
      });
      prisma.commission.findUnique.mockResolvedValue(null);
      prisma.workerWallet.update.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(270),
        heldBalance: BigInt(0),
      });
      prisma.platformWallet.upsert.mockResolvedValue({});
      prisma.commission.upsert.mockResolvedValue({});

      const result = await service.recordEarningsForJob('job_denied');

      expect(result.credited).toBe(true);
      expect(result.amount).toBe(270); // Net worker amount
      expect((result as any).grossAmount).toBe(300); // Only visit fee
      expect((result as any).commissionAmount).toBe(30); // 10% platform commission

      // Verify worker wallet updated with net amount (270)
      expect(prisma.workerWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'worker_1' },
          data: expect.objectContaining({
            balance: 270,
          }),
        }),
      );

      // Verify two distinct ledger entries: Gross Credit (+300) and Commission Deduction (-30)
      expect(prisma.walletLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'worker_1',
            type: 'EARNINGS_CREDIT',
            amount: 300,
            referenceType: 'job',
            referenceId: 'job_denied',
          }),
        }),
      );
      expect(prisma.walletLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'worker_1',
            type: 'COMMISSION_DEDUCTED',
            amount: -30,
            referenceType: 'commission',
          }),
        }),
      );
    });

    it('Scenario B: Customer accepts repair -> calculates earnings based on Rs. 300 visit fee + Rs. 1500 repair', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValue({
        id: 'job_accepted',
        lockedVisitCharge: 300,
        selectedWorkerId: 'worker_1',
        repairs: [{ lockedAmount: 1500, amount: 1500 }], // Repair was approved
      });
      prisma.workerWallet.upsert.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(0),
        heldBalance: BigInt(0),
      });
      prisma.commission.findUnique.mockResolvedValue(null);
      prisma.workerWallet.update.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(1620),
        heldBalance: BigInt(0),
      });
      prisma.platformWallet.upsert.mockResolvedValue({});
      prisma.commission.upsert.mockResolvedValue({});

      const result = await service.recordEarningsForJob('job_accepted');

      expect(result.credited).toBe(true);
      expect(result.amount).toBe(1620); // Net worker amount (1800 - 180)
      expect((result as any).grossAmount).toBe(1800); // Visit fee (300) + Approved repair (1500)
      expect((result as any).commissionAmount).toBe(180); // 10% platform commission on 1800

      // Verify worker wallet updated with net amount (1620)
      expect(prisma.workerWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'worker_1' },
          data: expect.objectContaining({
            balance: 1620,
          }),
        }),
      );

      // Verify two distinct ledger entries: Gross Credit (+1800) and Commission Deduction (-180)
      expect(prisma.walletLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'worker_1',
            type: 'EARNINGS_CREDIT',
            amount: 1800,
            referenceType: 'job',
            referenceId: 'job_accepted',
          }),
        }),
      );
      expect(prisma.walletLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'worker_1',
            type: 'COMMISSION_DEDUCTED',
            amount: -180,
            referenceType: 'commission',
          }),
        }),
      );
    });
  });

  describe('getEarningsSummary', () => {
    it('returns complete gross earning (e.g. 1500) for a 1500 job in record amount while maintaining commission and net details', async () => {
      prisma.workerWallet.findUnique.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(1350),
        heldBalance: BigInt(0),
      });

      prisma.walletLedger.groupBy.mockResolvedValue([
        { type: 'EARNINGS_CREDIT', _sum: { amount: 1500 } },
        { type: 'COMMISSION_DEDUCTED', _sum: { amount: -150 } },
      ]);

      prisma.serviceRequest.findMany.mockResolvedValue([
        {
          id: 'job_1500',
          title: 'Ceiling Fan Repair',
          lockedVisitCharge: 300,
          status: 'COMPLETED',
          category: { name: 'Electrician' },
          repairs: [{ lockedAmount: 1200, amount: 1200 }],
          completedAt: new Date('2026-10-01T12:00:00Z'),
        },
      ]);

      const summary = await service.getEarningsSummary('worker_1');

      expect(summary.grossEarnings).toBe(1500);
      expect(summary.commissionsPaid).toBe(150);
      expect(summary.netEarnings).toBe(1350);
      expect(summary.records).toHaveLength(1);
      // The complete earning must be 1500
      expect(summary.records[0].amount).toBe(1500);
      expect(summary.records[0].grossAmount).toBe(1500);
      expect(summary.records[0].commission).toBe(150);
      expect(summary.records[0].netAmount).toBe(1350);
    });
  });
});

