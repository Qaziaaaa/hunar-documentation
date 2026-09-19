import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { RedisService } from '../../common/redis/redis.service';
import { SmsService } from '../auth/sms.service';
import { INSUFFICIENT_BALANCE_MESSAGE, WALLET_MIN_WITHDRAWAL } from './wallet.constants';

class Db {
  workerWallets = new Map<string, any>();
  walletTopUps = new Map<string, any>();
  walletLedgers: any[] = [];
  commissions = new Map<string, any>();
  platformWallets = new Map<string, any>();
  workerProfiles = new Map<string, any>();
  serviceRequests = new Map<string, any>();
  users = new Map<string, any>();
  repairs = new Map<string, any>();
}

class RedisFake {
  store = new Map<string, { value: string }>();
  async get(key: string) {
    return this.store.get(key)?.value ?? null;
  }
  async set(key: string, value: string) {
    this.store.set(key, { value });
  }
  async del(key: string) {
    this.store.delete(key);
  }
  async exists(key: string) {
    return this.store.has(key) ? 1 : 0;
  }
  async incr(key: string) {
    const current = this.store.has(key) ? parseInt(this.store.get(key)!.value, 10) : 0;
    this.store.set(key, { value: String(current + 1) });
    return current + 1;
  }
  async expire() {
    return 1;
  }
  async ttl(key: string) {
    return this.store.has(key) ? 60 : -1;
  }
}

const toNum = (v: any): number => (v === null || v === undefined ? 0 : Number(v));

function seedJob(db: Db, jobId: string, lock: number) {
  db.serviceRequests.set(jobId, {
    id: jobId,
    customerId: 'c1',
    lockedVisitCharge: lock,
    status: 'VISIT_IN_PROGRESS',
  });
}

function seedWorker(db: Db, workerId: string, balance: number) {
  db.workerWallets.set(workerId, { id: `wallet-${workerId}`, workerId, balance });
  db.workerProfiles.set(workerId, { userId: workerId, isAvailable: true });
}

function findCommission(db: Db, jobId: string) {
  return Array.from(db.commissions.values()).find((c) => c.jobId === jobId);
}

function ledgerOfType(db: Db, walletId: string, type: string) {
  return db.walletLedgers.filter((l) => l.walletId === walletId && l.type === type);
}

