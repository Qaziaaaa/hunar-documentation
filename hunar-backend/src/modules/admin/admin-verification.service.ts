import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WorkerVerificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { AUDIT_ACTIONS, AuditService } from './audit.service';
import { RevokeVerificationDto, VerificationDecisionDto } from './admin-verification.validation';

interface VerificationOutcome {
  verificationStatus: WorkerVerificationStatus;
  rejectionReason: string | null;
  adminNote: string | null;
  verifiedAt: Date | null;
  isVerified: boolean;
}

type PendingProfile = Prisma.WorkerProfileGetPayload<{
  include: { user: { select: { id: true; name: true; phone: true; avatarUrl: true } } };
}>;

const PROFILE_WITH_USER = {
  user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
} satisfies Prisma.WorkerProfileInclude;

@Injectable()
export class AdminVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly audit: AuditService,
  ) {}

  // Admin review queue — every worker submission awaiting a human decision.
  async listPending() {
    const profiles = await this.prisma.workerProfile.findMany({
      where: { verificationStatus: WorkerVerificationStatus.PENDING },
      include: PROFILE_WITH_USER,
      orderBy: { submittedAt: 'asc' },
    });
    return this.buildViews(profiles);
  }

  // Full submission detail for a single worker (documents, skills, experience, service areas).
  async getDetail(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: PROFILE_WITH_USER,
    });
    if (!profile) {
      throw new NotFoundException('Worker verification not found');
    }
    const [view] = await this.buildViews([profile]);
    return view;
  }

  // Human admin decision (Admin flow §6.2). Never automatic.
  async decide(userId: string, dto: VerificationDecisionDto, actor?: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Worker profile not found');
    }

    switch (dto.decision) {
      case WorkerVerificationStatus.APPROVED:
        return this.applyDecision(
          userId,
          {
            verificationStatus: WorkerVerificationStatus.APPROVED,
            rejectionReason: null,
            adminNote: null,
            verifiedAt: new Date(),
            isVerified: true,
          },
          AUDIT_ACTIONS.VERIFICATION_APPROVED,
          actor,
        );
      case WorkerVerificationStatus.REJECTED:
        if (!dto.reason) {
          throw new BadRequestException(
            'REJECTION_REASON_REQUIRED: a reason is required when rejecting a worker',
          );
        }
        return this.applyDecision(
          userId,
          {
            verificationStatus: WorkerVerificationStatus.REJECTED,
            rejectionReason: dto.reason,
            adminNote: null,
            verifiedAt: null,
            isVerified: false,
          },
          AUDIT_ACTIONS.VERIFICATION_REJECTED,
          actor,
          dto.reason,
        );
      case WorkerVerificationStatus.REQUEST_CHANGES:
        if (!dto.adminNote) {
          throw new BadRequestException(
            'ADMIN_NOTE_REQUIRED: an admin note is required when requesting changes',
          );
        }
        return this.applyDecision(
          userId,
          {
            verificationStatus: WorkerVerificationStatus.REQUEST_CHANGES,
            rejectionReason: null,
            adminNote: dto.adminNote,
            verifiedAt: null,
            isVerified: false,
          },
          AUDIT_ACTIONS.VERIFICATION_CHANGES_REQUESTED,
          actor,
          dto.adminNote,
        );
      default:
        throw new BadRequestException('INVALID_DECISION');
    }
  }

  // Revoke an already-approved verification (Admin flow §M2). Requires a reason.
  async revoke(userId: string, dto: RevokeVerificationDto, actor?: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Worker profile not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.workerProfile.update({
        where: { userId },
        data: {
          verificationStatus: WorkerVerificationStatus.REVOKED,
          rejectionReason: dto.reason,
          adminNote: null,
          verifiedAt: null,
        },
      });
      await tx.user.update({ where: { id: userId }, data: { isVerified: false } });

      if (actor) {
        await this.audit.record(
          {
            actorId: actor.sub,
            actorRole: actor.role,
            action: AUDIT_ACTIONS.VERIFICATION_REVOKED,
            targetType: 'WORKER',
            targetId: userId,
            reason: dto.reason,
            metadata: { verificationStatus: WorkerVerificationStatus.REVOKED },
          },
          tx,
        );
      }

      return {
        userId,
        verificationStatus: updated.verificationStatus,
        rejectionReason: updated.rejectionReason,
        adminNote: updated.adminNote,
        verifiedAt: updated.verifiedAt,
      };
    });

    this.eventBus.emit('worker.verification.decided', {
      userId,
      verificationStatus: result.verificationStatus,
      rejectionReason: result.rejectionReason,
      adminNote: result.adminNote,
    });

    return result;
  }

  private async applyDecision(
    userId: string,
    decision: VerificationOutcome,
    action: string,
    actor?: JwtPayload,
    reason?: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.workerProfile.update({
        where: { userId },
        data: {
          verificationStatus: decision.verificationStatus,
          rejectionReason: decision.rejectionReason,
          adminNote: decision.adminNote,
          verifiedAt: decision.verifiedAt,
        },
      });
      await tx.user.update({ where: { id: userId }, data: { isVerified: decision.isVerified } });

      if (actor) {
        await this.audit.record(
          {
            actorId: actor.sub,
            actorRole: actor.role,
            action: action as (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS],
            targetType: 'WORKER',
            targetId: userId,
            reason: reason ?? null,
            metadata: { verificationStatus: decision.verificationStatus },
          },
          tx,
        );
      }

      return {
        userId,
        verificationStatus: profile.verificationStatus,
        rejectionReason: profile.rejectionReason,
        adminNote: profile.adminNote,
        verifiedAt: profile.verifiedAt,
      };
    });

    // Notify the worker of the verification outcome (Task 6).
    this.eventBus.emit('worker.verification.decided', {
      userId,
      verificationStatus: result.verificationStatus,
      rejectionReason: result.rejectionReason,
      adminNote: result.adminNote,
    });

    return result;
  }

  // Shared presentation for queue + detail so both endpoints stay in sync.
  private async buildViews(profiles: PendingProfile[]) {
    if (profiles.length === 0) {
      return [];
    }

    const userIds = profiles.map((p) => p.userId);
    const skillIds = [...new Set(profiles.flatMap((p) => p.skills))];
    const [categories, serviceAreas, documents] = await Promise.all([
      this.prisma.serviceCategory.findMany({
        where: { id: { in: skillIds } },
        select: { id: true, name: true, nameUrdu: true },
      }),
      this.prisma.serviceArea.findMany({
        where: { userId: { in: userIds } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.verificationDocument.findMany({
        where: { userId: { in: userIds } },
        orderBy: { uploadedAt: 'asc' },
      }),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    return profiles.map((profile) => ({
      userId: profile.userId,
      name: profile.user.name,
      phone: profile.user.phone,
      avatarUrl: profile.user.avatarUrl,
      verificationStatus: profile.verificationStatus,
      rejectionReason: profile.rejectionReason,
      adminNote: profile.adminNote,
      submittedAt: profile.submittedAt,
      verifiedAt: profile.verifiedAt,
      skills: profile.skills
        .map((id) => categoryMap.get(id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
      experienceYears: profile.experienceYears,
      bio: profile.bio,
      serviceAreas: serviceAreas
        .filter((a) => a.userId === profile.userId)
        .map((a) => ({
          label: a.label,
          address: a.address,
          latitude: a.latitude,
          longitude: a.longitude,
        })),
      documents: documents
        .filter((d) => d.userId === profile.userId)
        .map((d) => ({
          type: d.type,
          url: d.url,
          fileName: d.fileName,
          mimeType: d.mimeType,
          uploadedAt: d.uploadedAt,
        })),
    }));
  }
}
