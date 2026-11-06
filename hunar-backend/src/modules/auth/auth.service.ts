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
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import {
  LOGIN_RATE_PREFIX,
  OTP_ATTEMPTS_PREFIX,
  OTP_COOLDOWN_PREFIX,
  OTP_PREFIX,
  OTP_RATE_PREFIX,
  OTP_VERIFY_PREFIX,
  OTP_VERIFY_RATE_PREFIX,
  REFRESH_TOKEN_PREFIX,
  WORKER_EMAIL_OTP_ACTIVE_PREFIX,
  WORKER_EMAIL_OTP_ATTEMPTS_PREFIX,
  WORKER_EMAIL_OTP_COOLDOWN_PREFIX,
  WORKER_EMAIL_OTP_PREFIX,
  WORKER_EMAIL_OTP_RATE_PREFIX,
  WORKER_EMAIL_OTP_VERIFY_RATE_PREFIX,
  WORKER_EMAIL_VERIFIED_PREFIX,
} from '../../common/redis/redis.constants';
import { normalizePakistaniPhone } from '../../common/helpers/phone.util';
import { generateOtp } from '../../common/helpers/otp.generator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';

const OTP_TTL_SECONDS = 5 * 60;
const OTP_MAX_ATTEMPTS = 3;
const OTP_COOLDOWN_SECONDS = 15 * 60;
const OTP_VERIFY_TTL_SECONDS = 10 * 60;
const OTP_SEND_RATE_MAX = 3;
const OTP_SEND_RATE_WINDOW_SECONDS = 5 * 60;
const OTP_VERIFY_RATE_MAX = 5;
const OTP_VERIFY_RATE_WINDOW_SECONDS = 5 * 60;
const LOGIN_RATE_MAX = 5;
const LOGIN_RATE_WINDOW_SECONDS = 5 * 60;
const ACCESS_TOKEN_TTL = '7d';
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
  name?: string | null;
  avatarUrl?: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export interface OtpSendResult {
  message: string;
  expiresInSeconds: number;
  cooldownSeconds: number;
  /**
   * Returned only while no real SMS gateway is wired (OTP_DEBUG !== 'false').
   * Lets a real user read their code on screen so signup can be completed.
   */
  devOtp?: string;
}

export interface OtpVerifyResult {
  verificationToken: string;
  expiresInSeconds: number;
}

export interface WorkerEmailOtpSendResult {
  message: string;
  requestId: string;
  expiresInSeconds: number;
  cooldownSeconds: number;
  /**
   * Returned only while the email provider is not configured (OTP_DEBUG !==
   * 'false'). Lets a real user read their code on screen so signup can finish.
   */
  devOtp?: string;
}

