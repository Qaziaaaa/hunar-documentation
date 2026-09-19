import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkerVerificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { VerificationDecisionDto } from './admin-verification.validation';

interface VerificationOutcome {
  verificationStatus: WorkerVerificationStatus;
  rejectionReason: string | null;
  adminNote: string | null;
  verifiedAt: Date | null;
  isVerified: boolean;
}

@Injectable()
export class AdminVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  // Admin review queue — every worker submission awaiting a human decision.
  async listPending() {
    const profiles = await this.prisma.workerProfile.findMany({
      where: { verificationStatus: WorkerVerificationStatus.PENDING },
      include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } },
      orderBy: { submittedAt: 'asc' },
    });
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
      submittedAt: profile.submittedAt,
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

  // Human admin decision (Admin flow §6.2). Never automatic.
  async decide(userId: string, dto: VerificationDecisionDto) {
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
        return this.applyDecision(userId, {
          verificationStatus: WorkerVerificationStatus.APPROVED,
          rejectionReason: null,
          adminNote: null,
          verifiedAt: new Date(),
          isVerified: true,
        });
      case WorkerVerificationStatus.REJECTED:
        if (!dto.reason) {
          throw new BadRequestException(
            'REJECTION_REASON_REQUIRED: a reason is required when rejecting a worker',
          );
        }
        return this.applyDecision(userId, {
          verificationStatus: WorkerVerificationStatus.REJECTED,
          rejectionReason: dto.reason,
          adminNote: null,
          verifiedAt: null,
          isVerified: false,
        });
      case WorkerVerificationStatus.REQUEST_CHANGES:
        if (!dto.adminNote) {
          throw new BadRequestException(
            'ADMIN_NOTE_REQUIRED: an admin note is required when requesting changes',
          );
        }
        return this.applyDecision(userId, {
          verificationStatus: WorkerVerificationStatus.REQUEST_CHANGES,
          rejectionReason: null,
          adminNote: dto.adminNote,
          verifiedAt: null,
          isVerified: false,
        });
      default:
        throw new BadRequestException('INVALID_DECISION');
    }
  }

  private async applyDecision(userId: string, decision: VerificationOutcome) {
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
}