function makeFakes(db: Db) {
  const prisma: any = {
    workerWallet: {
      async upsert({ where, update, create }: { where: any; update: any; create: any }) {
        let w = db.workerWallets.get(where.workerId);
        if (!w) {
          w = { id: `wallet-${where.workerId}`, workerId: where.workerId, balance: 0, ...create };
          db.workerWallets.set(where.workerId, w);
        } else if (update && Object.keys(update).length) {
          Object.assign(w, update);
        }
        return w;
      },
      async findUnique({ where }: { where: { id: string; workerId?: string } }) {
        if (where.workerId) return db.workerWallets.get(where.workerId) ?? null;
        return Array.from(db.workerWallets.values()).find((w) => w.id === where.id) ?? null;
      },
      async update({ where, data }: { where: { id: string }; data: any }) {
        const wallet = Array.from(db.workerWallets.values()).find((w) => w.id === where.id);
        if (wallet) {
          if (typeof data.balance === 'object' && data.balance.increment !== undefined) {
            wallet.balance = toNum(wallet.balance) + toNum(data.balance.increment);
          } else {
            wallet.balance = toNum(data.balance);
          }
        }
        return wallet;
      },
    },
    walletTopUp: {
      async create({ data }: { data: any }) {
        const topUp = { id: `topup-${db.walletTopUps.size + 1}`, ...data };
        db.walletTopUps.set(topUp.id, topUp);
        return topUp;
      },
      async findUnique({ where }: { where: { id: string } }) {
        return db.walletTopUps.get(where.id) ?? null;
      },
      async update({ where, data }: { where: { id: string }; data: any }) {
        const topUp = db.walletTopUps.get(where.id);
        if (topUp) Object.assign(topUp, data);
        return topUp;
      },
      async findUniqueOrThrow({ where }: { where: { id: string } }) {
        const topUp = db.walletTopUps.get(where.id);
        if (!topUp) throw new NotFoundException('topup not found');
        return topUp;
      },
      async findMany({ skip, take, orderBy }: any) {
        const all = Array.from(db.walletTopUps.values()).sort((a, b) =>
          orderBy?.createdAt === 'asc'
            ? String(a.createdAt).localeCompare(String(b.createdAt))
            : String(b.createdAt).localeCompare(String(a.createdAt)),
        );
        return all.slice(skip ?? 0, (skip ?? 0) + (take ?? all.length));
      },
      async count(_: any) {
        return db.walletTopUps.size;
      },
    },
    walletLedger: {
      async create({ data }: { data: any }) {
        const entry = { id: `ledger-${db.walletLedgers.length + 1}`, ...data };
        db.walletLedgers.push(entry);
        return entry;
      },
      async findFirst({ where }: { where?: any }) {
        return db.walletLedgers.find((l) =>
          Object.entries(where ?? {}).every(([k, v]) => l[k] === v),
        ) ?? null;
      },
      async findMany({ where, skip, take, orderBy }: any) {
        let rows = db.walletLedgers.filter((l) => l.walletId === where?.walletId);
        if (orderBy?.createdAt === 'desc') rows = [...rows].reverse();
        return rows.slice(skip ?? 0, (skip ?? 0) + (take ?? rows.length));
      },
      async count({ where }: any) {
        return db.walletLedgers.filter((l) => l.walletId === where?.walletId).length;
      },
    },
    commission: {
      async findFirst({ where }: { where: { jobId?: string } }) {
        return (where.jobId ? findCommission(db, where.jobId) : null) ?? null;
      },
      async create({ data }: { data: any }) {
        const commission = { id: `commission-${db.commissions.size + 1}`, ...data };
        db.commissions.set(commission.id, commission);
        return commission;
      },
      async update({ where, data }: { where: { id: string }; data: any }) {
        const commission = db.commissions.get(where.id);
        if (commission) Object.assign(commission, data);
        return commission;
      },
    },
    platformWallet: {
      async findUnique({ where }: { where: { id: string } }) {
        return db.platformWallets.get(where.id) ?? null;
      },
      async upsert({ where, update, create }: { where: any; update: any; create: any }) {
        let platform = db.platformWallets.get(where.id);
        if (!platform) {
          platform = { id: where.id, balance: 0, ...create };
          db.platformWallets.set(where.id, platform);
        } else if (update.balance?.increment !== undefined) {
          platform.balance = toNum(platform.balance) + toNum(update.balance.increment);
        }
        return platform;
      },
    },
    workerProfile: {
      async updateMany({ where, data }: { where: any; data: any }) {
        if (where.userId) {
          const profile = db.workerProfiles.get(where.userId);
          if (profile) Object.assign(profile, data);
        }
        return { count: 1 };
      },
    },
    serviceRequest: {
      async findUnique({ where }: { where: { id: string } }) {
        return db.serviceRequests.get(where.id) ?? null;
      },
    },
    repair: {
      async findUnique({ where }: { where: { id: string } }) {
        const repair = db.repairs.get(where.id);
        if (!repair) return null;
        return { ...repair, job: db.serviceRequests.get(repair.jobId) };
      },
    },
    user: {
      async findUnique({ where }: { where: { id: string } }) {
        return db.users.get(where.id) ?? null;
      },
    },
    $transaction: async (fn: (tx: any) => Promise<any>) => fn(prisma),
  };

  const eventBus = { emit: jest.fn() } as unknown as EventBusService;
  const redis = new RedisFake() as unknown as RedisService;
  const config = {
    get: jest.fn((key: string, fallback: number) => (key === 'app.commissionRate' ? 0.1 : fallback)),
  } as unknown as ConfigService;
  const smsSend = jest.fn(async (_phone: string, _code: string) => undefined);
  const sms = { sendOtp: smsSend } as unknown as SmsService;

  return { prisma, eventBus, redis, config, sms, smsSend };
}

function makeService(db: Db, fakes: ReturnType<typeof makeFakes>) {
  return new WalletService(fakes.prisma, fakes.redis, fakes.config, fakes.sms, fakes.eventBus);
}

