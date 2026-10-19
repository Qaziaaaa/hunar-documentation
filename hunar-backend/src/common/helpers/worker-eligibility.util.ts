import { ForbiddenException } from '@nestjs/common';
import { WorkerVerificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getWorkerProfileCompletion } from './worker-profile.util';

// Eligibility gate for worker work actions (see also jobs.service).
// Only an approved + complete profile may send offers, take visits, etc.
// Rejected / Request-changes workers are blocked until fixed and re-submitted.
export async function assertWorkerEligible(
  prisma: PrismaService,
  userId: string,
  redis?: { get(key: string): Promise<string | null>; set(key: string, val: string, ttl?: number): Promise<any> } | null,
): Promise<void> {
  if (process.env.ALLOW_WORKER_JOB_TEST_MODE === 'true') {
    return;
  }

  const cacheKey = `perf:worker:eligible:${userId}`;
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached === '1') {
        return;
      }
    } catch {
      // Ignore cache failure, fall back to DB
    }
  }

  const [user, profile, serviceAreaCount, cnicDocuments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.workerProfile.findUnique({ where: { userId } }),
    prisma.serviceArea.count({ where: { userId } }),
    prisma.verificationDocument.findMany({
      where: { userId, type: { in: ['CNIC_FRONT', 'CNIC_BACK'] } },
      select: { type: true, url: true },
    }),
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

  if (redis) {
    try {
      await redis.set(cacheKey, '1', 600);
    } catch {
      // Ignore cache write error
    }
  }
}
