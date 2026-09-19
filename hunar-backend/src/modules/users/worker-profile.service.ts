import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  VerificationDocument,
  VerificationDocumentType,
  WorkerVerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MapboxService } from './mapbox.service';
import {
  getWorkerProfileCompletion,
  WORKER_PROFILE_TOTAL_STEPS,
  WorkerProfileCompletionInput,
} from '../../common/helpers/worker-profile.util';
import {
  UpdateAvailabilityDto,
  UpdateDocumentsDto,
  UpdateServiceAreasDto,
  UpdateWorkerProfileDto,
} from './users.validation';

type DocumentType = 'CNIC_FRONT' | 'CNIC_BACK' | 'CERTIFICATE';

@Injectable()
export class WorkerProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapbox: MapboxService,
  ) {}

  // ----- Step 1 + 2 + 3: basic information, skills/categories, experience & bio -----

  async updateWorkerProfile(userId: string, dto: UpdateWorkerProfileDto) {
    await this.requireUser(userId);
    await this.assertValidSkills(dto.skills);

    await this.prisma.$transaction(async (tx) => {
      if (dto.name !== undefined || dto.avatarUrl !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
          },
        });
      }
      await tx.workerProfile.upsert({
        where: { userId },
        update: {
          ...(dto.skills !== undefined ? { skills: this.dedupe(dto.skills) } : {}),
          ...(dto.experienceYears !== undefined ? { experienceYears: dto.experienceYears } : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        },
        create: {
          userId,
          skills: this.dedupe(dto.skills ?? []),
          experienceYears: dto.experienceYears,
          bio: dto.bio,
        },
      });
    });

    return this.getWorkerOnboarding(userId);
  }

  // ----- Step 4: service areas (coordinates + address; Mapbox geocoding; PostGIS storage) -----

  async saveServiceAreas(userId: string, dto: UpdateServiceAreasDto) {
    await this.requireUser(userId);

    const resolved: Array<{ label: string; address: string; latitude: number; longitude: number }> =
      [];
    for (const area of dto.serviceAreas) {
      let { latitude, longitude } = area;
      if (latitude === undefined || longitude === undefined) {
        const geocoded = await this.mapbox.geocodeAddress(area.address);
        if (!geocoded) {
          throw new BadRequestException(
            `GEOCODE_NOT_FOUND: could not geocode the address "${area.address}"`,
          );
        }
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
      }
      resolved.push({
        label: area.label.trim(),
        address: area.address.trim(),
        latitude,
        longitude,
      });
    }

    await this.prisma.serviceArea.deleteMany({ where: { userId } });
    for (const area of resolved) {
      const created = await this.prisma.serviceArea.create({
        data: {
          userId,
          label: area.label,
          address: area.address,
          latitude: area.latitude,
          longitude: area.longitude,
        },
      });
      await this.prisma.$executeRaw`
        UPDATE "ServiceArea"
        SET location = ST_SetSRID(ST_MakePoint(${area.longitude}, ${area.latitude}), 4326)
        WHERE id = ${created.id}
      `;
    }

    return this.listServiceAreas(userId);
  }

  // ----- Step 5: verification documents (CNIC front/back required, certificate optional) -----

  // Editing verification documents invalidates a previous admin review (Admin flow §6.3):
  // an approved/rejected/profile-needing-changes profile returns to PENDING and the user is
  // un-verified until an admin reviews the updated evidence again.
  async saveDocuments(userId: string, dto: UpdateDocumentsDto) {
    await this.requireUser(userId);
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    await this.upsertDocument(userId, 'CNIC_FRONT', dto.cnicFront);
    await this.upsertDocument(userId, 'CNIC_BACK', dto.cnicBack);
    if (dto.certificate !== undefined) {
      await this.upsertDocument(userId, 'CERTIFICATE', dto.certificate);
    }
    if (profile && this.isReviewedStatus(profile.verificationStatus)) {
      await this.revertToPendingVerification(userId);
    }
    return this.listDocuments(userId);
  }

  // ----- Step 6: review & submit for admin verification -----

  async submitForVerification(userId: string) {
    const context = await this.loadCompletionContext(userId);
    const completion = getWorkerProfileCompletion(context.input);

    if (!completion.complete) {
      throw new BadRequestException(
        `PROFILE_INCOMPLETE: missing ${completion.missingSteps.join(', ')}`,
      );
    }
    const status = context.profile?.verificationStatus ?? WorkerVerificationStatus.NOT_SUBMITTED;
    if (status === WorkerVerificationStatus.APPROVED) {
      throw new BadRequestException('PROFILE_ALREADY_VERIFIED: profile is already approved');
    }
    if (status === WorkerVerificationStatus.PENDING) {
      throw new BadRequestException('PROFILE_ALREADY_SUBMITTED: profile is already pending review');
    }

    await this.ensureProfile(userId);
    const updated = await this.prisma.workerProfile.update({
      where: { userId },
      data: {
        verificationStatus: WorkerVerificationStatus.PENDING,
        submittedAt: new Date(),
        rejectionReason: null,
        adminNote: null,
      },
    });
    return this.mapVerification(updated);
  }

  async getVerification(userId: string) {
    const profile = await this.ensureProfile(userId);
    return this.mapVerification(profile);
  }

  // ----- Availability (worker dashboard toggle) -----

  async toggleAvailability(userId: string, dto: UpdateAvailabilityDto) {
    await this.requireUser(userId);
    const updated = await this.prisma.workerProfile.update({
      where: { userId },
      data: { isAvailable: dto.isAvailable },
    });
    return { isAvailable: updated.isAvailable };
  }

  // ----- Reading endpoints -----

  async getWorkerOnboarding(userId: string) {
    const user = await this.requireUser(userId);
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    const serviceAreas = await this.listServiceAreas(userId);
    const documents = await this.listDocuments(userId);
    const skillCategories = profile?.skills?.length
      ? await this.prisma.serviceCategory.findMany({
          where: { id: { in: profile.skills }, isActive: true },
          select: { id: true, name: true, nameUrdu: true },
        })
      : [];

    const completion = getWorkerProfileCompletion(
      this.toCompletionInput(user, profile, documents, serviceAreas.length),
    );

    return {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      workerProfile: profile
        ? {
            skills: profile.skills,
            skillCategories,
            experienceYears: profile.experienceYears,
            bio: profile.bio,
            isAvailable: profile.isAvailable,
            serviceRadiusKm: profile.serviceRadiusKm,
            verificationStatus: profile.verificationStatus,
            submittedAt: profile.submittedAt,
            verifiedAt: profile.verifiedAt,
            rejectionReason: profile.rejectionReason,
            adminNote: profile.adminNote,
          }
        : null,
      serviceAreas: serviceAreas.map((area) => ({
        id: area.id,
        label: area.label,
        address: area.address,
        latitude: area.latitude,
        longitude: area.longitude,
        createdAt: area.createdAt,
      })),
      documents: documents.map(this.mapDocument),
      progress: {
        totalSteps: WORKER_PROFILE_TOTAL_STEPS,
        completedSteps: WORKER_PROFILE_TOTAL_STEPS - completion.missingSteps.length,
        complete: completion.complete,
        missingSteps: completion.missingSteps,
      },
    };
  }

  async getPublicProfile(workerId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId: workerId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
    if (!profile) {
      throw new NotFoundException('Worker profile not found');
    }
    const serviceAreas = await this.listServiceAreas(workerId);
    const skillCategories = profile.skills.length
      ? await this.prisma.serviceCategory.findMany({
          where: { id: { in: profile.skills }, isActive: true },
          select: { id: true, name: true, nameUrdu: true },
        })
      : [];
    const ratingAgg = await this.prisma.review.aggregate({
      where: { revieweeId: workerId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const completedJobs = await this.prisma.serviceRequest.count({
      where: { selectedWorkerId: workerId, status: 'COMPLETED' },
    });

    return {
      id: profile.user.id,
      name: profile.user.name,
      avatarUrl: profile.user.avatarUrl,
      verified: profile.verificationStatus === WorkerVerificationStatus.APPROVED,
      skills: skillCategories,
      experienceYears: profile.experienceYears,
      bio: profile.bio,
      serviceAreas: serviceAreas.map((area) => ({
        label: area.label,
        address: area.address,
        latitude: area.latitude,
        longitude: area.longitude,
      })),
      rating: {
        average: ratingAgg._avg.rating,
        count: ratingAgg._count.rating,
      },
      completedJobs,
    };
  }

  // ----- Helpers -----

  private async requireUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async ensureProfile(userId: string) {
    return this.prisma.workerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  private async loadCompletionContext(userId: string) {
    const user = await this.requireUser(userId);
    const [profile, documents, serviceAreas] = await Promise.all([
      this.prisma.workerProfile.findUnique({ where: { userId } }),
      this.prisma.verificationDocument.findMany({ where: { userId } }),
      this.prisma.serviceArea.findMany({ where: { userId } }),
    ]);
    return {
      input: this.toCompletionInput(user, profile, documents, serviceAreas.length),
      profile,
    };
  }

  private isReviewedStatus(status: WorkerVerificationStatus): boolean {
    return (
      status === WorkerVerificationStatus.APPROVED ||
      status === WorkerVerificationStatus.REJECTED ||
      status === WorkerVerificationStatus.REQUEST_CHANGES
    );
  }

  // Invalidates a previous admin decision because the evidence under review has changed.
  private async revertToPendingVerification(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.workerProfile.update({
        where: { userId },
        data: {
          verificationStatus: WorkerVerificationStatus.PENDING,
          rejectionReason: null,
          adminNote: null,
          verifiedAt: null,
        },
      });
      await tx.user.update({ where: { id: userId }, data: { isVerified: false } });
    });
  }

  private async assertValidSkills(skills?: string[]) {
    if (!skills || skills.length === 0) {
      return;
    }
    const unique = this.dedupe(skills);
    const activeCount = await this.prisma.serviceCategory.count({
      where: { id: { in: unique }, isActive: true },
    });
    if (activeCount !== unique.length) {
      throw new BadRequestException(
        'SKILLS_INVALID: one or more selected skills are not valid or are disabled by admin',
      );
    }
  }

  private async upsertDocument(
    userId: string,
    type: DocumentType,
    doc: { url: string; fileName?: string; mimeType?: string },
  ) {
    return this.prisma.verificationDocument.upsert({
      where: { userId_type: { userId, type } },
      update: { url: doc.url, fileName: doc.fileName, mimeType: doc.mimeType },
      create: { userId, type, url: doc.url, fileName: doc.fileName, mimeType: doc.mimeType },
    });
  }

  private async listServiceAreas(userId: string) {
    const rows = await this.prisma.serviceArea.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((area) => ({
      id: area.id,
      label: area.label,
      address: area.address,
      latitude: area.latitude,
      longitude: area.longitude,
      createdAt: area.createdAt,
    }));
  }

  private async listDocuments(userId: string) {
    const rows = await this.prisma.verificationDocument.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'asc' },
    });
    return rows.map(this.mapDocument);
  }

  private mapDocument(doc: VerificationDocument) {
    return {
      type: doc.type,
      url: doc.url,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
    };
  }

  private toCompletionInput(
    user: { name: string | null; avatarUrl: string | null },
    profile: { skills: string[]; experienceYears: number | null; bio: string | null } | null,
    documents: Array<{ type: VerificationDocumentType; url: string }>,
    serviceAreaCount: number,
  ): WorkerProfileCompletionInput {
    const cnicFront = documents.find((d) => d.type === 'CNIC_FRONT');
    const cnicBack = documents.find((d) => d.type === 'CNIC_BACK');
    return {
      name: user.name,
      avatarUrl: user.avatarUrl,
      skills: profile?.skills ?? [],
      experienceYears: profile?.experienceYears ?? null,
      bio: profile?.bio ?? null,
      serviceAreaCount,
      cnicFrontUrl: cnicFront?.url ?? null,
      cnicBackUrl: cnicBack?.url ?? null,
    };
  }

  private mapVerification(profile: {
    verificationStatus: WorkerVerificationStatus;
    submittedAt: Date | null;
    verifiedAt: Date | null;
    rejectionReason: string | null;
    adminNote: string | null;
  }) {
    return {
      verificationStatus: profile.verificationStatus,
      submittedAt: profile.submittedAt,
      verifiedAt: profile.verifiedAt,
      rejectionReason: profile.rejectionReason,
      adminNote: profile.adminNote,
    };
  }

  private dedupe(values: string[]): string[] {
    return [...new Set(values.filter(Boolean))];
  }
}