describe('WalletService — top-up flow', () => {
  it('auto-creates a Rs. 0 wallet on first balance read', async () => {
    const db = new Db();
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);
    const result = await service.getBalance('w1');
    expect(result).toEqual({ balance: 0, currency: 'PKR' });
    expect(db.workerWallets.has('w1')).toBe(true);
  });

  it('submits a PENDING top-up with the payment reference number and emits topup.submitted', async () => {
    const db = new Db();
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);
    const topUp = await service.requestTopUp('w1', {
      amount: 500,
      paymentMethod: 'EASYPAISA',
      transactionRef: 'TXN123',
      screenshotUrl: 'https://s3/topup.jpg',
    });
    expect(topUp.status).toBe('PENDING');
    expect(topUp.topUpTo).toContain('+92 314');
    expect(fakes.eventBus.emit).toHaveBeenCalledWith('topup.submitted', {
      topUpId: topUp.id,
      workerId: 'w1',
      amount: 500,
    });
  });

  it('credits the wallet + ledger on admin approve and rejects on repeat', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 0);
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);
    const topUp = await service.requestTopUp('w1', {
      amount: 500,
      paymentMethod: 'BANK_TRANSFER',
      screenshotUrl: 'u',
    });

    const approved = await service.verifyTopUp(topUp.id, 'approve', 'ok');
    expect(approved.status).toBe('APPROVED');
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(500);
    const credits = ledgerOfType(db, db.workerWallets.get('w1').id, 'TOPUP_CREDIT');
    expect(credits).toHaveLength(1);
    expect(toNum(credits[0].amount)).toBe(500);
    expect(toNum(credits[0].balanceAfter)).toBe(500);
    expect(fakes.eventBus.emit).toHaveBeenCalledWith('topup.approved', {
      topUpId: topUp.id,
      workerId: 'w1',
      amount: 500,
    });
    await expect(service.verifyTopUp(topUp.id, 'approve')).rejects.toThrow(ConflictException);
  });

  it('rejects a top-up without crediting the wallet', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 0);
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);
    const topUp = await service.requestTopUp('w1', {
      amount: 300,
      paymentMethod: 'JAZZCASH',
      screenshotUrl: 'u',
    });
    const rejected = await service.verifyTopUp(topUp.id, 'reject', 'blurry');
    expect(rejected.status).toBe('REJECTED');
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(0);
    expect(ledgerOfType(db, db.workerWallets.get('w1').id, 'TOPUP_CREDIT')).toHaveLength(0);
    expect(fakes.eventBus.emit).toHaveBeenCalledWith('topup.rejected', expect.any(Object));
  });

  it('refuses to verify an unknown top-up', async () => {
    const db = new Db();
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);
    await expect(service.verifyTopUp('missing', 'approve')).rejects.toThrow(NotFoundException);
  });
});

describe('WalletService — commission lifecycle', () => {
  it('holds 10% of the locked visit charge on arrival and is idempotent', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 1000);
    seedJob(db, 'job1', 2000);
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);

    const held = await service.holdCommission({ jobId: 'job1', workerId: 'w1' });
    expect(held.held).toBe(true);
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(800);
    expect(findCommission(db, 'job1').status).toBe('HELD');
    const holds = ledgerOfType(db, db.workerWallets.get('w1').id, 'COMMISSION_HOLD');
    expect(holds).toHaveLength(1);
    expect(toNum(holds[0].balanceAfter)).toBe(800);
    expect(fakes.eventBus.emit).toHaveBeenCalledWith('commission.held', expect.objectContaining({ amount: 200 }));

    const again = await service.holdCommission({ jobId: 'job1', workerId: 'w1' });
    expect(again.held).toBe(true);
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(800);
    expect(holds).toHaveLength(1);
  });

  it('blocks arrival when the wallet cannot cover the commission', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 100);
    seedJob(db, 'job1', 2000);
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);

    await expect(service.holdCommission({ jobId: 'job1', workerId: 'w1' })).rejects.toThrow(
      BadRequestException,
    );
    expect(fakes.eventBus.emit).toHaveBeenCalledWith(
      'wallet.insufficientBalance',
      expect.objectContaining({ workerId: 'w1', required: 200 }),
    );
    expect(findCommission(db, 'job1')).toBeUndefined();
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(100);
  });

  it('skips the hold when the visit charge is not locked and does not break arrival', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 0);
    db.serviceRequests.set('job1', { id: 'job1', customerId: 'c1', lockedVisitCharge: null });
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);
    const result = await service.holdCommission({ jobId: 'job1', workerId: 'w1' });
    expect(result.skipped).toBe(true);
  });

  it('credits earnings and sends the completion OTP to the customer on repair completion', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 500);
    seedJob(db, 'job1', 1500);
    db.users.set('c1', { id: 'c1', phone: '+923001234567' });
    db.repairs.set('repair1', { id: 'repair1', jobId: 'job1', workerId: 'w1' });
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);

    await service.handleRepairCompleted({ repairId: 'repair1', jobId: 'job1' });
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(2000);
    const earnings = ledgerOfType(db, db.workerWallets.get('w1').id, 'EARNINGS_CREDIT');
    expect(toNum(earnings[0].amount)).toBe(1500);
    expect(toNum(earnings[0].balanceAfter)).toBe(2000);
    expect(fakes.eventBus.emit).toHaveBeenCalledWith('earnings.recorded', {
      jobId: 'job1',
      workerId: 'w1',
      amount: 1500,
    });
    expect(fakes.smsSend).toHaveBeenCalledWith('+923001234567', expect.stringMatching(/^\d{6}$/));
  });

  it('finalizes the hold + credits the platform wallet on OTP confirmation (idempotent)', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 1000);
    seedJob(db, 'job1', 2000);
    db.users.set('c1', { id: 'c1', phone: '+923001234567' });
    db.repairs.set('repair1', { id: 'repair1', jobId: 'job1', workerId: 'w1' });
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);

    await service.holdCommission({ jobId: 'job1', workerId: 'w1' });
    await service.handleRepairCompleted({ repairId: 'repair1', jobId: 'job1' });
    const otp = fakes.smsSend.mock.calls[0][1] as string;

    const confirmed = await service.confirmCommission('w1', { jobId: 'job1', otp });
    expect(confirmed.finalized).toBe(true);
    expect(findCommission(db, 'job1').status).toBe('DEDUCTED');
    expect(toNum(db.platformWallets.get('platform').balance)).toBe(200);
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(2800);
    expect(fakes.eventBus.emit).toHaveBeenCalledWith('commission.deducted', expect.any(Object));

    const again = await service.confirmCommission('w1', { jobId: 'job1', otp });
    expect(again.alreadyFinalized).toBe(true);
    expect(toNum(db.platformWallets.get('platform').balance)).toBe(200);
  });

  it('rejects an invalid completion OTP', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 1000);
    seedJob(db, 'job1', 2000);
    db.users.set('c1', { id: 'c1', phone: '+923001234567' });
    db.repairs.set('repair1', { id: 'repair1', jobId: 'job1', workerId: 'w1' });
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);

    await service.holdCommission({ jobId: 'job1', workerId: 'w1' });
    await service.handleRepairCompleted({ repairId: 'repair1', jobId: 'job1' });

    await expect(service.confirmCommission('w1', { jobId: 'job1', otp: '000000' })).rejects.toThrow(
      BadRequestException,
    );
    expect(findCommission(db, 'job1').status).toBe('HELD');
  });

  it('prevents confirming another worker’s commission', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 1000);
    seedJob(db, 'job1', 2000);
    db.users.set('c1', { id: 'c1', phone: '+923001234567' });
    db.repairs.set('repair1', { id: 'repair1', jobId: 'job1', workerId: 'w1' });
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);

    await service.holdCommission({ jobId: 'job1', workerId: 'w1' });
    await service.handleRepairCompleted({ repairId: 'repair1', jobId: 'job1' });
    const otp = fakes.smsSend.mock.calls[0][1] as string;

    await expect(service.confirmCommission('w2', { jobId: 'job1', otp })).rejects.toThrow(
      expect.anything(),
    );
    expect(findCommission(db, 'job1').status).toBe('HELD');
  });

  it('reverses the held commission on job cancellation before OTP', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 1000);
    seedJob(db, 'job1', 2000);
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);

    await service.holdCommission({ jobId: 'job1', workerId: 'w1' });
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(800);

    await service.handleJobCancelled({ jobId: 'job1' });
    expect(findCommission(db, 'job1').status).toBe('REVERSED');
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(1000);
    const reversal = ledgerOfType(db, db.workerWallets.get('w1').id, 'COMMISSION_REVERSAL');
    expect(toNum(reversal[0].balanceAfter)).toBe(1000);
    expect(fakes.eventBus.emit).toHaveBeenCalledWith('commission.reversed', expect.any(Object));

    await service.handleJobCancelled({ jobId: 'job1' });
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(1000);
  });

  it('does nothing on cancellation when nothing was held', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 500);
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);
    await service.handleJobCancelled({ jobId: 'job1' });
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(500);
  });
});

