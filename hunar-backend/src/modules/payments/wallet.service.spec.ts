import { BadRequestException } from '@nestjs/common';
import { WalletLedgerType } from '@prisma/client';
import { WalletService } from './wallet.service';
import { LedgerService } from './ledger.service';

function makeDb() {
  const wallets = new Map<string, any>();
  const topups = new Map<string, any>();
  const commissions = new Map<string, any>();
  const ledgers: any[] = [];
  const jobs = new Map<string, any>();
  let platformWallet: any = null;
  let seq = 0;

  const db: any = {
    workerWallet: {
      async upsert({ where, create }: any) {
        let wallet = wallets.get(where.userId);
        if (!wallet) {
          wallet = { userId: where.userId, balance: 0, heldBalance: 0, ...create };
          wallets.set(where.userId, wallet);
        }
        return wallet;
      },
      async update({ where, data }: any) {
        const wallet = wallets.get(where.userId);
        if (!wallet) return null;
        if (data.balance !== undefined) wallet.balance = Number(data.balance);
        if (data.heldBalance !== undefined) wallet.heldBalance = Number(data.heldBalance);
        return wallet;
      },
    },
    serviceRequest: {
      async findUnique({ where }: any) {
        return jobs.get(where.id) ?? null;
      },
    },
    walletTopup: {
      async create({ data }: any) {
        const topup = { id: `tu_${++seq}`, status: 'PENDING', ...data, createdAt: new Date() };
        topups.set(topup.id, topup);
        return topup;
      },
      async findUnique({ where }: any) {
        return topups.get(where.id) ?? null;
      },
      async update({ where, data }: any) {
        const topup = topups.get(where.id);
        if (!topup) return null;
        Object.assign(topup, data);
        return topup;
      },
    },
    commission: {
      async findUnique({ where }: any) {
        if (where.id) return commissions.get(where.id) ?? null;
        return [...commissions.values()].find((c) => c.jobId === where.jobId) ?? null;
      },
      async upsert({ where, create }: any) {
        const existing = [...commissions.values()].find((c) => c.jobId === where.jobId);
        if (existing) return existing;
        const commission = { id: `cm_${++seq}`, ...create };
        commissions.set(commission.id, commission);
        return commission;
      },
      async update({ where, data }: any) {
        const commission = commissions.get(where.id);
        if (!commission) return null;
        Object.assign(commission, data);
        return commission;
      },
      async delete({ where }: any) {
        const commission = commissions.get(where.id);
        commissions.delete(where.id);
        return commission;
      },
    },
    walletLedger: {
      async create({ data }: any) {
        const row = { id: `lg_${++seq}`, ...data, createdAt: new Date() };
        ledgers.push(row);
        return row;
      },
      async groupBy({ where }: any) {
        const sums = new Map<string, number>();
        for (const row of ledgers) {
          if (where?.userId && row.userId !== where.userId) continue;
          sums.set(row.type, (sums.get(row.type) ?? 0) + Number(row.amount));
        }
        return [...sums.entries()].map(([type, amount]) => ({
          type,
          _sum: { amount },
        }));
      },
    },
    platformWallet: {
      async upsert({ where, update, create }: any) {
        if (!platformWallet) {
          platformWallet = { id: where.id, balance: 0, totalCommissions: 0, ...create };
        } else {
          platformWallet.balance += Number(update?.balance?.increment ?? 0);
          platformWallet.totalCommissions += Number(update?.totalCommissions?.increment ?? 0);
        }
        return platformWallet;
      },
      async findUnique() {
        return platformWallet;
      },
    },
    async $transaction(fn: any) {
      return fn(db);
    },
    _store: { wallets, topups, commissions, ledgers, jobs },
  };

  return db;
}

function makeWallet(db: any) {
  const redisStore = new Set<string>();
  const redis = {
    getClient: () => ({
      async set(key: string, _value: string, _mode: string, _ttl: number, nx: string) {
        if (nx === 'NX' && redisStore.has(key)) return null;
        redisStore.add(key);
        return 'OK';
      },
      async del(key: string) {
        redisStore.delete(key);
      },
    }),
    async del(key: string) {
      redisStore.delete(key);
    },
  };
  const eventBus = { emit: jest.fn() };
  const realtime = { emitToRoom: jest.fn(), emitToUser: jest.fn() };
  const config = { get: (_key: string, def?: string) => (_key === 'app.commissionRate' ? '0.10' : def) };
  const ledger = new LedgerService(db);
  const wallet = new WalletService(db, redis as any, eventBus as any, realtime as any, config as any, ledger);
  return { wallet, eventBus, db };
}

function seedJob(db: any, jobId = 'job_1', charge = 1000) {
  db._store.jobs.set(jobId, { id: jobId, lockedVisitCharge: charge, selectedWorkerId: 'worker_1' });
}

function seedWallet(db: any, balance: number, heldBalance = 0) {
  db._store.wallets.set('worker_1', { userId: 'worker_1', balance, heldBalance });
}

