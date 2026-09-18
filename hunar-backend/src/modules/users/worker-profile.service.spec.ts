import { BadRequestException } from '@nestjs/common';
import { WorkerProfileService } from './worker-profile.service';
import { MapboxService } from './mapbox.service';
import {
  getWorkerProfileCompletion,
  WORKER_PROFILE_STEPS,
} from '../../common/helpers/worker-profile.util';

class Db {
  users = new Map<string, any>();
  workerProfiles = new Map<string, any>();
  serviceCategories = new Map<string, any>();
  serviceAreas = new Map<string, any>();
  verificationDocuments = new Map<string, any>();
  reviews: any[] = [];
  serviceRequests: any[] = [];
  rawCalls: string[] = [];

  constructor() {
    ['cat-electric', 'cat-plumber', 'cat-disabled'].forEach((id, i) => {
      this.serviceCategories.set(id, {
        id,
        name: i === 0 ? 'Electrical' : i === 1 ? 'Plumbing' : 'Disabled',
        nameUrdu: null,
        isActive: id !== 'cat-disabled',
      });
    });
  }
}

function makeDb(): any {
  const db = new Db();
  const fake = {
    db,

    user: {
      async findUnique({ where }: { where: { id: string } }) {
        return db.users.get(where.id) ?? null;
      },
      async update({ where, data }: { where: { id: string }; data: any }) {
        const user = { ...db.users.get(where.id), ...data };
        db.users.set(where.id, user);
        return user;
      },
    },

    workerProfile: {
      async findUnique({ where, include }: { where: { userId: string }; include?: any }) {
        const row = db.workerProfiles.get(where.userId) ?? null;
        if (!row) {
          return null;
        }
        if (include?.user?.select) {
          const u = db.users.get(where.userId);
          return u ? { ...row, user: { id: u.id, name: u.name, avatarUrl: u.avatarUrl } } : row;
        }
        return row;
      },
      async upsert({
        where,
        update,
        create,
      }: {
        where: { userId: string };
        update: any;
        create: any;
      }) {
        const existing = db.workerProfiles.get(where.userId);
        if (existing) {
          const merged = { ...existing, ...update };
          db.workerProfiles.set(where.userId, merged);
          return merged;
        }
        const created = {
          userId: create.userId,
          skills: [],
          experienceYears: null,
          bio: null,
          isAvailable: false,
          serviceRadiusKm: 10,
          verificationStatus: 'NOT_SUBMITTED',
          rejectionReason: null,
          adminNote: null,
          submittedAt: null,
          verifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...create,
        };
        db.workerProfiles.set(where.userId, created);
        return created;
      },
      async update({ where, data }: { where: { userId: string }; data: any }) {
        const merged = { ...db.workerProfiles.get(where.userId), ...data };
        db.workerProfiles.set(where.userId, merged);
        return merged;
      },
    },

    serviceCategory: {
      async findMany({ where, select }: any) {
        let rows = Array.from(db.serviceCategories.values());
        if (where?.id?.in) {
          rows = rows.filter((c) => where.id.in.includes(c.id));
        }
        if (where?.isActive !== undefined) {
          rows = rows.filter((c) => c.isActive === where.isActive);
        }
        return rows.map((c) => {
          const out: any = {};
          if (select?.id) out.id = c.id;
          if (select?.name) out.name = c.name;
          if (select?.nameUrdu) out.nameUrdu = c.nameUrdu;
          return out;
        });
      },
      async count({ where }: any) {
        let rows = Array.from(db.serviceCategories.values());
        if (where?.id?.in) {
          rows = rows.filter((c) => where.id.in.includes(c.id));
        }
        if (where?.isActive !== undefined) {
          rows = rows.filter((c) => c.isActive === where.isActive);
        }
        return rows.length;
      },
    },

    serviceArea: {
      async findMany({ where, orderBy }: any) {
        let rows = Array.from(db.serviceAreas.values()).filter((a) => a.userId === where?.userId);
        if (orderBy?.createdAt === 'asc') {
          rows = rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        return rows;
      },
      async create({ data }: any) {
        const area = {
          id: `area-${db.serviceAreas.size + 1}`,
          ...data,
          createdAt: new Date(),
        };
        db.serviceAreas.set(area.id, area);
        return area;
      },
      async deleteMany({ where }: any) {
        let deleted = 0;
        for (const [id, area] of Array.from(db.serviceAreas.entries())) {
          if (area.userId === where?.userId) {
            db.serviceAreas.delete(id);
            deleted += 1;
          }
        }
        return { count: deleted };
      },
    },

    verificationDocument: {
      async findMany({ where, _orderBy }: any) {
        let rows = Array.from(db.verificationDocuments.values()).filter(
          (d) => d.userId === where?.userId,
        );
        if (where?.type?.in) {
          rows = rows.filter((d) => where.type.in.includes(d.type));
        }
        return rows;
      },
      async upsert({ where, update, create }: any) {
        const existing = Array.from(db.verificationDocuments.values()).find(
          (d) => d.userId === where.userId_type.userId && d.type === where.userId_type.type,
        );
        if (existing) {
          const merged = { ...existing, ...update };
          db.verificationDocuments.delete(existing.id);
          db.verificationDocuments.set(existing.id, merged);
          return merged;
        }
        const doc = {
          id: `doc-${db.verificationDocuments.size + 1}`,
          uploadedAt: new Date(),
          ...create,
        };
        db.verificationDocuments.set(doc.id, doc);
        return doc;
      },
    },

    review: {
      async aggregate({ where, _avg, _count }: any) {
        let rows = db.reviews.filter((r) => r.revieweeId === where?.revieweeId);
        if (where?.isVisible !== undefined) {
          rows = rows.filter((r) => r.isVisible === where.isVisible);
        }
        const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : null;
        return {
          _avg: { rating: _avg?.rating ? avg : null },
          _count: { rating: _count?.rating ? rows.length : 0 },
        };
      },
    },

    serviceRequest: {
      async count({ where }: any) {
        return db.serviceRequests.filter(
          (j) => j.selectedWorkerId === where?.selectedWorkerId && j.status === where?.status,
        ).length;
      },
    },

    async $transaction(cb: (tx: any) => Promise<any>) {
      return cb(fake);
    },

    $executeRaw(...args: unknown[]) {
      db.rawCalls.push(args.map((a) => String(a)).join('|'));
      return Promise.resolve(1);
    },
  };
  return Object.assign(fake, db);
}

function makeService(db: any, mapbox?: Partial<MapboxService>) {
  const mapboxService = {
    geocodeAddress:
      mapbox?.geocodeAddress ??
      (async () => ({ latitude: 34.0, longitude: 71.5, placeName: 'Peshawar' })),
  } as unknown as MapboxService;
  return new WorkerProfileService(db, mapboxService);
}

function addWorker(db: any, id: string, overrides: Record<string, unknown> = {}) {
  const worker = {
    id,
    phone: '03120000001',
    name: null,
    avatarUrl: null,
    role: 'WORKER',
    isVerified: false,
    ...overrides,
  };
  db.users.set(id, worker);
  return worker;
}

describe('WorkerProfileService', () => {
  describe('Step 1+2+3: updateWorkerProfile', () => {
    it('saves name + photo on the user and creates a profile row', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');

      const result = await service.updateWorkerProfile('w1', {
        name: 'Bilal',
        avatarUrl: 'https://cdn/photo.jpg',
        skills: ['cat-electric'],
        experienceYears: 5,
        bio: 'Licensed electrician',
      });

      expect(db.users.get('w1').name).toBe('Bilal');
      expect(db.users.get('w1').avatarUrl).toBe('https://cdn/photo.jpg');
      expect(db.workerProfiles.get('w1').skills).toEqual(['cat-electric']);
      expect(db.workerProfiles.get('w1').experienceYears).toBe(5);
      expect(db.workerProfiles.get('w1').bio).toBe('Licensed electrician');
      expect(result.user.phone).toBe('03120000001');
    });

    it('does not allow the phone number to be changed through the profile payload', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');

      await service.updateWorkerProfile('w1', { name: 'Bilal' });

      expect(db.users.get('w1').phone).toBe('03120000001');
      expect(db.users.get('w1')).not.toHaveProperty('phoneChanged');
    });

    it('rejects a disabled or unknown skill category', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');

      await expect(service.updateWorkerProfile('w1', { skills: ['cat-disabled'] })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('supports updating a subset of fields without overwriting others', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');

      await service.updateWorkerProfile('w1', { name: 'Bilal', skills: ['cat-electric'] });
      const result = await service.updateWorkerProfile('w1', { bio: 'Short bio' });

      expect(result.user.name).toBe('Bilal');
      expect(result.workerProfile.skills).toEqual(['cat-electric']);
      expect(result.workerProfile.bio).toBe('Short bio');
    });
  });

  describe('Step 4: saveServiceAreas', () => {
    it('stores provided coordinates and syncs PostGIS geometry', async () => {
      const db = makeDb();
      const raw = jest.fn(() => Promise.resolve(1)) as any;
      db.$executeRaw = raw;
      const service = makeService(db);
      addWorker(db, 'w1');

      const result = await service.saveServiceAreas('w1', {
        serviceAreas: [{ label: 'Hayatabad', address: 'Phase 5', latitude: 34.0, longitude: 71.5 }],
      });

      expect(result).toHaveLength(1);
      expect(result[0].latitude).toBe(34.0);
      expect(result[0].longitude).toBe(71.5);
      expect(raw).toHaveBeenCalled();
      const [strings, ...values] = raw.mock.calls[0] as [TemplateStringsArray, ...number[]];
      expect(strings.raw.join(' ')).toContain('ST_SetSRID');
      expect(values).toContain(71.5);
      expect(values).toContain(34);
    });

    it('geocodes an address via Mapbox when coordinates are not supplied', async () => {
      const geocodeAddress = jest.fn(async () => ({
        latitude: 33.9955,
        longitude: 71.4379,
        placeName: 'Hayatabad, Peshawar',
      }));
      const db = makeDb();
      const service = makeService(db, { geocodeAddress });
      addWorker(db, 'w1');

      const result = await service.saveServiceAreas('w1', {
        serviceAreas: [{ label: 'Hayatabad', address: 'Phase 5, Hayatabad' }],
      });

      expect(geocodeAddress).toHaveBeenCalledWith('Phase 5, Hayatabad');
      expect(result[0].latitude).toBe(33.9955);
      expect(result[0].longitude).toBe(71.4379);
    });

    it('rejects an address that cannot be geocoded', async () => {
      const geocodeAddress = jest.fn(async () => null);
      const db = makeDb();
      const service = makeService(db, { geocodeAddress });
      addWorker(db, 'w1');

      await expect(
        service.saveServiceAreas('w1', {
          serviceAreas: [{ label: 'Nowhere', address: 'Unknown place' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('replaces the previous set of service areas', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');

      await service.saveServiceAreas('w1', {
        serviceAreas: [{ label: 'Hayatabad', address: 'Ph5', latitude: 34, longitude: 71.5 }],
      });
      const second = await service.saveServiceAreas('w1', {
        serviceAreas: [
          { label: 'U-Town', address: 'University Rd', latitude: 34, longitude: 71.4 },
        ],
      });

      expect(second).toHaveLength(1);
      expect(second[0].label).toBe('U-Town');
      expect(db.serviceAreas.size).toBe(1);
    });
  });

  describe('Step 5: saveDocuments', () => {
    it('saves CNIC front, CNIC back and optional certificate', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');

      const result = await service.saveDocuments('w1', {
        cnicFront: { url: 'https://cdn/cnic-front.jpg', fileName: 'front.jpg' },
        cnicBack: { url: 'https://cdn/cnic-back.jpg' },
        certificate: { url: 'https://cdn/cert.pdf' },
      });

      const types = result.map((d) => d.type).sort();
      expect(types).toEqual(['CERTIFICATE', 'CNIC_BACK', 'CNIC_FRONT']);
    });

    it('updates existing documents on resubmission', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');

      await service.saveDocuments('w1', {
        cnicFront: { url: 'v1.jpg' },
        cnicBack: { url: 'v1-back.jpg' },
      });
      const result = await service.saveDocuments('w1', {
        cnicFront: { url: 'v2.jpg' },
        cnicBack: { url: 'v2-back.jpg' },
      });

      expect(result.filter((d) => d.type === 'CNIC_FRONT')[0].url).toBe('v2.jpg');
      const stored = [...db.verificationDocuments.values()] as Array<{ type: string }>;
      expect(stored.filter((d) => d.type === 'CNIC_FRONT')).toHaveLength(1);
    });

    it('editing documents after approval returns the profile to PENDING verification', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1', { isVerified: true });
      db.workerProfiles.set('w1', {
        ...db.workerProfiles.get('w1'),
        verificationStatus: 'APPROVED',
        verifiedAt: new Date(),
        rejectionReason: 'old',
        adminNote: null,
      });

      await service.saveDocuments('w1', {
        cnicFront: { url: 'next-front.jpg' },
        cnicBack: { url: 'next-back.jpg' },
      });

      const profile = db.workerProfiles.get('w1');
      expect(profile.verificationStatus).toBe('PENDING');
      expect(profile.verifiedAt).toBeNull();
      expect(profile.rejectionReason).toBeNull();
      expect(db.users.get('w1').isVerified).toBe(false);
    });

    it('document edits leave an un-submitted profile untouched', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');
      db.workerProfiles.set('w1', {
        userId: 'w1',
        skills: [],
        experienceYears: null,
        bio: null,
        isAvailable: false,
        serviceRadiusKm: 10,
        verificationStatus: 'NOT_SUBMITTED',
        rejectionReason: null,
        adminNote: null,
        submittedAt: null,
        verifiedAt: null,
      });

      await service.saveDocuments('w1', {
        cnicFront: { url: 'f.jpg' },
        cnicBack: { url: 'b.jpg' },
      });

      expect(db.workerProfiles.get('w1').verificationStatus).toBe('NOT_SUBMITTED');
    });
  });

  describe('Step 6: submitForVerification', () => {
    async function buildComplete(db: any, id: string): Promise<WorkerProfileService> {
      const service = makeService(db);
      addWorker(db, id, { name: 'Bilal', avatarUrl: 'https://cdn/p.jpg' });
      await service.updateWorkerProfile(id, {
        name: 'Bilal',
        avatarUrl: 'https://cdn/p.jpg',
        skills: ['cat-electric'],
        experienceYears: 4,
        bio: 'Plumber by trade',
      });
      await service.saveServiceAreas(id, {
        serviceAreas: [{ label: 'H', address: 'X', latitude: 34, longitude: 71.5 }],
      });
      await service.saveDocuments(id, { cnicFront: { url: 'f.jpg' }, cnicBack: { url: 'b.jpg' } });
      return Promise.resolve(service);
    }

    it('rejects submission while required steps are missing', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');

      await expect(service.submitForVerification('w1')).rejects.toThrow(/PROFILE_INCOMPLETE/);
    });

    it('submits a complete profile and moves it to PENDING', async () => {
      const db = makeDb();
      const service = await buildComplete(db, 'w1');

      const result = await service.submitForVerification('w1');

      expect(result.verificationStatus).toBe('PENDING');
      expect(result.submittedAt).toBeInstanceOf(Date);
      expect(db.workerProfiles.get('w1').verificationStatus).toBe('PENDING');
    });

    it('does not allow double submission while pending', async () => {
      const db = makeDb();
      const service = await buildComplete(db, 'w1');

      await service.submitForVerification('w1');
      await expect(service.submitForVerification('w1')).rejects.toThrow(
        /PROFILE_ALREADY_SUBMITTED/,
      );
    });

    it('re-submits after rejection and clears the previous reason', async () => {
      const db = makeDb();
      const service = await buildComplete(db, 'w1');
      db.workerProfiles.set('w1', {
        ...db.workerProfiles.get('w1'),
        verificationStatus: 'REJECTED',
        rejectionReason: 'Expired CNIC',
        adminNote: null,
      });

      const result = await service.submitForVerification('w1');
      const profile = db.workerProfiles.get('w1');

      expect(result.verificationStatus).toBe('PENDING');
      expect(profile.rejectionReason).toBeNull();
      expect(profile.adminNote).toBeNull();
    });

    it('re-submits after request-changes and clears the admin note', async () => {
      const db = makeDb();
      const service = await buildComplete(db, 'w1');
      db.workerProfiles.set('w1', {
        ...db.workerProfiles.get('w1'),
        verificationStatus: 'REQUEST_CHANGES',
        rejectionReason: null,
        adminNote: 'Please upload a clearer photo',
      });

      const result = await service.submitForVerification('w1');
      const profile = db.workerProfiles.get('w1');

      expect(result.verificationStatus).toBe('PENDING');
      expect(profile.adminNote).toBeNull();
    });
  });

  describe('getWorkerOnboarding progress', () => {
    it('reports which steps are still missing', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');

      const partial = await service.getWorkerOnboarding('w1');
      expect(partial.progress.complete).toBe(false);
      expect(partial.progress.missingSteps.sort()).toEqual([...WORKER_PROFILE_STEPS].sort());

      await service.updateWorkerProfile('w1', {
        name: 'Bilal',
        avatarUrl: 'p.jpg',
        skills: ['cat-electric'],
        experienceYears: 2,
        bio: 'bio',
      });
      await service.saveServiceAreas('w1', {
        serviceAreas: [{ label: 'H', address: 'X', latitude: 34, longitude: 71.5 }],
      });
      await service.saveDocuments('w1', { cnicFront: { url: 'f' }, cnicBack: { url: 'b' } });

      const complete = await service.getWorkerOnboarding('w1');
      expect(complete.progress.complete).toBe(true);
      expect(complete.progress.missingSteps).toHaveLength(0);
      expect(complete.progress.completedSteps).toBe(WORKER_PROFILE_STEPS.length);
    });
  });

  describe('getPublicProfile', () => {
    it('returns verified flag, skills, rating and completed jobs', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1', { name: 'Bilal', avatarUrl: 'p.jpg' });
      await service.updateWorkerProfile('w1', {
        name: 'Bilal',
        avatarUrl: 'p.jpg',
        skills: ['cat-electric'],
        experienceYears: 3,
        bio: 'bio',
      });
      db.workerProfiles.get('w1').verificationStatus = 'APPROVED';
      db.reviews.push({ revieweeId: 'w1', rating: 5, isVisible: true });
      db.reviews.push({ revieweeId: 'w1', rating: 4, isVisible: true });
      db.serviceRequests.push({ selectedWorkerId: 'w1', status: 'COMPLETED' });
      db.serviceRequests.push({ selectedWorkerId: 'w1', status: 'OPEN' });

      const card = await service.getPublicProfile('w1');

      expect(card.verified).toBe(true);
      expect(card.skills).toEqual([{ id: 'cat-electric', name: 'Electrical', nameUrdu: null }]);
      expect(card.rating.average).toBe(4.5);
      expect(card.rating.count).toBe(2);
      expect(card.completedJobs).toBe(1);
    });

    it('throws when the worker profile does not exist', async () => {
      const db = makeDb();
      const service = makeService(db);
      await expect(service.getPublicProfile('nobody')).rejects.toThrow();
    });
  });

  describe('toString helper: getWorkerProfileCompletion', () => {
    it('requires all five steps for completion', () => {
      expect(
        getWorkerProfileCompletion({
          name: 'A',
          avatarUrl: 'p',
          skills: ['s'],
          experienceYears: 1,
          bio: 'b',
          serviceAreaCount: 1,
          cnicFrontUrl: 'f',
          cnicBackUrl: 'b',
        }).complete,
      ).toBe(true);

      expect(
        getWorkerProfileCompletion({
          name: null,
          avatarUrl: null,
          skills: [],
          experienceYears: null,
          bio: null,
          serviceAreaCount: 0,
          cnicFrontUrl: null,
          cnicBackUrl: null,
        }).missingSteps,
      ).toEqual(
        expect.arrayContaining([
          'BASIC_INFORMATION',
          'SKILLS',
          'EXPERIENCE',
          'SERVICE_AREAS',
          'VERIFICATION_DOCUMENTS',
        ]),
      );
    });

    it('treats zero experience years as provided', () => {
      const result = getWorkerProfileCompletion({
        name: 'A',
        avatarUrl: 'p',
        skills: ['s'],
        experienceYears: 0,
        bio: 'b',
        serviceAreaCount: 1,
        cnicFrontUrl: 'f',
        cnicBackUrl: 'b',
      });
      expect(result.missingSteps).not.toContain('EXPERIENCE');
    });
  });

  describe('availability', () => {
    it('toggles the isAvailable flag', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');

      const on = await service.toggleAvailability('w1', { isAvailable: true });
      expect(on.isAvailable).toBe(true);
      const off = await service.toggleAvailability('w1', { isAvailable: false });
      expect(off.isAvailable).toBe(false);
    });
  });
});
