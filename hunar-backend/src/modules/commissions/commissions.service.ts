import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { RealtimeService } from '../realtime/realtime.service';
import { AdminVerifyDto, CommissionQueryDto, ScreenshotSubmitDto } from './commissions.validation';

@Injectable()
export class CommissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly realtime: RealtimeService,
  ) {}

  async getMyCommissions(workerId: string, query: CommissionQueryDto) {
    const { page, limit, skip } = normalizePage(query);
    const where = {
      workerId,
      ...(query.status ? { status: query.status as 'PENDING' | 'RECEIVED' | 'VERIFIED' } : {}),
    };
    const [commissions, total] = await this.prisma.$transaction([
      this.prisma.commission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              city: true,
              area: true,
              status: true,
              completedAt: true,
            },
          },
        },
      }),
      this.prisma.commission.count({ where }),
    ]);
    return toPageResult(
      commissions.map((c) => ({
        id: c.id,
        jobId: c.jobId,
        job: c.job,
        visitCharge: Number(c.visitCharge),
        commissionRate: Number(c.commissionRate),
        amount: Number(c.amount),
        status: c.status,
        screenshotUrl: c.screenshotUrl,
        createdAt: c.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  async getCommission(id: string, user: JwtPayload) {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
      include: {
        job: { select: { customerId: true, title: true, city: true, area: true } },
        worker: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!commission) {
      throw new NotFoundException('Commission not found');
    }
    if (user.role === Role.CUSTOMER && commission.job.customerId !== user.sub) {
      throw new ForbiddenException('You are not the owner of this job');
    }
    if (user.role === Role.WORKER && commission.workerId !== user.sub) {
      throw new ForbiddenException('You are not the worker for this commission');
    }
    return commission;
  }

  async getEarningsSummary(workerId: string) {
    const agg = (await this.prisma.commission.groupBy({
      by: ['status'],
      where: { workerId },
      _sum: { amount: true },
    })) as unknown as Array<{
      status: 'PENDING' | 'RECEIVED' | 'VERIFIED';
      _sum: { amount: number | null };
    }>;
    const sumBy = (s: 'PENDING' | 'RECEIVED' | 'VERIFIED'): number => {
      const row = agg.find((a) => a.status === s);
      return row ? Number(row._sum.amount ?? 0) : 0;
    };
    return {
      pending: sumBy('PENDING'),
      received: sumBy('RECEIVED'),
      verified: sumBy('VERIFIED'),
      total: sumBy('PENDING') + sumBy('RECEIVED') + sumBy('VERIFIED'),
    };
  }

  async submitScreenshot(commissionId: string, user: JwtPayload, dto: ScreenshotSubmitDto) {
    const commission = await this.prisma.commission.findUnique({ where: { id: commissionId } });
    if (!commission) {
      throw new NotFoundException('Commission not found');
    }
    if (commission.workerId !== user.sub) {
      throw new ForbiddenException(
        'You can only submit a payment screenshot for your own commission',
      );
    }
    if (commission.status !== 'PENDING') {
      throw new BadRequestException(
        'COMMISSION_INVALID_STATE: screenshot can only be submitted for pending commissions',
      );
    }
    const updated = await this.prisma.commission.update({
      where: { id: commissionId },
      data: { screenshotUrl: dto.screenshotUrl, note: dto.note, status: 'RECEIVED' },
    });
    this.eventBus.emit('commission.statusChanged', {
      commissionId,
      jobId: commission.jobId,
      status: 'RECEIVED',
    });
    return updated;
  }

  async adminVerify(commissionId: string, dto: AdminVerifyDto) {
    const commission = await this.prisma.commission.findUnique({ where: { id: commissionId } });
    if (!commission) {
      throw new NotFoundException('Commission not found');
    }
    if (!['PENDING', 'RECEIVED'].includes(commission.status)) {
      throw new BadRequestException(
        'COMMISSION_INVALID_STATE: commission cannot be updated in its current state',
      );
    }
    const updated = await this.prisma.commission.update({
      where: { id: commissionId },
      data: {
        status: dto.status,
        ...(dto.status === 'VERIFIED' ? { verifiedAt: new Date() } : {}),
      },
    });
    this.eventBus.emit('commission.statusChanged', {
      commissionId,
      jobId: commission.jobId,
      status: dto.status,
    });
    this.realtime.emitToRoom(`user:${commission.workerId}`, 'commission:statusChanged', {
      commissionId,
      status: dto.status,
    });
    return updated;
  }
}
