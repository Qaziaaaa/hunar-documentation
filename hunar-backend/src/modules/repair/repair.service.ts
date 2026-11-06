import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobStatus, RepairStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { normalizePage, toPageResult } from '../../common/helpers/pagination.util';
import { JobsService } from '../jobs/jobs.service';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { RealtimeService } from '../realtime/realtime.service';
import { JOB_EVENTS, userRoom, jobRoom } from '../jobs/jobs.events';
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
    const repair = await this.prisma.repair.findFirst({
      where: { OR: [{ id }, { jobId: id }] },
      orderBy: { createdAt: 'desc' },
      include: {
        visit: true,
        job: {
          select: {
            id: true,
            customerId: true,
            title: true,
            address: true,
            status: true,
            lockedVisitCharge: true,
            suggestedVisitCharge: true,
          },
        },
        worker: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        revisions: true,
      },
    });
    if (!repair) {
      throw new NotFoundException('Repair not found');
    }
    return repair;
  }

  async createEstimate(visitId: string, user: JwtPayload, dto: RepairEstimateDto) {
    const visitInclude = {
      job: true,
      worker: { select: { id: true, name: true, phone: true, avatarUrl: true } },
      repairs: { orderBy: { createdAt: 'desc' as const }, take: 1 },
    };
    const visit = await this.prisma.visit.findFirst({
      where: {
        OR: [{ id: visitId }, { jobId: visitId }],
      },
      orderBy: { createdAt: 'desc' },
      include: visitInclude,
    });
    if (!visit) {
      throw new NotFoundException('Visit not found');
    }
    if (visit.workerId !== user.sub) {
      throw new ForbiddenException('Only the assigned worker can submit a repair estimate');
    }
    if (!visit.inspectionSubmittedAt) {
      throw new BadRequestException('Inspection must be submitted before a repair estimate');
    }
    const job = visit.job;
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (!['INSPECTION_DONE', 'REPAIR_NEGOTIATING', 'VISIT_COMPLETED', 'VISIT_IN_PROGRESS'].includes(job.status)) {
      throw new BadRequestException(
        'JOB_INVALID_STATE: estimate requires inspection to be complete',
      );
    }

    const worker = visit.worker;
    const existingRepair = visit.repairs?.[0];

    let repair;
    if (existingRepair) {
      repair = await this.prisma.repair.update({
        where: { id: existingRepair.id },
        data: {
          visitId: visit.id,
          description: dto.description,
          amount: dto.amount,
          itemsBreakdown: dto.itemsBreakdown ? (dto.itemsBreakdown as object) : undefined,
          status: 'PROPOSED',
          lockedAmount: null,
          lockedAt: null,
        },
      });
    } else {
      repair = await this.prisma.repair.create({
        data: {
          visitId: visit.id,
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
    }

    if (job.status !== 'REPAIR_NEGOTIATING') {
      await this.jobsService.transitionJobState(visit.jobId, 'REPAIR_NEGOTIATING');
    }

    const visitCharge = Number(job.lockedVisitCharge ?? job.suggestedVisitCharge ?? 0);
    const repairAmount = Number(dto.amount);
    const quotePayload = {
      repairId: repair.id,
      jobId: visit.jobId,
      visitId: visit.id,
      workerId: user.sub,
      workerName: worker?.name || 'Technician',
      workerPhone: worker?.phone,
      workerAvatar: worker?.avatarUrl,
      jobTitle: job.title,
      jobAddress: job.address,
      description: dto.description,
      amount: repairAmount,
      visitCharge,
      totalAmount: visitCharge + repairAmount,
      itemsBreakdown: dto.itemsBreakdown,
      status: 'PROPOSED',
      createdAt: repair.createdAt,
    };

    this.eventBus.emit('repair.proposed', {
      repairId: repair.id,
      jobId: visit.jobId,
      amount: dto.amount,
    });
    this.realtime.emitToRoom(userRoom(job.customerId), 'repair:proposed', quotePayload);
    this.realtime.emitToRoom(userRoom(job.customerId), 'repair.proposed', quotePayload);
    this.realtime.emitToRoom(userRoom(job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId: visit.jobId,
      oldStatus: 'INSPECTION_DONE',
      newStatus: 'REPAIR_NEGOTIATING',
      repairQuote: quotePayload,
    });
    this.realtime.emitToRoom(userRoom(visit.workerId), 'repair:proposed', quotePayload);
    this.realtime.emitToRoom(userRoom(visit.workerId), 'repair.proposed', quotePayload);
    this.realtime.emitToRoom(userRoom(visit.workerId), JOB_EVENTS.jobStatusChanged, {
      jobId: visit.jobId,
      oldStatus: 'INSPECTION_DONE',
      newStatus: 'REPAIR_NEGOTIATING',
      repairQuote: quotePayload,
    });
    this.realtime.emitToRoom(jobRoom(visit.jobId), 'repair:proposed', quotePayload);
    this.realtime.emitToRoom(jobRoom(visit.jobId), 'repair.proposed', quotePayload);
    this.realtime.emitToRoom(jobRoom(visit.jobId), JOB_EVENTS.jobStatusChanged, {
      jobId: visit.jobId,
      oldStatus: 'INSPECTION_DONE',
      newStatus: 'REPAIR_NEGOTIATING',
      repairQuote: quotePayload,
    });
    return repair;
  }

  async getMyRepairs(user: JwtPayload, query: RepairQueryDto) {
    // B5: frontend requests ?limit=100; default maxLimit=50 clipped the page.
    const { page, limit, skip } = normalizePage(query, 100);
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
    const visitCharge = Number(
      repair.job.lockedVisitCharge ?? repair.job.suggestedVisitCharge ?? 0,
    );
    const isApproved = repair.status === 'ACCEPTED';
    const payableRepairAmount = isApproved ? Number(repair.lockedAmount ?? repair.amount ?? 0) : 0;
    const totalAmount = visitCharge + payableRepairAmount;

    return {
      ...repair,
      amount: Number(repair.amount),
      lockedAmount: repair.lockedAmount ? Number(repair.lockedAmount) : null,
      visitCharge,
      payableRepairAmount,
      totalAmount,
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
    const counterPayload = {
      repairId: id,
      jobId: repair.jobId,
      by,
      amount: dto.amount,
      note: dto.note,
      round: nextRound,
    };
    this.realtime.emitToRoom(userRoom(repair.job.customerId), 'repair:countered', counterPayload);
    this.realtime.emitToRoom(userRoom(repair.workerId), 'repair:countered', counterPayload);
    this.realtime.emitToRoom(userRoom(repair.job.customerId), 'repair:updated', { repairId: id, jobId: repair.jobId });
    this.realtime.emitToRoom(userRoom(repair.workerId), 'repair:updated', { repairId: id, jobId: repair.jobId });
    return updated;
  }

  async getPendingRepairForCustomer(user: JwtPayload) {
    const repair = await this.prisma.repair.findFirst({
      where: {
        job: { customerId: user.sub },
        status: { in: ['PROPOSED', 'COUNTERED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        visit: true,
        job: {
          select: {
            id: true,
            title: true,
            address: true,
            status: true,
            lockedVisitCharge: true,
            suggestedVisitCharge: true,
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!repair) {
      return null;
    }

    const visitCharge = Number(
      repair.job.lockedVisitCharge ?? repair.job.suggestedVisitCharge ?? 0,
    );
    const repairAmount = Number(repair.amount);

    return {
      repairId: repair.id,
      jobId: repair.jobId,
      visitId: repair.visitId,
      workerId: repair.workerId,
      workerName: repair.worker?.name || 'Technician',
      workerPhone: repair.worker?.phone,
      workerAvatar: repair.worker?.avatarUrl,
      jobTitle: repair.job.title,
      jobAddress: repair.job.address,
      description: repair.description,
      amount: repairAmount,
      visitCharge,
      totalAmount: visitCharge + repairAmount,
      itemsBreakdown: repair.itemsBreakdown,
      status: repair.status,
      createdAt: repair.createdAt,
    };
  }

  async acceptRepair(id: string, user: JwtPayload, dto: RepairAcceptDto) {
    const repair = await this.loadRepair(id);
    if (user.role !== Role.CUSTOMER && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only the customer can approve a repair quote');
    }
    this.assertCustomerAccess(repair.job, user);
    if (!['PROPOSED', 'COUNTERED'].includes(repair.status)) {
      throw new BadRequestException('REPAIR_INVALID_STATE: repair is not in a pending state');
    }
    if (repair.revisions.some((r) => r.status === 'PENDING_APPROVAL')) {
      throw new BadRequestException('A scope-change revision is pending approval');
    }
    const lockedAmount = dto?.amount != null ? dto.amount : Number(repair.amount);
    if (dto?.amount != null && lockedAmount !== Number(repair.amount)) {
      throw new BadRequestException(
        'REPAIR_PRICE_MISMATCH: approved amount must match the quoted amount',
      );
    }

    const [updated] = await Promise.all([
      this.prisma.repair.update({
        where: { id: repair.id },
        data: { status: 'ACCEPTED', lockedAmount, lockedAt: new Date() },
      }),
      this.prisma.serviceRequest.update({
        where: { id: repair.jobId },
        data: { status: 'REPAIR_APPROVED' },
      }),
    ]);

    const visitCharge = Number(
      repair.job.lockedVisitCharge ?? repair.job.suggestedVisitCharge ?? 0,
    );
    const approvedPayload = {
      repairId: repair.id,
      jobId: repair.jobId,
      workerId: repair.workerId,
      customerId: user.sub,
      status: 'ACCEPTED',
      lockedAmount,
      totalAmount: visitCharge + lockedAmount,
    };

    this.eventBus.emit('repair.approved', {
      repairId: repair.id,
      jobId: repair.jobId,
      lockedAmount,
    });
    this.realtime.emitToRoom(userRoom(repair.workerId), 'repair:approved', approvedPayload);
    this.realtime.emitToRoom(userRoom(repair.workerId), 'repair.approved', approvedPayload);
    this.realtime.emitToRoom(userRoom(repair.workerId), JOB_EVENTS.jobStatusChanged, {
      jobId: repair.jobId,
      oldStatus: 'REPAIR_NEGOTIATING',
      newStatus: 'REPAIR_APPROVED',
      repair: approvedPayload,
    });
    this.realtime.emitToRoom(userRoom(repair.job.customerId), 'repair:approved', approvedPayload);
    this.realtime.emitToRoom(userRoom(repair.job.customerId), 'repair.approved', approvedPayload);
    return updated;
  }

  async rejectRepair(id: string, user: JwtPayload) {
    const repair = await this.loadRepair(id);
    this.assertCustomerAccess(repair.job, user);
    if (user.role !== Role.CUSTOMER) {
      throw new ForbiddenException('Only the customer can reject a repair quote');
    }
    if (!['PROPOSED', 'COUNTERED'].includes(repair.status)) {
      throw new BadRequestException('REPAIR_INVALID_STATE: repair is not in a pending state');
    }
    const [updated] = await Promise.all([
      this.prisma.repair.update({
        where: { id: repair.id },
        data: { status: 'REJECTED' },
      }),
      this.prisma.serviceRequest.update({
        where: { id: repair.jobId },
        data: { status: JobStatus.REPAIR_DECLINED },
      }),
    ]);

    const visitCharge = Number(
      repair.job.lockedVisitCharge ?? repair.job.suggestedVisitCharge ?? 0,
    );
    const rejectedPayload = {
      repairId: repair.id,
      jobId: repair.jobId,
      workerId: repair.workerId,
      customerId: user.sub,
      status: 'REJECTED',
      repairCharge: 0,
      payableAmount: visitCharge,
    };

    this.eventBus.emit('job.statusChanged', {
      jobId: repair.jobId,
      oldStatus: repair.job.status,
      newStatus: JobStatus.REPAIR_DECLINED,
    });
    this.eventBus.emit('repair.rejected', { repairId: repair.id, jobId: repair.jobId });
    this.realtime.emitToRoom(userRoom(repair.workerId), 'repair:rejected', rejectedPayload);
    this.realtime.emitToRoom(userRoom(repair.workerId), 'repair.rejected', rejectedPayload);
    this.realtime.emitToRoom(userRoom(repair.workerId), JOB_EVENTS.jobStatusChanged, {
      jobId: repair.jobId,
      oldStatus: repair.job.status,
      newStatus: JobStatus.REPAIR_DECLINED,
      repair: rejectedPayload,
    });
    this.realtime.emitToRoom(userRoom(repair.job.customerId), 'repair:rejected', rejectedPayload);
    this.realtime.emitToRoom(userRoom(repair.job.customerId), 'repair.rejected', rejectedPayload);
    this.realtime.emitToRoom(userRoom(repair.job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId: repair.jobId,
      oldStatus: repair.job.status,
      newStatus: JobStatus.REPAIR_DECLINED,
      repair: rejectedPayload,
    });
    return updated;
  }

  async rejectRepairForJob(jobId: string, user: JwtPayload) {
    const repair = await this.prisma.repair.findFirst({
      where: { jobId, status: { in: ['PROPOSED', 'COUNTERED'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (!repair) {
      throw new NotFoundException('Repair not found: no pending estimate for this job');
    }
    return this.rejectRepair(repair.id, user);
  }

  /**
   * Task 23 — approve the repair estimate from the job-level contract
   * (`PUT /jobs/[id]/repair/approve`). Resolves the latest negotiable repair
   * for the job and delegates to acceptRepair (price locking + state transition).
   */
  async approveRepairForJob(jobId: string, user: JwtPayload, dto: RepairAcceptDto) {
    const repair = await this.prisma.repair.findFirst({
      where: { jobId, status: { in: ['PROPOSED', 'COUNTERED'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (!repair) {
      throw new NotFoundException('Repair not found: no pending estimate for this job');
    }
    return this.acceptRepair(repair.id, user, dto);
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
    if (repair.status !== 'ACCEPTED') {
      throw new BadRequestException(
        'REPAIR_INVALID_STATE: repair must be approved before completing',
      );
    }
    if (repair.revisions.some((r) => r.status === 'PENDING_APPROVAL')) {
      throw new BadRequestException('A scope-change revision is still pending approval');
    }

    const startedAt = repair.startedAt ?? new Date();

    // The wallet module owns the commission lifecycle: it was HELD when the worker
    // arrived (Task 7), so repair completion only finishes the job. No duplicate
    // Commission row is created here (Commission.jobId is unique).
    const updated = await this.prisma.$transaction(async (tx) => {
      const r = await tx.repair.update({
        where: { id: repair.id },
        data: {
          startedAt,
          completedAt: new Date(),
        },
      });
      await tx.serviceRequest.update({
        where: { id: repair.jobId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      return r;
    });
    this.eventBus.emit('repair.completed', { repairId: id, jobId: repair.jobId });
    this.eventBus.emit('job.statusChanged', {
      jobId: repair.jobId,
      oldStatus: 'IN_PROGRESS',
      newStatus: 'COMPLETED',
    });
    this.realtime.emitToRoom(userRoom(repair.job.customerId), JOB_EVENTS.jobStatusChanged, {
      jobId: repair.jobId,
      oldStatus: 'IN_PROGRESS',
      newStatus: 'COMPLETED',
    });
    this.realtime.emitToRoom(userRoom(repair.workerId), JOB_EVENTS.jobStatusChanged, {
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