export interface WorkerEmailOtpVerifyResult extends OtpVerifyResult {
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly sms: SmsService,
    private readonly email: EmailService,
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
      ...(this.returnOtpInResponse() ? { devOtp: otp } : {}),
    };
  }

  /**
   * No SMS gateway is connected yet (SmsService only logs the code), so the
   * code is also returned to the caller. Set OTP_DEBUG=false the moment a real
   * provider is added in SmsService.
   */
  private returnOtpInResponse(): boolean {
    return process.env.OTP_DEBUG !== 'false';
  }

  async sendWorkerEmailOtp(rawPhone: string, rawEmail: string): Promise<WorkerEmailOtpSendResult> {
    const phone = this.requireValidPhone(rawPhone);
    const email = this.requireValidEmail(rawEmail);

    const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      throw new ConflictException('This phone number is already registered');
    }

    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('This email address is already registered');
    }

    const cooldownKey = `${WORKER_EMAIL_OTP_COOLDOWN_PREFIX}${phone}:${email}`;
    if (await this.redis.exists(cooldownKey)) {
      throw new HttpException(
        'An OTP can only be re-requested once every 15 minutes',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.enforceRateLimit(
      `${WORKER_EMAIL_OTP_RATE_PREFIX}${phone}`,
      OTP_SEND_RATE_MAX,
      OTP_SEND_RATE_WINDOW_SECONDS,
      'Too many OTP requests. Please try again later.',
    );

    const requestId = randomUUID();
    const otp = generateOtp();
    const activeKey = `${WORKER_EMAIL_OTP_ACTIVE_PREFIX}${phone}:${email}`;
    const otpKey = `${WORKER_EMAIL_OTP_PREFIX}${requestId}`;

    const previousRequestId = await this.redis.get(activeKey);

    await this.redis.set(
      otpKey,
      JSON.stringify({ hash: this.hashValue(otp), phone, email }),
      OTP_TTL_SECONDS,
    );

    let emailDelivered = true;
    try {
      const delivered = await this.email.sendWorkerOtp(email, otp);
      if (delivered === false) {
        emailDelivered = false;
      }
    } catch (error) {
      await this.redis.del(otpKey);
      throw error;
    }

    if (previousRequestId) {
      await this.redis.del(`${WORKER_EMAIL_OTP_PREFIX}${previousRequestId}`);
      await this.redis.del(`${WORKER_EMAIL_OTP_ATTEMPTS_PREFIX}${previousRequestId}`);
    }
    await this.redis.set(activeKey, requestId, OTP_TTL_SECONDS);
    await this.redis.set(cooldownKey, '1', OTP_COOLDOWN_SECONDS);

    return {
      message: 'OTP sent to your email',
      requestId,
      expiresInSeconds: OTP_TTL_SECONDS,
      cooldownSeconds: OTP_COOLDOWN_SECONDS,
      ...(this.returnEmailOtpInResponse(emailDelivered) ? { devOtp: otp } : {}),
    };
  }

  /**
   * Only expose the code when it could not be delivered by email (provider not
   * configured or delivery failed) and OTP_DEBUG is enabled. When delivery
   * succeeds, the code is never returned to the client.
   */
  private returnEmailOtpInResponse(emailDelivered = true): boolean {
    const configured =
      typeof this.email.isConfigured === 'function'
        ? this.email.isConfigured()
        : true;
    return (!configured || !emailDelivered) && this.returnOtpInResponse();
  }

  async verifyWorkerEmailOtp(
    rawPhone: string,
    rawEmail: string,
    otp: string,
    requestId: string,
  ): Promise<WorkerEmailOtpVerifyResult> {
    const phone = this.requireValidPhone(rawPhone);
    const email = this.requireValidEmail(rawEmail);

    await this.enforceRateLimit(
      `${WORKER_EMAIL_OTP_VERIFY_RATE_PREFIX}${requestId}`,
      OTP_VERIFY_RATE_MAX,
      OTP_VERIFY_RATE_WINDOW_SECONDS,
      'Too many verification attempts. Please try again later.',
    );

    const activeKey = `${WORKER_EMAIL_OTP_ACTIVE_PREFIX}${phone}:${email}`;
    const otpKey = `${WORKER_EMAIL_OTP_PREFIX}${requestId}`;
    const attemptsKey = `${WORKER_EMAIL_OTP_ATTEMPTS_PREFIX}${requestId}`;

    const activeRequestId = await this.redis.get(activeKey);
    if (!activeRequestId || activeRequestId !== requestId) {
      throw new BadRequestException(
        'OTP is expired or was never requested. Please request a new OTP.',
      );
    }

    const storedRaw = await this.redis.get(otpKey);
    if (!storedRaw) {
      await this.redis.del(activeKey);
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
      await this.redis.del(activeKey);
      throw new BadRequestException('Too many failed attempts. Please request a new OTP.');
    }

    let stored: { hash: string; phone: string; email: string };
    try {
      stored = JSON.parse(storedRaw) as { hash: string; phone: string; email: string };
    } catch {
      await this.redis.del(otpKey);
      await this.redis.del(activeKey);
      throw new BadRequestException('Invalid OTP record. Please request a new OTP.');
    }

    if (stored.phone !== phone || stored.email !== email) {
      throw new BadRequestException(
        'OTP does not belong to this registration attempt. Please request a new OTP.',
      );
    }

    if (!this.matchesHash(otp, stored.hash)) {
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await this.redis.del(otpKey);
        await this.redis.del(attemptsKey);
        await this.redis.del(activeKey);
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
    await this.redis.del(activeKey);

    const verificationToken = randomUUID();
    await this.redis.set(
      `${WORKER_EMAIL_VERIFIED_PREFIX}${phone}`,
      JSON.stringify({ hash: this.hashValue(verificationToken), email }),
      OTP_VERIFY_TTL_SECONDS,
    );

    return {
      verificationToken,
      expiresInSeconds: OTP_VERIFY_TTL_SECONDS,
      email,
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

    const verifyRaw = await this.redis.get(`${WORKER_EMAIL_VERIFIED_PREFIX}${phone}`);
    if (!verifyRaw) {
      throw new UnauthorizedException(
        'Email verification is required before completing registration',
      );
    }

    let stored: { hash: string; email?: string };
    try {
      stored = JSON.parse(verifyRaw) as { hash: string; email?: string };
    } catch {
      stored = { hash: '' };
    }
    if (typeof stored.hash !== 'string' || !this.matchesHash(verificationToken, stored.hash)) {
      throw new UnauthorizedException('Invalid verification token. Please verify the OTP again.');
    }

    const email = this.requireValidEmail(stored.email ?? '');

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException('This phone number is already registered');
    }

    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('This email address is already registered');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { phone, email, passwordHash, role: Role.WORKER },
    });

    await this.redis.del(`${WORKER_EMAIL_VERIFIED_PREFIX}${phone}`);
    await this.redis.del(`${WORKER_EMAIL_OTP_COOLDOWN_PREFIX}${phone}:${email}`);
    await this.redis.del(`${WORKER_EMAIL_OTP_ACTIVE_PREFIX}${phone}:${email}`);
    await this.redis.del(`${OTP_COOLDOWN_PREFIX}${phone}`);

    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.toSafeUser(user) };
  }

  async registerCustomer(
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
      data: { phone, passwordHash, role: Role.CUSTOMER },
    });

    await this.redis.del(`${OTP_VERIFY_PREFIX}${phone}`);
    await this.redis.del(`${OTP_COOLDOWN_PREFIX}${phone}`);

    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.toSafeUser(user) };
  }

  async login(rawPhone: string, password: string): Promise<AuthResult> {
    const phone = this.requireValidPhone(rawPhone);

    await this.enforceRateLimit(
      `${LOGIN_RATE_PREFIX}${phone}`,
      LOGIN_RATE_MAX,
      LOGIN_RATE_WINDOW_SECONDS,
      'Too many login attempts. Please try again later.',
    );

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    if (!user.isActive) {
      if (user.suspendedUntil && user.suspendedUntil <= new Date()) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            isActive: true,
            suspendedUntil: null,
            suspensionReason: null,
            suspensionType: null,
          },
        });
        user.isActive = true;
      } else {
        if (user.suspendedUntil) {
          throw new UnauthorizedException(
            `Account is temporarily suspended until ${user.suspendedUntil.toLocaleString()}. Reason: ${user.suspensionReason || 'Terms violation'}`,
          );
        }
        throw new UnauthorizedException(
          `Account is permanently suspended. Reason: ${user.suspensionReason || 'Account suspended by admin'}`,
        );
      }
    }

    if (user.role !== Role.WORKER) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.toSafeUser(user) };
  }

  async loginCustomer(rawPhone: string, password: string): Promise<AuthResult> {
    const phone = this.requireValidPhone(rawPhone);

    await this.enforceRateLimit(
      `${LOGIN_RATE_PREFIX}${phone}`,
      LOGIN_RATE_MAX,
      LOGIN_RATE_WINDOW_SECONDS,
      'Too many login attempts. Please try again later.',
    );

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    if (!user.isActive) {
      if (user.suspendedUntil && user.suspendedUntil <= new Date()) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            isActive: true,
            suspendedUntil: null,
            suspensionReason: null,
            suspensionType: null,
          },
        });
        user.isActive = true;
      } else {
        if (user.suspendedUntil) {
          throw new UnauthorizedException(
            `Account is temporarily suspended until ${user.suspendedUntil.toLocaleString()}. Reason: ${user.suspensionReason || 'Terms violation'}`,
          );
        }
        throw new UnauthorizedException(
          `Account is permanently suspended. Reason: ${user.suspensionReason || 'Account suspended by admin'}`,
        );
      }
    }

    if (user.role !== Role.CUSTOMER) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.toSafeUser(user) };
  }

  async loginAdmin(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    await this.enforceRateLimit(
      `${LOGIN_RATE_PREFIX}admin:${normalizedEmail}`,
      LOGIN_RATE_MAX,
      LOGIN_RATE_WINDOW_SECONDS,
      'Too many login attempts. Please try again later.',
    );

    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } as any });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
      throw new UnauthorizedException('Invalid email or password');
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

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Account has no password set');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
    return { success: true };
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

  private requireValidEmail(rawEmail: string): string {
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Invalid email address');
    }
    return email;
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
      avatarUrl: user.avatarUrl ?? null,
      email: user.email ?? '',
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }
}
