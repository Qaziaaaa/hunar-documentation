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
    commission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    platformWallet: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    serviceRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg(prisma);
      }
      // Array form: Prisma resolves the tuple before handing it back.
      return Promise.all(arg);
    }),
  };

  const redisClient = { set: jest.fn().mockResolvedValue('1') };
  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getClient: jest.fn(() => redisClient),
  };
  const realtime = { emitToRoom: jest.fn() };
  const eventBus = { emit: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('0.10') };
  const ledger = new LedgerService(prisma as any);

  beforeEach(async () => {
    jest.clearAllMocks();
    redisClient.set.mockResolvedValue('1');
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

  describe('getWalletSummary', () => {
    it('reports the spendable balance, held amount and lifetime totals', async () => {
      prisma.workerWallet.upsert.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(1550),
        heldBalance: BigInt(300),
      });
      prisma.walletLedger.groupBy.mockResolvedValue([
        { type: 'TOPUP_CREDIT', _sum: { amount: 2000 }, _count: { _all: 2 } },
        { type: 'COMMISSION_HELD', _sum: { amount: -300 }, _count: { _all: 1 } },
        { type: 'COMMISSION_DEDUCTED', _sum: { amount: -150 }, _count: { _all: 1 } },
        { type: 'EARNINGS_CREDIT', _sum: { amount: 5000 }, _count: { _all: 3 } },
      ]);

      const summary = await service.getWalletSummary('worker_1');

      // currentBalance must be spendable-only — the hold is already deducted.
      expect(summary.currentBalance).toBe(1550);
      expect(summary.heldBalance).toBe(300);
      expect(summary.totalBalance).toBe(1850);
      // Job earnings must not be reported as a top-up.
      expect(summary.totalTopUps).toBe(2000);
      expect(summary.totalDeductions).toBe(450);
      expect(summary.totalTransactions).toBe(7);
    });

    it('returns zeroed totals for a brand-new worker', async () => {
      prisma.workerWallet.upsert.mockResolvedValue({
        userId: 'worker_new',
        balance: BigInt(0),
        heldBalance: BigInt(0),
      });
      prisma.walletLedger.groupBy.mockResolvedValue([]);

      await expect(service.getWalletSummary('worker_new')).resolves.toEqual({
        currentBalance: 0,
        heldBalance: 0,
        totalBalance: 0,
        totalTopUps: 0,
        totalDeductions: 0,
        totalTransactions: 0,
      });
    });
  });

  describe('getLedger / wallet transaction projection', () => {
    it('maps signed ledger rows to credit/debit transactions the wallet screen can render', async () => {
      prisma.walletLedger.findMany.mockResolvedValue([
        {
          id: 'row_topup',
          type: 'TOPUP_CREDIT',
          amount: BigInt(2000),
          balanceAfter: BigInt(2000),
          referenceType: 'topup',
          referenceId: 'topup_1',
          note: 'Wallet top-up verified by admin',
          createdAt: new Date(2026, 8, 23, 10, 0, 0),
        },
        {
          id: 'row_hold',
          type: 'COMMISSION_HELD',
          amount: BigInt(-300),
          balanceAfter: BigInt(1700),
          referenceType: 'job',
          referenceId: 'job_1',
          note: 'Commission held for job job_1',
          createdAt: new Date(2026, 8, 23, 14, 30, 0),
        },
      ]);
      prisma.commission.findMany.mockResolvedValue([]);
      prisma.serviceRequest.findMany.mockResolvedValue([
        { id: 'job_1', title: 'Kitchen sink repair' },
      ]);
      prisma.walletLedger.count.mockResolvedValue(2);

      const { items, meta } = await service.getLedger('worker_1', {});

      expect(items).toHaveLength(2);
      // Credit: positive amount, TOP_UP, pre-grouped day header.
      expect(items[0]).toMatchObject({
        id: 'row_topup',
        type: 'TOP_UP',
        amount: 2000,
        displayDate: '23 September 2026',
        displayTime: '10:00 AM',
        description: 'Wallet top-up verified by admin',
        resultingBalance: 2000,
      });
      // A top-up is not traceable to a job, so no job badge is emitted.
      expect(items[0].jobId).toBeUndefined();
      expect(items[0].jobTitle).toBeUndefined();
      // Debit: amount is returned unsigned because the sign is carried by `type`.
      expect(items[1]).toMatchObject({
        id: 'row_hold',
        type: 'DEDUCTION',
        amount: 300,
        displayDate: '23 September 2026',
        displayTime: '02:30 PM',
        resultingBalance: 1700,
        jobId: 'job_1',
        jobTitle: 'Kitchen sink repair',
      });
      // Raw ledger fields are preserved alongside the display fields.
      expect(items[1].ledgerType).toBe('COMMISSION_HELD');
      expect(items[1].balanceAfter).toBe(1700);
      expect(meta).toMatchObject({ total: 2 });
    });

    it('resolves the job behind a commission-referenced row in one extra query', async () => {
      prisma.walletLedger.findMany.mockResolvedValue([
        {
          id: 'row_deducted',
          type: 'COMMISSION_DEDUCTED',
          amount: BigInt(-50),
          balanceAfter: BigInt(950),
          referenceType: 'commission',
          referenceId: 'comm_1',
          note: null,
          createdAt: new Date(2026, 8, 22, 9, 5, 0),
        },
      ]);
      prisma.commission.findMany.mockResolvedValue([{ id: 'comm_1', jobId: 'job_9' }]);
      prisma.serviceRequest.findMany.mockResolvedValue([
        { id: 'job_9', title: 'Ceiling fan installation' },
      ]);
      prisma.walletLedger.count.mockResolvedValue(1);

      const { items } = await service.getLedger('worker_1', {});

      expect(prisma.commission.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.serviceRequest.findMany).toHaveBeenCalledTimes(1);
      expect(items[0]).toMatchObject({
        type: 'DEDUCTION',
        amount: 50,
        jobId: 'job_9',
        jobTitle: 'Ceiling fan installation',
        // Falls back to a per-type label when the row has no note.
        description: 'Visit commission deducted',
      });
    });

    it('skips the job lookup entirely for an empty page', async () => {
      prisma.walletLedger.findMany.mockResolvedValue([]);
      prisma.walletLedger.count.mockResolvedValue(0);

      const { items, meta } = await service.getLedger('worker_1', {});

      expect(items).toEqual([]);
      expect(prisma.commission.findMany).not.toHaveBeenCalled();
      expect(prisma.serviceRequest.findMany).not.toHaveBeenCalled();
      expect(meta.total).toBe(0);
    });
  });

  describe('confirmCommission', () => {
    it('resolves the commission from jobId when no commissionId is supplied', async () => {
      prisma.commission.findUnique.mockResolvedValue({
        id: 'comm_1',
        jobId: 'job_1',
        workerId: 'worker_1',
        amount: BigInt(50),
        status: 'RECEIVED',
      });
      prisma.workerWallet.upsert.mockResolvedValue({
        userId: 'worker_1',
        balance: BigInt(950),
        heldBalance: BigInt(50),
      });
      prisma.workerWallet.update.mockResolvedValue({});
      prisma.walletLedger.create.mockResolvedValue({});
      prisma.platformWallet.upsert.mockResolvedValue({});
      prisma.commission.update.mockResolvedValue({});

      const result = await service.confirmCommission('job_1');

      expect(prisma.commission.findUnique).toHaveBeenCalledWith({ where: { jobId: 'job_1' } });
      expect(result).toMatchObject({ confirmed: true, heldAfter: 0 });
    });

    it('rejects a commissionId that belongs to a different job', async () => {
      prisma.commission.findUnique.mockResolvedValue({
        id: 'comm_1',
        jobId: 'job_1',
        workerId: 'worker_1',
        amount: BigInt(50),
        status: 'RECEIVED',
      });

      await expect(service.confirmCommission('job_1', 'comm_other')).rejects.toThrow(
        'Commission not found',
      );
    });
  });
});
