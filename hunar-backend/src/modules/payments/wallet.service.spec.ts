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
});
