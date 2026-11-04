import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  VerificationDocument,
  VerificationDocumentType,
  WorkerVerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MapboxService } from './mapbox.service';
import {
  expandSkillNames,
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
      if (area.label && this.prisma.area?.findFirst) {
        const areaRec = await this.prisma.area.findFirst({
          where: { name: { equals: area.label.trim(), mode: 'insensitive' } },
          include: { city: true },
        });
        if (areaRec && (!areaRec.isActive || (areaRec.city && !areaRec.city.isActive))) {
          throw new BadRequestException(
            `AREA_INACTIVE: "${area.label}" is currently inactive and cannot be selected as a service area.`,
          );
        }
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
    }
    // Location update skipped — ServiceArea.table has no `location` column and PostGIS is not configured.
    // This prevents 500 errors during job creation and other operations.

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
    if (dto.isAvailable) {
      const wallet = await this.prisma.workerWallet.findUnique({ where: { userId } });
      const balance = Number(wallet?.balance ?? 0);
      if (balance < 0) {
        throw new BadRequestException(
          `Your wallet balance is Rs. ${balance}. Please top up your wallet to go online.`,
        );
      }
    }
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
    const searchNames = expandSkillNames(profile?.skills);
    const skillCategories = profile?.skills?.length
      ? await this.prisma.serviceCategory.findMany({
          where: {
            OR: [
              { id: { in: profile.skills } },
              { name: { in: searchNames } },
            ],
            isActive: true,
          },
          select: { id: true, name: true, nameUrdu: true },
        })
      : [];

    const completion = getWorkerProfileCompletion(
      this.toCompletionInput(user, profile, documents, serviceAreas.length),
    );

    const [completedJobs, ratingAgg] = await Promise.all([
      this.prisma.serviceRequest.count({
        where: { selectedWorkerId: userId, status: 'COMPLETED' },
      }),
      this.prisma.review.aggregate({
        where: { revieweeId: userId, isVisible: true },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const avgRating = ratingAgg._avg.rating !== null ? Number(ratingAgg._avg.rating.toFixed(1)) : 0;

    return {
      id: user.id,
      completedJobs,
      rating: avgRating,
      reviewsCount: ratingAgg._count.rating ?? 0,
      user: {
        id: user.id,
        phone: user.phone,
        email: (user as any).email ?? null,
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
            completedJobs,
            rating: avgRating,
            reviewsCount: ratingAgg._count.rating ?? 0,
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
    let profile = await this.prisma.workerProfile.findUnique({
      where: { userId: workerId },
      include: { user: { select: { id: true, name: true, avatarUrl: true, phone: true } } },
    });
    let user = profile?.user;
    if (!profile) {
      user = await this.prisma.user.findUnique({
        where: { id: workerId },
        select: { id: true, name: true, avatarUrl: true, phone: true },
      });
      if (!user) {
        throw new NotFoundException('Worker profile not found');
      }
    }

    // AUDIT-008: Respect worker privacy settings (profileVisible)
    let isProfileVisible = true;
    if (profile?.adminNote) {
      try {
        const parsed = JSON.parse(profile.adminNote);
        if (typeof parsed.profileVisible === 'boolean') {
          isProfileVisible = parsed.profileVisible;
        }
      } catch {}
    }
    if (!isProfileVisible) {
      throw new NotFoundException('Worker profile is not available');
    }
    const serviceAreas = await this.listServiceAreas(workerId);
    const skillsArray = profile?.skills || [];
    const searchNames = expandSkillNames(skillsArray);
    const skillCategories = skillsArray.length
      ? await this.prisma.serviceCategory.findMany({
          where: {
            OR: [
              { id: { in: skillsArray } },
              { name: { in: searchNames } },
            ],
            isActive: true,
          },
          select: { id: true, name: true, nameUrdu: true },
        })
      : [];
    const ratingAgg = await this.prisma.review.aggregate({
      where: { revieweeId: workerId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const [completedJobs, cancelledJobs] = await Promise.all([
      this.prisma.serviceRequest.count({
        where: { selectedWorkerId: workerId, status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] } },
      }),
      this.prisma.serviceRequest.count({
        where: { selectedWorkerId: workerId, status: 'CANCELLED' },
      }),
    ]);
    const totalFinished = completedJobs + cancelledJobs;
    const jobSuccessRate = totalFinished > 0 ? Math.round((completedJobs / totalFinished) * 100) : null;

    const workerOffers = await this.prisma.jobOffer.findMany({
      where: { workerId },
      select: { createdAt: true, job: { select: { createdAt: true } } },
      take: 20,
    });
    let avgResponseTime: string | null = null;
    if (workerOffers.length > 0) {
      const validDiffs = workerOffers
        .map((wo) => (new Date(wo.createdAt).getTime() - new Date(wo.job.createdAt).getTime()) / 60000)
        .filter((m) => m >= 0);
      if (validDiffs.length > 0) {
        const avgMins = Math.round(validDiffs.reduce((a, b) => a + b, 0) / validDiffs.length);
        if (avgMins < 1) avgResponseTime = '< 1m';
        else if (avgMins < 60) avgResponseTime = `${avgMins}m`;
        else if (avgMins < 1440) avgResponseTime = `${Math.floor(avgMins / 60)}h ${avgMins % 60}m`;
        else avgResponseTime = `${Math.floor(avgMins / 1440)}d`;
      }
    }

    const reviews = await this.prisma.review.findMany({
      where: { revieweeId: workerId, isVisible: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
        job: { select: { area: true, city: true } },
      },
    });

    const allRatings = await this.prisma.review.findMany({
      where: { revieweeId: workerId, isVisible: true },
      select: { rating: true },
    });
    const totalCount = allRatings.length;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allRatings) {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingCounts[r.rating as 1 | 2 | 3 | 4 | 5]++;
      }
    }
    const ratingBreakdown = {
      fiveStar: totalCount ? Math.round((ratingCounts[5] / totalCount) * 100) : 0,
      fourStar: totalCount ? Math.round((ratingCounts[4] / totalCount) * 100) : 0,
      threeStar: totalCount ? Math.round((ratingCounts[3] / totalCount) * 100) : 0,
      twoStar: totalCount ? Math.round((ratingCounts[2] / totalCount) * 100) : 0,
      oneStar: totalCount ? Math.round((ratingCounts[1] / totalCount) * 100) : 0,
    };

    const isApproved = profile?.verificationStatus === WorkerVerificationStatus.APPROVED;

    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: null, // AUDIT-008: Personal phone number omitted on public endpoint
      verified: isApproved,
      isCnicVerified: isApproved,
      isNadraCleared: isApproved,
      skills: skillCategories,
      skillNames: skillCategories.map((s) => s.name),
      experienceYears: profile?.experienceYears ?? 0,
      bio: profile?.bio ?? '',
      serviceAreas: serviceAreas.map((area) => ({
        label: area.label,
        address: area.address,
        latitude: area.latitude != null ? Math.round(Number(area.latitude) * 100) / 100 : 0, // AUDIT-008: Obfuscate exact GPS to ~1.1km sector centroid
        longitude: area.longitude != null ? Math.round(Number(area.longitude) * 100) / 100 : 0,
      })),
      primaryArea: serviceAreas[0]?.label || serviceAreas[0]?.address || '',
      rating: {
        average: ratingAgg._avg.rating !== null ? Number(ratingAgg._avg.rating.toFixed(1)) : 0,
        count: ratingAgg._count.rating ?? 0,
      },
      completedJobs,
      jobSuccessRate,
      responseTime: avgResponseTime,
      reviews: reviews.map((rev) => ({
        id: rev.id,
        customerName: rev.reviewer?.name || 'Customer',
        customerArea: rev.job?.area || rev.job?.city || '',
        rating: rev.rating,
        date: new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        comment: rev.comment || '',
        tags: (rev as any).tags || [],
      })),
      ratingBreakdown,
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
    const validSkills = new Set([
      'Electrician',
      'Plumber',
      'AC Technician',
      'Carpenter',
      'Painter',
      'Mechanic',
      'Solar Technician',
      'Mason',
      'Welder',
      'Appliance Repair',
      'Plumbing',
      'Electrical',
      'AC & Refrigeration',
      'Carpentry',
      'Painting',
      'Cleaning',
      'Masonry',
      'Pest Control',
      'General Handyman',
    ]);
    const categories = await this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    for (const cat of categories) {
      validSkills.add(cat.id);
      validSkills.add(cat.name);
    }
    const allValid = unique.every((s) => validSkills.has(s));
    if (!allValid) {
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
