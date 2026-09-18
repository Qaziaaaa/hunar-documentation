import { ForbiddenException } from '@nestjs/common';
import { assertWorkerEligible } from './worker-eligibility.util';

function makeDb() {
  const db: any = {
    user: null,
    profile: null,
    cnic: [] as Array<{ type: string; url: string }>,
    areaCount: 0,
  };
  const prisma: any = {
    user: { findUnique: jest.fn(async () => db.user) },
    workerProfile: { findUnique: jest.fn(async () => db.profile) },
    serviceArea: { count: jest.fn(async () => db.areaCount) },
    verificationDocument: { findMany: jest.fn(async () => db.cnic) },
  };
  return { db, prisma };
}

function seedCompleteVerified(db: any, status = 'APPROVED') {
  db.user = { id: 'w1', name: 'Bilal', avatarUrl: 'a.jpg' };
  db.profile = {
    userId: 'w1',
    skills: ['cat-electric'],
    experienceYears: 3,
    bio: 'bio',
    verificationStatus: status,
  };
  db.cnic = [
    { type: 'CNIC_FRONT', url: 'f.jpg' },
    { type: 'CNIC_BACK', url: 'b.jpg' },
  ];
  db.areaCount = 1;
}

describe('assertWorkerEligible', () => {
  it('allows an approved worker with a complete profile to work', async () => {
    const { db, prisma } = makeDb();
    seedCompleteVerified(db);

    await expect(assertWorkerEligible(prisma, 'w1')).resolves.toBeUndefined();
  });

  it('blocks a worker with no profile', async () => {
    const { db, prisma } = makeDb();
    db.user = { id: 'w1', name: 'Bilal', avatarUrl: 'a.jpg' };

    await expect(assertWorkerEligible(prisma, 'w1')).rejects.toThrow(/WORKER_NOT_VERIFIED/);
  });

  it('blocks a worker who was REJECTED', async () => {
    const { db, prisma } = makeDb();
    seedCompleteVerified(db, 'REJECTED');

    await expect(assertWorkerEligible(prisma, 'w1')).rejects.toThrow(ForbiddenException);
    await expect(assertWorkerEligible(prisma, 'w1')).rejects.toThrow(/WORKER_NOT_VERIFIED/);
  });

  it('blocks a worker who was asked for changes (REQUEST_CHANGES)', async () => {
    const { db, prisma } = makeDb();
    seedCompleteVerified(db, 'REQUEST_CHANGES');

    await expect(assertWorkerEligible(prisma, 'w1')).rejects.toThrow(ForbiddenException);
  });

  it('blocks an approved worker with an incomplete profile', async () => {
    const { db, prisma } = makeDb();
    seedCompleteVerified(db);
    db.areaCount = 0;

    await expect(assertWorkerEligible(prisma, 'w1')).rejects.toThrow(ForbiddenException);
    await expect(assertWorkerEligible(prisma, 'w1')).rejects.toThrow(/WORKER_PROFILE_INCOMPLETE/);
  });
});
