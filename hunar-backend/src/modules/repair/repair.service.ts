import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RepairStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { JobsService } from '../jobs/jobs.service';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { RealtimeService } from '../realtime/realtime.service';
import { JOB_EVENTS, userRoom } from '../jobs/jobs.events';
import { calculateCommission } from '../../common/helpers/commission.util';
import {
  RepairAcceptDto,
  RepairCounterDto,
  RepairEstimateDto,
  RepairQueryDto,
  RepairRevisionDto,
} from './repair.validation';

@Injectable()
export class RepairService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly jobsService: JobsService,
    private readonly realtime: RealtimeService,
    private readonly config: ConfigService,
  ) {}

  private get maxRounds(): number {
    return this.config.get<number>('app.maxNegotiationRounds', 5);
  }

  private assertCustomerAccess(job: { customerId: string }, user: JwtPayload) {
    if (user.role === Role.CUSTOMER && job.customerId !== user.sub) {
      throw new ForbiddenException('You are not the owner of this job');
    }
  }

  private async loadRepair(id: string) {
    const repair = await this.prisma.repair.findUnique({
      where: { id },
      include: { visit: true, job: true, revisions: true },
    });
    if (!repair) {
      throw new NotFoundException('Repair not found');
    }
    return repair;
  }

  async createEstimate(visitId: string, user: JwtPayload, dto: RepairEstimateDto) {
    const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) {
      throw new NotFoundException('Visit not found');
    }
    if (visit.workerId !== user.sub) {
      throw new ForbiddenException('Only the assigned worker can submit a repair estimate');
    }
    if (!visit.inspectionSubmittedAt) {
      throw new BadRequestException('Inspection must be submitted before a repair estimate');
    }
    const job = await this.prisma.serviceRequest.findUniqueOrThrow({ where: { id: visit.jobId } });
    if (job.status !== 'INSPECTION_DONE') {
      throw new BadRequestException(
        'JOB_INVALID_STATE: estimate requires inspection to be complete',
      );
    }

    const repair = await this.prisma.repair.create({
      data: {
        visitId,
        jobId: visit.jobId,
        workerId: user.sub,
        description: dto.description,
        amount: dto.amount,
        itemsBreakdown: dto.itemsBreakdown ? (dto.itemsBreakdown as object) : undefined,
        status: 'PROPOSED',
        negotiationRound: 0,
        negotiationHistory: [],
      },
    });
    await this.jobsService.transitionJobState(visit.jobId, 'REPAIR_NEGOTIATING');

    this.eventBus.emit('repair.proposed', {
      repairId: repair.id,
      jobId: visit.jobId,
      amount: dto.amount,
    });
    this.realtime.emitToRoom(userRoom(job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId: visit.jobId,
      oldStatus: 'INSPECTION_DONE',
      newStatus: 'REPAIR_NEGOTIATING',
    });
    return repair;
  }

  async getMyRepairs(user: JwtPayload, query: RepairQueryDto) {
    const { page, limit, skip } = normalizePage(query);
    const where =
      user.role === Role.WORKER ? { workerId: user.sub } : { job: { customerId: user.sub } };
    const whereWithStatus = query.status
      ? { ...where, status: query.status as RepairStatus }
      : where;

    const [repairs, total] = await this.prisma.$transaction([
      this.prisma.repair.findMany({
        where: whereWithStatus,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: { id: true, title: true, status: true, city: true, area: true },
          },
          revisions: { orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.repair.count({ where: whereWithStatus }),
    ]);
    return toPageResult(repairs, total, page, limit);
  }

  async getRepairDetail(id: string, user: JwtPayload) {
    const repair = await this.loadRepair(id);
    this.assertCustomerAccess(repair.job, user);
    if (user.role === Role.WORKER && repair.workerId !== user.sub) {
      throw new ForbiddenException('You are not the worker for this repair');
    }
    return {
      ...repair,
      amount: Number(repair.amount),
      lockedAmount: repair.lockedAmount ? Number(repair.lockedAmount) : null,
    };
  }

  async counterRepair(id: string, user: JwtPayload, dto: RepairCounterDto) {
    const repair = await this.loadRepair(id);
    this.assertCustomerAccess(repair.job, user);
    let by: 'worker' | 'customer';
    if (user.role === Role.CUSTOMER) {
      by = 'customer';
    } else if (user.role === Role.WORKER && repair.workerId === user.sub) {
      by = 'worker';
    } else {
      throw new ForbiddenException('Only the customer or the assigned worker can counter');
    }
    if (!['PROPOSED', 'COUNTERED'].includes(repair.status)) {
      throw new BadRequestException(
        'REPAIR_INVALID_STATE: repair cannot be countered in its current state',
      );
    }
    if (repair.revisions.some((r) => r.status === 'PENDING_APPROVAL')) {
      throw new BadRequestException('A scope-change revision is pending approval');
    }
    const nextRound = repair.negotiationRound + 1;
    if (nextRound > this.maxRounds) {
      throw new BadRequestException(
        `MAX_NEGOTIATION_ROUNDS_EXCEEDED: maximum ${this.maxRounds} counter rounds`,
      );
    }
    const history = Array.isArray(repair.negotiationHistory)
      ? [
          ...(repair.negotiationHistory as Array<{
            by: string;
            amount: number;
            note?: string;
            timestamp: string;
          }>),
        ]
      : [];
    history.push({ by, amount: dto.amount, note: dto.note, timestamp: new Date().toISOString() });

    const updated = await this.prisma.repair.update({
      where: { id },
      data: {
        amount: dto.amount,
        status: 'COUNTERED',
        negotiationRound: nextRound,
        negotiationHistory: history,
      },
    });
    this.eventBus.emit('repair.counterOffered', {
      repairId: id,
      jobId: repair.jobId,
      by,
      amount: dto.amount,
      round: nextRound,
    });
    return updated;
  }

  async acceptRepair(id: string, user: JwtPayload, dto: RepairAcceptDto) {
    const repair = await this.loadRepair(id);
    if (user.role !== Role.CUSTOMER && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only the customer can approve a repair quote');
    }
    this.assertCustomerAccess(repair.job, user);
    if (!['PROPOSED', 'COUNTERED'].includes(repair.status)) {
      throw new BadRequestException('REPAIR_INVALID_STATE');
    }
    if (repair.revisions.some((r) => r.status === 'PENDING_APPROVAL')) {
      throw new BadRequestException('A scope-change revision is pending approval');
    }
    const lockedAmount = dto.amount ?? Number(repair.amount);
    if (dto.amount != null && lockedAmount !== Number(repair.amount)) {
      throw new BadRequestException(
        'REPAIR_PRICE_MISMATCH: approved amount must match the quoted amount',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const r = await tx.repair.update({
        where: { id },
        data: { status: 'ACCEPTED', lockedAmount, lockedAt: new Date() },
      });
      await tx.serviceRequest.update({
        where: { id: repair.jobId },
        data: { status: 'REPAIR_APPROVED' },
      });
      return r;
    });

    this.eventBus.emit('repair.approved', { repairId: id, jobId: repair.jobId, lockedAmount });
    this.realtime.emitToRoom(userRoom(repair.workerId), JOB_EVENTS.jobStatusChanged, {
      jobId: repair.jobId,
      oldStatus: 'REPAIR_NEGOTIATING',
      newStatus: 'REPAIR_APPROVED',
    });
    return updated;
  }

  async rejectRepair(id: string, user: JwtPayload) {
    const repair = await this.loadRepair(id);
    this.assertCustomerAccess(repair.job, user);
    if (user.role !== Role.CUSTOMER) {
      throw new ForbiddenException('Only the customer can reject a repair quote');
    }
    if (!['PROPOSED', 'COUNTERED'].includes(repair.status)) {
      throw new BadRequestException('REPAIR_INVALID_STATE');
    }
    return this.prisma.repair.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  async startRepair(id: string, user: JwtPayload) {
    const repair = await this.loadRepair(id);
    if (repair.workerId !== user.sub) {
      throw new ForbiddenException('Only the assigned worker can start the repair');
    }
    if (repair.status !== 'ACCEPTED' || !repair.lockedAmount) {
      throw new BadRequestException(
        'REPAIR_INVALID_STATE: repair must be approved before starting',
      );
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const r = await tx.repair.update({ where: { id }, data: { startedAt: new Date() } });
      await tx.serviceRequest.update({
        where: { id: repair.jobId },
        data: { status: 'IN_PROGRESS' },
      });
      return r;
    });
    this.realtime.emitToRoom(userRoom(repair.job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId: repair.jobId,
      oldStatus: 'REPAIR_APPROVED',
      newStatus: 'IN_PROGRESS',
    });
    return updated;
  }

  async completeRepair(id: string, user: JwtPayload) {
    const repair = await this.loadRepair(id);
    if (repair.workerId !== user.sub) {
      throw new ForbiddenException('Only the assigned worker can complete the repair');
    }
    if (repair.status !== 'ACCEPTED' || !repair.startedAt) {
      throw new BadRequestException(
        'REPAIR_INVALID_STATE: repair must be started before completing',
      );
    }
    if (repair.revisions.some((r) => r.status === 'PENDING_APPROVAL')) {
      throw new BadRequestException('A scope-change revision is still pending approval');
    }
    const rate = this.config.get<number>('app.commissionRate', 0.1);
    const commissionAmount = repair.job.lockedVisitCharge
      ? calculateCommission(Number(repair.job.lockedVisitCharge), rate)
      : 0;

    const updated = await this.prisma.$transaction(async (tx) => {
      const r = await tx.repair.update({
        where: { id },
        data: { completedAt: new Date() },
      });
      await tx.serviceRequest.update({
        where: { id: repair.jobId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      // Auto-create commission (10% of locked visit charge, wallet disabled — paid via WhatsApp).
      if (commissionAmount > 0) {
        await tx.commission.create({
          data: {
            jobId: repair.jobId,
            workerId: repair.workerId,
            visitCharge: repair.job.lockedVisitCharge!,
            commissionRate: rate,
            amount: commissionAmount,
            status: 'PENDING',
          },
        });
      }
      return r;
    });
    this.eventBus.emit('repair.completed', { repairId: id, jobId: repair.jobId });
    if (commissionAmount > 0) {
      this.eventBus.emit('commission.recorded', {
        commissionId: undefined,
        jobId: repair.jobId,
        workerId: repair.workerId,
        amount: commissionAmount,
      });
    }
    this.realtime.emitToRoom(userRoom(repair.job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId: repair.jobId,
      oldStatus: 'IN_PROGRESS',
      newStatus: 'COMPLETED',
    });
    return updated;
  }

  async requestRevision(id: string, user: JwtPayload, dto: RepairRevisionDto) {
    const repair = await this.loadRepair(id);
    if (repair.workerId !== user.sub) {
      throw new ForbiddenException('Only the assigned worker can request a scope-change revision');
    }
    if (repair.status !== 'ACCEPTED') {
      throw new BadRequestException('REPAIR_INVALID_STATE: revisions require an accepted repair');
    }
    if (repair.revisions.some((r) => r.status === 'PENDING_APPROVAL')) {
      throw new BadRequestException('DUPLICATE_REVISION: a revision is already pending approval');
    }
    const revision = await this.prisma.repairRevision.create({
      data: {
        repairId: id,
        proposedAmount: dto.amount,
        reason: dto.reason,
        status: 'PENDING_APPROVAL',
        requestedBy: user.sub,
      },
    });
    this.eventBus.emit('repair.revisionRequested', {
      repairId: id,
      jobId: repair.jobId,
      proposedAmount: dto.amount,
      reason: dto.reason,
    });
    this.realtime.emitToRoom(userRoom(repair.job.customerId), JOB_EVENTS.jobOffer, {
      jobId: repair.jobId,
      repairId: id,
      type: 'revision:requested',
      proposedAmount: dto.amount,
    });
    return revision;
  }

  async decideRevision(
    id: string,
    revisionId: string,
    user: JwtPayload,
    action: 'approve' | 'reject',
  ) {
    const repair = await this.loadRepair(id);
    this.assertCustomerAccess(repair.job, user);
    if (user.role !== Role.CUSTOMER) {
      throw new ForbiddenException('Only the customer can decide a revision');
    }
    const revision = await this.prisma.repairRevision.findFirst({
      where: { id: revisionId, repairId: id },
    });
    if (!revision) {
      throw new NotFoundException('Revision not found');
    }
    if (revision.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('REVISION_ALREADY_DECIDED');
    }

    const decided = await this.prisma.$transaction(async (tx) => {
      const rv = await tx.repairRevision.update({
        where: { id: revisionId },
        data: {
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          decidedAt: new Date(),
        },
      });
      if (action === 'approve') {
        await tx.repair.update({
          where: { id },
          data: {
            amount: revision.proposedAmount,
            lockedAmount: revision.proposedAmount,
            lockedAt: new Date(),
          },
        });
        this.eventBus.emit('repair.approved', {
          repairId: id,
          jobId: repair.jobId,
          lockedAmount: Number(revision.proposedAmount),
        });
      }
      return rv;
    });
    return decided;
  }
}
