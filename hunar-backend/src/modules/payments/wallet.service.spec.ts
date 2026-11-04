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
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
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
      upsert: jest.fn().mockImplementation((args: any) => Promise.resolve(args.create || args.update)),
      findUnique: jest.fn(),
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
    platformSetting: {
      // B2: wallet reads PlatformSetting['commissionRate'] (legacy 'commission_rate'
      // accepted) before falling back to config env. Empty table -> env path.
      findMany: jest.fn().mockResolvedValue([]),
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
      prisma.workerWallet.findUnique.mockResolvedValue({
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
      prisma.workerWallet.findUnique.mockResolvedValue({
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
        balance: BigInt(1000),
        heldBalance: BigInt(0),
      });
      prisma.workerWallet.findUnique.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(0),
        heldBalance: BigInt(0),
      });
      prisma.commission.findUnique.mockResolvedValue(null);
      prisma.workerWallet.update.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(970),
        heldBalance: BigInt(0),
      });
      prisma.platformWallet.upsert.mockResolvedValue({});
      prisma.commission.upsert.mockResolvedValue({});

      const result = await service.recordEarningsForJob('job_denied');

      expect(result.credited).toBe(true);
      expect((result as any).grossAmount).toBe(300); // Only visit fee
      expect((result as any).repairAmount).toBe(0); // 0 repair earnings
      expect((result as any).commissionAmount).toBe(30); // 10% platform commission on visit fee only
      expect(result.amount).toBe(300); // Worker earnings = Rs. 300

      // Verify worker wallet only deducted by 10% of visit fee (1000 - 30 = 970), NOT topped up!
      expect(prisma.workerWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'worker_1' },
          data: expect.objectContaining({
            balance: 970,
          }),
        }),
      );

      // Verify commission deduction entry (-30) and NO earnings credit in wallet ledger
      expect(prisma.walletLedger.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            userId: 'worker_1',
            type: 'COMMISSION_DEDUCTED',
            amount: -30,
            balanceAfter: 970,
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
        balance: BigInt(1000),
        heldBalance: BigInt(0),
      });
      prisma.workerWallet.findUnique.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(0),
        heldBalance: BigInt(0),
      });
      prisma.commission.findUnique.mockResolvedValue(null);
      prisma.workerWallet.update.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(970),
        heldBalance: BigInt(0),
      });
      prisma.platformWallet.upsert.mockResolvedValue({});
      prisma.commission.upsert.mockResolvedValue({});

      const result = await service.recordEarningsForJob('job_accepted');

      expect(result.credited).toBe(true);
      expect((result as any).grossAmount).toBe(1800); // Visit fee (300) + Approved repair (1500)
      expect((result as any).repairAmount).toBe(1500);
      expect((result as any).commissionAmount).toBe(30); // 10% platform commission on visit fee ONLY (not on 1800)
      expect(result.amount).toBe(1800); // Worker earnings = Rs. 1800

      // Verify worker wallet only deducted by 10% of visit fee (970), NOT increased by 1800!
      expect(prisma.workerWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'worker_1' },
          data: expect.objectContaining({
            balance: 970,
          }),
        }),
      );

      // Verify commission deduction (-30) and NO earnings credit in wallet ledger
      expect(prisma.walletLedger.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            userId: 'worker_1',
            type: 'COMMISSION_DEDUCTED',
            amount: -30,
            balanceAfter: 970,
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
        balance: BigInt(970),
        heldBalance: BigInt(0),
      });

      prisma.walletLedger.groupBy.mockResolvedValue([
        { type: 'COMMISSION_DEDUCTED', _sum: { amount: -30 } },
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
      expect(summary.commissionsPaid).toBe(30); // 10% of visit fee 300
      expect(summary.netEarnings).toBe(1470);
      expect(summary.records).toHaveLength(1);
      // The complete earning must be 1500
      expect(summary.records[0].amount).toBe(1500);
      expect(summary.records[0].grossAmount).toBe(1500);
      expect(summary.records[0].repairAmount).toBe(1200);
      expect(summary.records[0].commission).toBe(30);
      expect(summary.records[0].netAmount).toBe(1470);
    });
  });

  describe('holdCommissionForJob & releaseCommissionHoldForJob (AUDIT-015)', () => {
    it('holds commission by transferring amount from balance to heldBalance without double-deduction', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValue({
        id: 'job_hold_1',
        lockedVisitCharge: 500,
        selectedWorkerId: 'worker_1',
      });
      prisma.commission.findUnique.mockResolvedValue(null);
      prisma.walletLedger.findUnique.mockResolvedValue(null);
      redis.getClient().set.mockResolvedValue('OK');
      prisma.workerWallet.upsert.mockResolvedValue({
        userId: 'worker_1',
        balance: 1000,
        heldBalance: 0,
      });
      prisma.commission.upsert.mockResolvedValue({
        id: 'comm_1',
        jobId: 'job_hold_1',
        workerId: 'worker_1',
        amount: 50,
        status: 'PENDING',
      });
      prisma.workerWallet.update.mockResolvedValue({
        userId: 'worker_1',
        balance: 950,
        heldBalance: 50,
      });

      const res = await service.holdCommissionForJob('worker_1', 'job_hold_1');

      expect(res.held).toBe(true);
      expect(res.amount).toBe(50);
      expect(prisma.workerWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'worker_1' },
          data: { balance: 950, heldBalance: 50 },
        }),
      );
      expect(eventBus.emit).toHaveBeenCalledWith('commission.held', expect.objectContaining({
        jobId: 'job_hold_1',
        workerId: 'worker_1',
        amount: 50,
      }));
    });

    it('settles pre-held commission on job completion by clearing heldBalance without double-deducting balance', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValue({
        id: 'job_complete_1',
        lockedVisitCharge: 500,
        selectedWorkerId: 'worker_1',
        repairs: [],
      });
      // Commission was already held at arrival
      prisma.commission.findUnique.mockResolvedValue({
        id: 'comm_1',
        jobId: 'job_complete_1',
        amount: 50,
        status: 'PENDING',
      });
      prisma.workerWallet.upsert.mockResolvedValue({
        userId: 'worker_1',
        balance: 950, // Already decremented at arrival
        heldBalance: 50, // Held in quarantine
      });
      redis.getClient().set.mockResolvedValue('OK');
      prisma.walletLedger.findUnique.mockImplementation(async (args: any) => {
        if (args?.where?.idempotencyKey === 'hold:job_complete_1') {
          return { id: 'ledger_hold_1', type: 'COMMISSION_HELD' };
        }
        return null;
      });
      prisma.walletLedger.update = jest.fn().mockResolvedValue({});
      prisma.workerWallet.update.mockResolvedValue({
        userId: 'worker_1',
        balance: 950, // Stays 950 (no double deduction!)
        heldBalance: 0, // Cleared
      });

      const res = await service.recordEarningsForJob('job_complete_1');

      expect(res.credited).toBe(true);
      expect(prisma.workerWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'worker_1' },
          data: { balance: 950, heldBalance: 0 },
        }),
      );
      // Confirms existing hold ledger entry is updated to COMMISSION_DEDUCTED
      expect(prisma.walletLedger.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ledger_hold_1' },
          data: expect.objectContaining({
            type: 'COMMISSION_DEDUCTED',
          }),
        }),
      );
    });

    it('releases held commission back to available balance upon job cancellation', async () => {
      prisma.commission.findUnique.mockResolvedValue({
        id: 'comm_cancel_1',
        jobId: 'job_cancel_1',
        workerId: 'worker_1',
        amount: 50,
        status: 'PENDING',
      });
      prisma.workerWallet.upsert.mockResolvedValue({
        userId: 'worker_1',
        balance: 950,
        heldBalance: 50,
      });
      prisma.workerWallet.update.mockResolvedValue({
        userId: 'worker_1',
        balance: 1000,
        heldBalance: 0,
      });
      prisma.commission.delete = jest.fn().mockResolvedValue({});

      const res = await service.reverseCommissionForJob('job_cancel_1');

      expect(res.reversed).toBe(true);
      expect(res.amount).toBe(50);
      expect(prisma.workerWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'worker_1' },
          data: { balance: 1000, heldBalance: 0 },
        }),
      );
    });
  });

});
