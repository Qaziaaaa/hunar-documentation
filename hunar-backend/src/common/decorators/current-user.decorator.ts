import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.interface';

// Attaches the authenticated user payload (set by JwtAuthGuard) to the handler.
export const CurrentUser = createParamDecorator(
  (
    data: keyof JwtPayload | undefined,
    ctx: ExecutionContext,
  ): JwtPayload | JwtPayload[keyof JwtPayload] => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    if (!user) {
      return undefined;
    }
    return data ? user[data] : user;
  },
);
