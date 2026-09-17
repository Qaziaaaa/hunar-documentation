import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../../common/types/jwt-payload.interface';

// TEMPORARY JWT strategy — part of the placeholder auth (Hakim Ullah's real Auth module replaces this).
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    // Access tokens only — refresh tokens carry `purpose: 'refresh'`.
    if ((payload as unknown as { purpose?: string }).purpose === 'refresh') {
      return payload as unknown as JwtPayload;
    }
    return { sub: payload.sub, phone: payload.phone, role: payload.role };
  }
}