describe('WalletService', () => {
  it('returns a balance snapshot', async () => {
    const db = makeDb();
    seedWallet(db, 900, 100);
    const { wallet } = makeWallet(db);

    await expect(wallet.getBalance('worker_1')).resolves.toEqual({
      userId: 'worker_1',
      balance: 900,
      heldBalance: 100,
      totalBalance: 1000,
    });
  });

  it('holds commission idempotently', async () => {
    const db = makeDb();
    seedJob(db);
    seedWallet(db, 1000);
    const { wallet } = makeWallet(db);

    const first = await wallet.holdCommissionForJob('worker_1', 'job_1');
    expect(first.held).toBe(true);
    expect(first.amount).toBe(100);

    const second = await wallet.holdCommissionForJob('worker_1', 'job_1');
    expect(second.alreadyHeld).toBe(true);
    expect(db._store.ledgers.filter((l: any) => l.type === WalletLedgerType.COMMISSION_HELD)).toHaveLength(1);
  });

  it('rejects a hold when balance is insufficient', async () => {
    const db = makeDb();
    seedJob(db);
    seedWallet(db, 10);
    const { wallet } = makeWallet(db);

    await expect(wallet.holdCommissionForJob('worker_1', 'job_1')).rejects.toThrow(BadRequestException);
    await expect(wallet.holdCommissionForJob('worker_1', 'job_1')).rejects.toThrow(/INSUFFICIENT_BALANCE/);
  });

  it('confirms a received commission once', async () => {
    const db = makeDb();
    seedJob(db);
    seedWallet(db, 900, 100);
    db._store.commissions.set('cm_1', {
      id: 'cm_1',
      jobId: 'job_1',
      workerId: 'worker_1',
      amount: 100,
      status: 'RECEIVED',
    });
    const { wallet } = makeWallet(db);

    const result = await wallet.confirmCommission('job_1', 'cm_1');
    expect(result.confirmed).toBe(true);
    expect(db._store.wallets.get('worker_1').heldBalance).toBe(0);
    expect(db._store.ledgers.filter((l: any) => l.type === WalletLedgerType.COMMISSION_DEDUCTED)).toHaveLength(1);

    const again = await wallet.confirmCommission('job_1', 'cm_1');
    expect(again.confirmed).toBe(false);
    expect(again.reason).toBe('ALREADY_CONFIRMED');
  });

  it('does not confirm a pending commission', async () => {
    const db = makeDb();
    seedJob(db);
    seedWallet(db, 900, 100);
    db._store.commissions.set('cm_1', {
      id: 'cm_1',
      jobId: 'job_1',
      workerId: 'worker_1',
      amount: 100,
      status: 'PENDING',
    });
    const { wallet } = makeWallet(db);

    await expect(wallet.confirmCommission('job_1', 'cm_1')).resolves.toMatchObject({
      confirmed: false,
      reason: 'NOT_RECEIVED',
    });
  });

  it('reverses a pending commission and deletes the hold', async () => {
    const db = makeDb();
    seedJob(db);
    seedWallet(db, 900, 100);
    db._store.commissions.set('cm_1', {
      id: 'cm_1',
      jobId: 'job_1',
      workerId: 'worker_1',
      amount: 100,
      status: 'PENDING',
    });
    const { wallet } = makeWallet(db);

    const result = await wallet.reverseCommissionForJob('job_1');
    expect(result.reversed).toBe(true);
    expect(db._store.wallets.get('worker_1')).toMatchObject({ balance: 1000, heldBalance: 0 });
    expect(db._store.commissions.size).toBe(0);
    expect(db._store.ledgers.some((l: any) => l.type === WalletLedgerType.COMMISSION_RELEASED)).toBe(true);
  });

  it('records earnings once per job', async () => {
    const db = makeDb();
    seedJob(db);
    seedWallet(db, 0);
    const { wallet } = makeWallet(db);

    const result = await wallet.recordEarningsForJob('job_1');
    expect(result.credited).toBe(true);
    expect(db._store.wallets.get('worker_1').balance).toBe(1000);

    const again = await wallet.recordEarningsForJob('job_1');
    expect(again.alreadyCredited).toBe(true);
    expect(db._store.ledgers.filter((l: any) => l.type === WalletLedgerType.EARNINGS_CREDIT)).toHaveLength(1);
  });

  it('submits and approves a top-up', async () => {
    const db = makeDb();
    seedWallet(db, 0);
    const { wallet, eventBus } = makeWallet(db);

    const topup = await wallet.submitTopup('worker_1', { amount: 500, screenshotUrl: 'shot.png' } as any);
    expect(topup.status).toBe('PENDING');
    expect(eventBus.emit).toHaveBeenCalledWith('topup.submitted', expect.any(Object));

    const approved = await wallet.decideTopup(topup.id, 'admin_1', { action: 'APPROVED' } as any);
    expect(approved.status).toBe('APPROVED');
    expect(db._store.wallets.get('worker_1').balance).toBe(500);
    expect(db._store.ledgers.some((l: any) => l.type === WalletLedgerType.TOPUP_CREDIT)).toBe(true);
  });

  it('rejects a top-up without changing balance', async () => {
    const db = makeDb();
    seedWallet(db, 100);
    const { wallet } = makeWallet(db);

    const topup = await wallet.submitTopup('worker_1', { amount: 500, screenshotUrl: 'shot.png' } as any);
    const rejected = await wallet.decideTopup(topup.id, 'admin_1', { action: 'REJECTED', reason: 'bad' } as any);

    expect(rejected.status).toBe('REJECTED');
    expect(db._store.wallets.get('worker_1').balance).toBe(100);
  });
});
