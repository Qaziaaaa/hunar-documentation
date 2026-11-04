import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '../../../common/types/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret =
      config.get<string>('jwt.secret') || config.get<string>('secret') || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload & { purpose?: string }): Promise<JwtPayload> {
    if (payload.purpose === 'refresh') {
      throw new UnauthorizedException('Invalid token');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        phone: true,
        role: true,
        isActive: true,
        suspendedUntil: true,
        suspensionReason: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    if (!user.isActive) {
      // Check if temporary suspension has expired
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
      } else {
        const reason = user.suspensionReason ? ` Reason: ${user.suspensionReason}` : '';
        if (user.suspendedUntil) {
          throw new UnauthorizedException(
            `Account is temporarily suspended until ${user.suspendedUntil.toISOString()}.${reason}`,
          );
        }
        throw new UnauthorizedException(`Account has been suspended.${reason}`);
      }
    }

    return { sub: user.id, phone: user.phone, role: user.role };
  }
}
