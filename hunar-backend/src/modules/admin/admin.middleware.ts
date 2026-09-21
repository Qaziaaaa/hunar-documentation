import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
    const user = (req as any).user;

    if (!user || !adminRoles.includes(user.role)) {
      res.status(403).json({
        statusCode: 403,
        message: 'Forbidden: Admin access required',
        error: 'Forbidden',
      });
      return;
    }

    next();
  }
}