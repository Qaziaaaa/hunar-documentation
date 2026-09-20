import { NotFoundException } from '@nestjs/common';
import { AdminVerificationService } from './admin-verification.service';
import { AuditService } from './audit.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';

class Db {
  users = new Map<string, any>();
  workerProfiles = new Map<string, any>();
  serviceCategories = new Map<string, any>();
  serviceAreas: any[] = [];
  verificationDocuments: any[] = [];

  constructor() {
    this.serviceCategories.set('cat-electric', {
      id: 'cat-electric',
      name: 'Electrical',
      nameUrdu: null,
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
        const p = db.workerProfiles.get(where.userId) ?? null;
        if (!p) {
          return null;
        }
        if (include?.user?.select) {
          const u = db.users.get(p.userId);
          return u
            ? { ...p, user: { id: u.id, name: u.name, phone: u.phone, avatarUrl: u.avatarUrl } }
            : p;
        }
        return p;
      },
      async findMany({ where, include, _orderBy }: any) {
        let rows = Array.from(db.workerProfiles.values());
        if (where?.verificationStatus) {
          rows = rows.filter((p) => p.verificationStatus === where.verificationStatus);
        }
        if (include?.user?.select) {
          rows = rows.map((p) => {
            const u = db.users.get(p.userId);
            return u
              ? { ...p, user: { id: u.id, name: u.name, phone: u.phone, avatarUrl: u.avatarUrl } }
              : p;
          });
        }
        return rows;
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
        return rows.map((c) => {
          const out: any = {};
          if (select?.id) out.id = c.id;
          if (select?.name) out.name = c.name;
          if (select?.nameUrdu) out.nameUrdu = c.nameUrdu;
          return out;
        });
      },
    },

    serviceArea: {
      async findMany({ where }: any) {
        if (where?.userId?.in) {
          return db.serviceAreas.filter((a) => where.userId.in.includes(a.userId));
        }
        return db.serviceAreas;
      },
    },

    verificationDocument: {
      async findMany({ where }: any) {
        if (where?.userId?.in) {
          return db.verificationDocuments.filter((d) => where.userId.in.includes(d.userId));
        }
        return db.verificationDocuments;
      },
    },

    async $transaction(cb: (tx: any) => Promise<any>) {
      return cb(fake);
    },
  };
  return Object.assign(fake, db);
}

function makeService(db: any) {
  return new AdminVerificationService(
    db,
    { emit: jest.fn() } as unknown as EventBusService,
    { record: jest.fn() } as unknown as AuditService,
  );
}

function addWorker(db: any, id: string, overrides: Record<string, unknown> = {}) {
  const worker = {
    id,
    phone: '03120000001',
    name: 'Bilal',
    avatarUrl: null,
    role: 'WORKER',
    isVerified: false,
    isActive: true,
    ...overrides,
  };
  db.users.set(id, worker);
  db.workerProfiles.set(id, {
    userId: id,
    skills: [],
    experienceYears: null,
    bio: null,
    isAvailable: false,
    serviceRadiusKm: 10,
    verificationStatus: 'PENDING',
    rejectionReason: null,
    adminNote: null,
    submittedAt: new Date(),
    verifiedAt: null,
  });
  return worker;
}

