import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { REFRESH_TOKEN_PREFIX } from '../../common/redis/redis.constants';
import { JwtPayload } from '../../common/types/jwt-payload.interface';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; phone: string; name: string; role: string; isVerified: boolean };
}

// TEMPORARY / PLACEHOLDER AUTH — for testing Shafqat Ullah's modules only.
// The real HUNAR Auth module (OTP + password + refresh rotation) is owned by Hakim Ullah and will replace this.
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async login(phone: string, password: string): Promise<LoginResult> {
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

    const payload: JwtPayload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.accessTokenTtl', '900s'),
    });
    const refreshToken = await this.jwt.signAsync(
      { ...payload, purpose: 'refresh' },
      {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.refreshTokenTtl', '2592000s'),
      },
    );

    // Store refresh token in Redis (30 days) — session records live here per the architecture docs.
    const ttl = this.config.get<number>('jwt.refreshTokenTtlSeconds', 2592000);
    await this.redis.set(`${REFRESH_TOKEN_PREFIX}${user.id}`, refreshToken, ttl);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name ?? '',
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  async me(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async logout(userId: string): Promise<void> {
    await this.redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
  }
}
