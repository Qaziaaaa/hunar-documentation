import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../../common/types/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
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

  validate(payload: JwtPayload & { purpose?: string }): JwtPayload {
    if (payload.purpose === 'refresh') {
      throw new UnauthorizedException('Invalid token');
    }
    return { sub: payload.sub, phone: payload.phone, role: payload.role };
  }
}
