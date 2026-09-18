import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import {
  OTP_ATTEMPTS_PREFIX,
  OTP_COOLDOWN_PREFIX,
  OTP_PREFIX,
  OTP_RATE_PREFIX,
  OTP_VERIFY_PREFIX,
  OTP_VERIFY_RATE_PREFIX,
  REFRESH_TOKEN_PREFIX,
} from '../../common/redis/redis.constants';
import { normalizePakistaniPhone } from '../../common/helpers/phone.util';
import { generateOtp } from '../../common/helpers/otp.generator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { SmsService } from './sms.service';

const OTP_TTL_SECONDS = 5 * 60;
const OTP_MAX_ATTEMPTS = 3;
const OTP_COOLDOWN_SECONDS = 15 * 60;
const OTP_VERIFY_TTL_SECONDS = 10 * 60;
const OTP_SEND_RATE_MAX = 3;
const OTP_SEND_RATE_WINDOW_SECONDS = 5 * 60;
const OTP_VERIFY_RATE_MAX = 5;
const OTP_VERIFY_RATE_WINDOW_SECONDS = 5 * 60;
const ACCESS_TOKEN_TTL = '900s';
const REFRESH_TOKEN_TTL = '2592000s';
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const BCRYPT_ROUNDS = 10;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: SafeUser;
}

export interface SafeUser {
  id: string;
  phone: string;
  name: string;
  role: Role;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export interface OtpSendResult {
  message: string;
  expiresInSeconds: number;
  cooldownSeconds: number;
}

export interface OtpVerifyResult {
  verificationToken: string;
  expiresInSeconds: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly sms: SmsService,
  ) {}

  async sendOtp(rawPhone: string): Promise<OtpSendResult> {
    const phone = this.requireValidPhone(rawPhone);

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException('This phone number is already registered');
    }