describe('WalletService — withdrawal + offline rule + platform wallet', () => {
  it('withdraws a self-service payout of at least Rs. 100', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 500);
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);

    const result = await service.withdraw('w1', { amount: 200, requestId: 'req-1' });
    expect(result.status).toBe('PROCESSED');
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(300);
    const withdrawals = ledgerOfType(db, db.workerWallets.get('w1').id, 'WITHDRAWAL');
    expect(toNum(withdrawals[0].balanceAfter)).toBe(300);

    const dup = await service.withdraw('w1', { amount: 200, requestId: 'req-1' });
    expect(dup.status).toBe('ALREADY_PROCESSED');
  });

  it('blocks withdrawal below the minimum and beyond the balance', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 50);
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);

    await expect(service.withdraw('w1', { amount: WALLET_MIN_WITHDRAWAL - 1 })).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.withdraw('w1', { amount: 200 })).rejects.toThrow(BadRequestException);
    expect(toNum(db.workerWallets.get('w1').balance)).toBe(50);
  });

  it('forces the worker offline when the balance drops below -500 Rs', async () => {
    const db = new Db();
    seedWorker(db, 'w1', 0);
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);
    db.workerProfiles.set('w1', { userId: 'w1', isAvailable: true });

    await (service as any).enforceOfflineRule(fakes.prisma, 'w1', -600);
    expect(db.workerProfiles.get('w1').isAvailable).toBe(false);
  });

  it('reports the platform wallet balance', async () => {
    const db = new Db();
    db.platformWallets.set('platform', { id: 'platform', balance: 1250 });
    const fakes = makeFakes(db);
    const service = makeService(db, fakes);
    expect(await service.getPlatformBalance()).toEqual({ balance: 1250, currency: 'PKR' });
  });
});