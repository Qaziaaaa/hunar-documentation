import { ForbiddenException } from '@nestjs/common';
import { WorkerVerificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getWorkerProfileCompletion } from './worker-profile.util';

// Eligibility gate for worker work actions (see also jobs.service).
// Only an approved + complete profile may send offers, take visits, etc.
// Rejected / Request-changes workers are blocked until fixed and re-submitted.
export async function assertWorkerEligible(prisma: PrismaService, userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const [profile, serviceAreaCount, cnicDocuments] = await Promise.all([
    user ? prisma.workerProfile.findUnique({ where: { userId } }) : Promise.resolve(null),
    user ? prisma.serviceArea.count({ where: { userId } }) : Promise.resolve(0),
    user
      ? prisma.verificationDocument.findMany({
          where: { userId, type: { in: ['CNIC_FRONT', 'CNIC_BACK'] } },
          select: { type: true, url: true },
        })
      : Promise.resolve([]),
  ]);
  if (!user || !profile || profile.verificationStatus !== WorkerVerificationStatus.APPROVED) {
    throw new ForbiddenException(
      'WORKER_NOT_VERIFIED: verify your profile before you can start working',
    );
  }
  const cnicFront = cnicDocuments.find((d) => d.type === 'CNIC_FRONT');
  const cnicBack = cnicDocuments.find((d) => d.type === 'CNIC_BACK');
  const completion = getWorkerProfileCompletion({
    name: user.name,
    avatarUrl: user.avatarUrl,
    skills: profile.skills,
    experienceYears: profile.experienceYears,
    bio: profile.bio,
    serviceAreaCount,
    cnicFrontUrl: cnicFront?.url ?? null,
    cnicBackUrl: cnicBack?.url ?? null,
  });
  if (!completion.complete) {
    throw new ForbiddenException(
      `WORKER_PROFILE_INCOMPLETE: complete your profile (missing ${completion.missingSteps.join(
        ', ',
      )}) before you can start working`,
    );
  }
}