describe('AdminVerificationService', () => {
  describe('decide', () => {
    it('approves a worker: status APPROVED, verified flag on, stale notes cleared', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1', {
        isVerified: false,
      });
      db.workerProfiles.set('w1', {
        ...db.workerProfiles.get('w1'),
        rejectionReason: 'old reason',
      });

      const result = await service.decide('w1', { decision: 'APPROVED' });

      expect(result.verificationStatus).toBe('APPROVED');
      expect(result.verifiedAt).toBeInstanceOf(Date);
      expect(result.rejectionReason).toBeNull();
      expect(db.workerProfiles.get('w1').verificationStatus).toBe('APPROVED');
      expect(db.users.get('w1').isVerified).toBe(true);
    });

    it('rejects a worker and requires a reason', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1', { isVerified: true });

      await expect(service.decide('w1', { decision: 'REJECTED' })).rejects.toThrow(
        /REJECTION_REASON_REQUIRED/,
      );

      const result = await service.decide('w1', {
        decision: 'REJECTED',
        reason: 'Expired CNIC',
      });

      expect(result.verificationStatus).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Expired CNIC');
      expect(db.workerProfiles.get('w1').rejectionReason).toBe('Expired CNIC');
      expect(db.users.get('w1').isVerified).toBe(false);
    });

    it('requests changes and requires an admin note', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1', { isVerified: true });

      await expect(service.decide('w1', { decision: 'REQUEST_CHANGES' })).rejects.toThrow(
        /ADMIN_NOTE_REQUIRED/,
      );

      const result = await service.decide('w1', {
        decision: 'REQUEST_CHANGES',
        adminNote: 'Please upload a clearer photo of your CNIC',
      });

      expect(result.verificationStatus).toBe('REQUEST_CHANGES');
      expect(result.adminNote).toBe('Please upload a clearer photo of your CNIC');
      expect(db.users.get('w1').isVerified).toBe(false);
    });

    it('throws when the user does not exist', async () => {
      const service = makeService(makeDb());

      await expect(service.decide('nobody', { decision: 'APPROVED' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the worker profile does not exist', async () => {
      const db = makeDb();
      const service = makeService(db);
      db.users.set('w1', { id: 'w1', name: 'Bilal', isVerified: false });

      await expect(service.decide('w1', { decision: 'APPROVED' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listPending', () => {
    it('returns only pending submissions with the data needed for review', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');
      addWorker(db, 'w2', { name: 'Ali' });
      db.workerProfiles.get('w2').verificationStatus = 'APPROVED';
      db.workerProfiles.get('w1').skills = ['cat-electric'];
      db.workerProfiles.get('w1').experienceYears = 4;
      db.workerProfiles.get('w1').bio = 'Plumber by trade';
      db.serviceAreas.push({
        userId: 'w1',
        label: 'Hayatabad',
        address: 'Phase 5',
        latitude: 34,
        longitude: 71.5,
      });
      db.verificationDocuments.push({
        userId: 'w1',
        type: 'CNIC_FRONT',
        url: 'https://cdn/front.jpg',
        fileName: 'front.jpg',
        mimeType: 'image/jpeg',
        uploadedAt: new Date(),
      });

      const rows = await service.listPending();

      expect(rows).toHaveLength(1);
      expect(rows[0].userId).toBe('w1');
      expect(rows[0].name).toBe('Bilal');
      expect(rows[0].skills[0].id).toBe('cat-electric');
      expect(rows[0].serviceAreas[0].label).toBe('Hayatabad');
      expect(rows[0].documents[0].type).toBe('CNIC_FRONT');
    });

    it('returns an empty list when nothing is pending', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');
      db.workerProfiles.get('w1').verificationStatus = 'NOT_SUBMITTED';

      expect(await service.listPending()).toEqual([]);
    });
  });

  describe('getDetail (Task 19)', () => {
    it('returns the full submission detail for a worker', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1');
      db.workerProfiles.set('w1', {
        ...db.workerProfiles.get('w1'),
        verificationStatus: 'PENDING',
        skills: ['cat-electric'],
        experienceYears: 4,
        bio: 'Plumber by trade',
      });
      db.serviceAreas.push({
        userId: 'w1',
        label: 'Hayatabad',
        address: 'Phase 5',
        latitude: 34,
        longitude: 71.5,
      });
      db.verificationDocuments.push({
        userId: 'w1',
        type: 'CNIC_FRONT',
        url: 'https://cdn/front.jpg',
        fileName: 'front.jpg',
        mimeType: 'image/jpeg',
        uploadedAt: new Date(),
      });

      const view = await service.getDetail('w1');

      expect(view.userId).toBe('w1');
      expect(view.name).toBe('Bilal');
      expect(view.phone).toBe('03120000001');
      expect(view.verificationStatus).toBe('PENDING');
      expect(view.skills[0].id).toBe('cat-electric');
      expect(view.serviceAreas[0].label).toBe('Hayatabad');
      expect(view.documents[0].type).toBe('CNIC_FRONT');
      expect(view.experienceYears).toBe(4);
    });

    it('throws 404 when the worker submission does not exist', async () => {
      const service = makeService(makeDb());

      await expect(service.getDetail('nobody')).rejects.toThrow(NotFoundException);
    });
  });

  describe('revoke (Task 23)', () => {
    it('revokes an approved verification with a reason and clears the verified flag', async () => {
      const db = makeDb();
      const service = makeService(db);
      addWorker(db, 'w1', { isVerified: true });
      db.workerProfiles.set('w1', {
        ...db.workerProfiles.get('w1'),
        verificationStatus: 'APPROVED',
        verifiedAt: new Date('2026-09-01T00:00:00Z'),
      });

      const result = await service.revoke('w1', { reason: 'Fraudulent certificate' });

      expect(result.verificationStatus).toBe('REVOKED');
      expect(result.rejectionReason).toBe('Fraudulent certificate');
      expect(db.workerProfiles.get('w1').verificationStatus).toBe('REVOKED');
      expect(db.users.get('w1').isVerified).toBe(false);
    });

    it('throws 404 when the user does not exist', async () => {
      const service = makeService(makeDb());

      await expect(service.revoke('nobody', { reason: 'Reason' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 when the worker profile does not exist', async () => {
      const db = makeDb();
      const service = makeService(db);
      db.users.set('w1', { id: 'w1', name: 'Bilal', isVerified: true });

      await expect(service.revoke('w1', { reason: 'Reason' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