    if (await this.redis.exists(`${OTP_COOLDOWN_PREFIX}${phone}`)) {
      throw new HttpException(
        'An OTP can only be re-requested once every 15 minutes',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.enforceRateLimit(
      `${OTP_RATE_PREFIX}${phone}`,
      OTP_SEND_RATE_MAX,
      OTP_SEND_RATE_WINDOW_SECONDS,
      'Too many OTP requests. Please try again later.',
    );

    const otp = generateOtp();
    await this.redis.set(
      `${OTP_PREFIX}${phone}`,
      JSON.stringify({ hash: this.hashValue(otp) }),
      OTP_TTL_SECONDS,
    );
    await this.redis.set(`${OTP_COOLDOWN_PREFIX}${phone}`, '1', OTP_COOLDOWN_SECONDS);
    await this.sms.sendOtp(phone, otp);

    return {
      message: 'OTP sent to your phone',
      expiresInSeconds: OTP_TTL_SECONDS,
      cooldownSeconds: OTP_COOLDOWN_SECONDS,
    };
  }

  async verifyOtp(rawPhone: string, otp: string): Promise<OtpVerifyResult> {
    const phone = this.requireValidPhone(rawPhone);

    await this.enforceRateLimit(
      `${OTP_VERIFY_RATE_PREFIX}${phone}`,
      OTP_VERIFY_RATE_MAX,
      OTP_VERIFY_RATE_WINDOW_SECONDS,
      'Too many verification attempts. Please try again later.',
    );

    const otpKey = `${OTP_PREFIX}${phone}`;
    const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${phone}`;

    const storedRaw = await this.redis.get(otpKey);
    if (!storedRaw) {
      throw new BadRequestException(
        'OTP is expired or was never requested. Please request a new OTP.',
      );
    }

    const ttl = await this.redis.ttl(otpKey);
    const attempts = await this.redis.incr(attemptsKey);
    await this.redis.expire(attemptsKey, Math.max(ttl, 1));

    if (attempts > OTP_MAX_ATTEMPTS) {
      await this.redis.del(otpKey);
      await this.redis.del(attemptsKey);
      throw new BadRequestException('Too many failed attempts. Please request a new OTP.');
    }

    let stored: { hash: string };
    try {
      stored = JSON.parse(storedRaw) as { hash: string };
    } catch {
      await this.redis.del(otpKey);
      throw new BadRequestException('Invalid OTP record. Please request a new OTP.');
    }

    if (!this.matchesHash(otp, stored.hash)) {
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await this.redis.del(otpKey);
        await this.redis.del(attemptsKey);
        throw new BadRequestException(
          'Too many failed attempts. OTP invalidated. Please request a new OTP.',
        );
      }
      throw new BadRequestException(
        `Invalid OTP. ${OTP_MAX_ATTEMPTS - attempts} attempts remaining.`,
      );
    }

    await this.redis.del(otpKey);
    await this.redis.del(attemptsKey);

    const verificationToken = randomUUID();
    await this.redis.set(
      `${OTP_VERIFY_PREFIX}${phone}`,
      JSON.stringify({ hash: this.hashValue(verificationToken) }),
      OTP_VERIFY_TTL_SECONDS,
    );

    return { verificationToken, expiresInSeconds: OTP_VERIFY_TTL_SECONDS };
  }

  async registerWorker(
    rawPhone: string,
    password: string,
    verificationToken: string,
  ): Promise<AuthResult> {
    const phone = this.requireValidPhone(rawPhone);

    const verifyRaw = await this.redis.get(`${OTP_VERIFY_PREFIX}${phone}`);
    if (!verifyRaw) {
      throw new UnauthorizedException(
        'OTP verification is required before completing registration',
      );
    }

    let stored: { hash: string };
    try {
      stored = JSON.parse(verifyRaw) as { hash: string };
    } catch {
      stored = { hash: '' };
    }
    if (typeof stored.hash !== 'string' || !this.matchesHash(verificationToken, stored.hash)) {
      throw new UnauthorizedException('Invalid verification token. Please verify the OTP again.');
    }

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException('This phone number is already registered');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { phone, passwordHash, role: Role.WORKER },
    });

    await this.redis.del(`${OTP_VERIFY_PREFIX}${phone}`);
    await this.redis.del(`${OTP_COOLDOWN_PREFIX}${phone}`);

    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.toSafeUser(user) };
  }

  async login(rawPhone: string, password: string): Promise<AuthResult> {
    const phone = this.requireValidPhone(rawPhone);

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.role !== Role.WORKER) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.toSafeUser(user) };
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload & { purpose?: string };
    try {
      payload = await this.jwt.verifyAsync<JwtPayload & { purpose?: string }>(refreshToken, {
        secret: this.config.get<string>('jwt.secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.purpose !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.redis.get(`${REFRESH_TOKEN_PREFIX}${payload.sub}`);
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.redis.del(`${REFRESH_TOKEN_PREFIX}${user.id}`);
    return this.issueTokens(user);
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toSafeUser(user);
  }

  async getWorkerSession(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.WORKER) {
      throw new UnauthorizedException('Worker account not found');
    }
    return this.toSafeUser(user);
  }

  async logout(userId: string): Promise<void> {
    await this.redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, phone: user.phone, role: user.role };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.accessTokenTtl', ACCESS_TOKEN_TTL),
    });

    const refreshToken = await this.jwt.signAsync(
      { ...payload, purpose: 'refresh' },
      {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.refreshTokenTtl', REFRESH_TOKEN_TTL),
      },
    );

    await this.redis.set(
      `${REFRESH_TOKEN_PREFIX}${user.id}`,
      refreshToken,
      this.config.get<number>('jwt.refreshTokenTtlSeconds', REFRESH_TOKEN_TTL_SECONDS),
    );

    return { accessToken, refreshToken };
  }

  private requireValidPhone(rawPhone: string): string {
    const phone = normalizePakistaniPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException('Invalid Pakistani phone number');
    }
    return phone;
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private matchesHash(value: string, hash: string): boolean {
    const a = Buffer.from(this.hashValue(value), 'hex');
    const b = Buffer.from(hash, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private async enforceRateLimit(
    key: string,
    max: number,
    windowSeconds: number,
    message: string,
  ): Promise<void> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    if (count > max) {
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      phone: user.phone,
      name: user.name ?? '',
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }
}
