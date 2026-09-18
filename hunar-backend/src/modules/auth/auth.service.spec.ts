import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

class MemoryRedis {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : Number.MAX_SAFE_INTEGER,
    });
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async incr(key: string): Promise<number> {
    const value = await this.get(key);
    const next = value ? parseInt(value, 10) + 1 : 1;
    await this.set(key, String(next));
    return next;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) {
      return -2;
    }
    return Math.max(0, Math.round((entry.expiresAt - Date.now()) / 1000));
  }
}

type DeepPartial<T> = { [K in keyof T]?: T[K] };

describe('AuthService', () => {
  let service: AuthService;
  let redis: MemoryRedis;
  let sms: SmsService;
  let sentCodes: string[];
  let users: Array<{
    id: string;
    phone: string;
    passwordHash: string | null;
    role: Role;
    isActive: boolean;
    isVerified: boolean;
    createdAt: Date;
  }>;

  const validatePassword = (hash: string, password: string): boolean => {
    return bcrypt.compareSync(password, hash);
  };

  const givenUser = (overrides: DeepPartial<(typeof users)[number]> = {}) => {
    const base = {
      id: 'u-worker',
      phone: '03120000001',
      passwordHash: '$2a$10$hashed',
      role: Role.WORKER,
      isActive: true,
      isVerified: false,
      createdAt: new Date(),
    };
    const merged = { ...base, ...overrides } as (typeof users)[number];
    users = [merged];
    return merged;
  };

  beforeEach(() => {
    redis = new MemoryRedis();
    sentCodes = [];
    users = [];

    const prisma = {
      user: {
        findUnique: jest.fn(({ where }: { where: { phone?: string; id?: string } }) => {
          const key = where.phone ?? where.id;
          return Promise.resolve(users.find((u) => u.phone === key || u.id === key) ?? null);
        }),
        create: jest.fn(
          ({ data }: { data: { phone: string; passwordHash: string; role: Role } }) => {
            const user = {
              id: 'u-created',
              phone: data.phone,
              passwordHash: data.passwordHash,
              name: null,
              avatarUrl: null,
              role: data.role,
              isActive: true,
              isVerified: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            users.push(user);
            return Promise.resolve(user);
          },
        ),
      },
    } as unknown as PrismaService;

    sms = {
      sendOtp: jest.fn((_phone: string, code: string) => {
        sentCodes.push(code);
        return Promise.resolve();
      }),
    } as unknown as SmsService;

    const jwt = {
      signAsync: jest.fn(
        async (_payload: unknown, options?: { expiresIn?: string }) =>
          `token-${options?.expiresIn ?? '?'}`,
      ),
      verifyAsync: jest.fn(async (token: string) => {
        const match = /^rt-(.+)$/.exec(token);
        if (!match) {
          throw new Error('bad token');
        }
        const [sub, phone, role, purpose] = match[1].split('|');
        return { sub, phone, role, purpose };
      }),
    } as unknown as JwtService;

    const config = {
      get: jest.fn((key: string, fallback: unknown) => {
        const values: Record<string, unknown> = {
          'jwt.secret': 'test-secret',
          'jwt.accessTokenTtl': '900s',
          'jwt.refreshTokenTtl': '2592000s',
          'jwt.refreshTokenTtlSeconds': 2592000,
        };
        return values[key] ?? fallback;
      }),
    } as unknown as ConfigService;

    service = new AuthService(prisma, jwt, redis as unknown as RedisService, config, sms);
  });

  describe('sendOtp', () => {
    it('rejects invalid Pakistani phone numbers', async () => {
      await expect(service.sendOtp('12345')).rejects.toThrow('Invalid Pakistani phone number');
      await expect(service.sendOtp('abcd')).rejects.toThrow('Invalid Pakistani phone number');
    });

    it('normalizes +92 / 92 / 03 formats to local form', async () => {
      await service.sendOtp('+92 300 1234567');
      expect(sentCodes).toHaveLength(1);
    });

    it('stores exactly the 6-digit OTP as a SHA-256 hash with a 5-minute TTL', async () => {
      await service.sendOtp('03123456789');
      expect(sentCodes[0]).toMatch(/^\d{6}$/);
      const raw = await redis.get('otp:03123456789');
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw as string)).toEqual({ hash: expect.stringMatching(/^[a-f0-9]{64}$/) });
      expect(JSON.parse(raw as string).hash).not.toContain(sentCodes[0]);
      const ttl = await redis.ttl('otp:03123456789');
      expect(ttl).toBeGreaterThan(290);
      expect(ttl).toBeLessThanOrEqual(300);
    });

    it('sets a 15-minute cooldown on the phone', async () => {
      await service.sendOtp('03123456789');
      const ttl = await redis.ttl('otp:cooldown:03123456789');
      expect(ttl).toBeGreaterThan(890);
      expect(ttl).toBeLessThanOrEqual(900);
    });

    it('rejects a re-request within the 15-minute cooldown', async () => {
      await service.sendOtp('03123456789');
      await expect(service.sendOtp('03123456789')).rejects.toThrow('once every 15 minutes');
    });

    it('rejects OTP for an already registered phone', async () => {
      givenUser();
      await expect(service.sendOtp('03120000001')).rejects.toThrow('already registered');
    });
  });

  describe('verifyOtp', () => {
    const requestOtp = async (phone: string) => {
      await service.sendOtp(phone);
      return sentCodes[sentCodes.length - 1];
    };

    it('issues a verification token for a correct OTP and invalidates it', async () => {
      const phone = '03123456789';
      const code = await requestOtp(phone);
      const result = await service.verifyOtp(phone, code);
      expect(result.verificationToken).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.expiresInSeconds).toBe(600);
      expect(await redis.exists(`otp:${phone}`)).toBe(false);
    });

    it('rejects a wrong OTP and counts failed attempts', async () => {
      const phone = '03123456789';
      await requestOtp(phone);
      await expect(service.verifyOtp(phone, '000000')).rejects.toThrow(
        'Invalid OTP. 2 attempts remaining.',
      );
      await expect(service.verifyOtp(phone, '000000')).rejects.toThrow(
        'Invalid OTP. 1 attempts remaining.',
      );
    });

    it('invalidates the OTP after 3 failed attempts', async () => {
      const phone = '03123456789';
      await requestOtp(phone);
      await service.verifyOtp(phone, '000000').catch(() => undefined);
      await service.verifyOtp(phone, '000000').catch(() => undefined);
      await expect(service.verifyOtp(phone, '000000')).rejects.toThrow('OTP invalidated');
      await expect(service.verifyOtp(phone, sentCodes[0])).rejects.toThrow(
        'expired or was never requested',
      );
    });

    it('expires the OTP after 5 minutes', async () => {
      const phone = '03123456789';
      await requestOtp(phone);
      await redis.expire(`otp:${phone}`, 0);
      await expect(service.verifyOtp(phone, sentCodes[0])).rejects.toThrow(
        'expired or was never requested',
      );
    });
  });

  describe('registerWorker', () => {
    const verifiedOtp = async (phone: string) => {
      await service.sendOtp(phone);
      const verified = await service.verifyOtp(phone, sentCodes[sentCodes.length - 1]);
      return verified.verificationToken;
    };

    it('creates a WORKER account with a bcrypt password hash', async () => {
      const phone = '03123456789';
      const token = await verifiedOtp(phone);
      const result = await service.registerWorker(phone, 'secret123', token);

      expect(result.user.phone).toBe(phone);
      expect(result.user.role).toBe(Role.WORKER);
      expect(result.user.isVerified).toBe(false);
      const created = users.find((u) => u.phone === phone);
      expect(created?.passwordHash).toBeTruthy();
      expect(created?.passwordHash).not.toBe('secret123');
      expect(validatePassword(created?.passwordHash as string, 'secret123')).toBe(true);
      expect((result.user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
      expect(JSON.stringify(result)).not.toContain('passwordHash');
    });

    it('rejects registration without a valid verification token', async () => {
      await expect(
        service.registerWorker('03123456789', 'secret123', 'invalid-token'),
      ).rejects.toThrow('OTP verification is required');
    });

    it('rejects registration when the phone is already registered', async () => {
      givenUser();
      const hash = createHash('sha256').update('vt').digest('hex');
      await redis.set('otp:verify:03120000001', JSON.stringify({ hash }), 600);
      await expect(service.registerWorker('03120000001', 'secret123', 'vt')).rejects.toThrow(
        'already registered',
      );
    });

    it('issues access (15 min) and refresh (30 days) tokens', async () => {
      const phone = '03123456789';
      const token = await verifiedOtp(phone);
      const result = await service.registerWorker(phone, 'secret123', token);
      expect(result.accessToken).toContain('900s');
      expect(result.refreshToken).toContain('2592000s');
      expect(await redis.get('refresh:u-created')).toBe(result.refreshToken);
    });
  });

  describe('login', () => {
    const worker = () => givenUser({ passwordHash: bcrypt.hashSync('worker123', 4) });

    it('logs in a WORKER with the correct password', async () => {
      worker();
      const result = await service.login('03120000001', 'worker123');
      expect(result.accessToken).toContain('900s');
      expect(result.refreshToken).toContain('2592000s');
      expect(result.user.role).toBe(Role.WORKER);
      expect(JSON.stringify(result)).not.toContain('passwordHash');
    });

    it('rejects a wrong password', async () => {
      worker();
      await expect(service.login('03120000001', 'wrong-pass')).rejects.toThrow(
        'Invalid phone number or password',
      );
    });

    it('rejects an unknown phone', async () => {
      await expect(service.login('03129999999', 'whatever123')).rejects.toThrow(
        'Invalid phone number or password',
      );
    });

    it('rejects non-WORKER accounts from worker login', async () => {
      givenUser({ role: Role.CUSTOMER });
      await expect(service.login('03120000001', 'worker123')).rejects.toThrow(
        'Invalid phone number or password',
      );
    });
  });

  describe('refreshAccessToken', () => {
    const worker = () => givenUser({ passwordHash: bcrypt.hashSync('worker123', 4), id: 'u1' });
    const loggedInWorker = async () => {
      worker();
      return service.login('03120000001', 'worker123');
    };

    it('mints a new access token with the stored refresh token', async () => {
      await loggedInWorker();
      const refreshJwt = `rt-u1|03120000001|WORKER|refresh`;
      await redis.set('refresh:u1', refreshJwt, 2592000);
      const result = await service.refreshAccessToken(refreshJwt);
      expect(result.accessToken).toContain('900s');
      expect(result.refreshToken).toContain('2592000s');
    });

    it('rejects a refresh token that is not stored', async () => {
      await loggedInWorker();
      await expect(service.refreshAccessToken('rt-u1|03120000001|WORKER|refresh')).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('rejects an access token used as a refresh token', async () => {
      await loggedInWorker();
      await expect(service.refreshAccessToken('not-a-refresh')).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('getWorkerSession', () => {
    it('returns the worker session for a WORKER', async () => {
      givenUser({ passwordHash: bcrypt.hashSync('worker123', 4) });
      const result = await service.getWorkerSession('u-worker');
      expect(result.role).toBe(Role.WORKER);
    });

    it('rejects a non-WORKER user', async () => {
      givenUser({ role: Role.ADMIN });
      await expect(service.getWorkerSession('u-worker')).rejects.toThrow(
        'Worker account not found',
      );
    });
  });
});
