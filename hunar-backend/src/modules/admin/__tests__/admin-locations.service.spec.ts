import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../audit.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { JwtPayload } from '../../../common/types/jwt-payload.interface';
import { Role } from '@prisma/client';

describe('AdminService - Cities and Areas Management', () => {
  let service: AdminService;
  let prisma: any;
  let audit: any;

  const mockAdmin: JwtPayload = {
    sub: 'admin-1',
    role: Role.ADMIN,
    phone: '+923001234567',
  };

  const mockCity = {
    id: 'city-1',
    name: 'Peshawar',
    nameUrdu: 'پشاور',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockArea = {
    id: 'area-1',
    cityId: 'city-1',
    name: 'Hayatabad',
    nameUrdu: 'حیات آباد',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    city: mockCity,
  };

  beforeEach(async () => {
    prisma = {
      city: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      area: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn(),
      },
      serviceArea: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      serviceRequest: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    audit = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: RealtimeService, useValue: { emitToUser: jest.fn(), emitToRoom: jest.fn() } },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  describe('Cities Management', () => {
    it('listCities calculates real areasCount, workersCount, and ordersCount', async () => {
      prisma.city.findMany.mockResolvedValue([
        { ...mockCity, areas: [mockArea] },
      ]);
      prisma.serviceArea.findMany.mockResolvedValue([
        { userId: 'w1', label: 'Hayatabad', address: 'Phase 5' },
        { userId: 'w2', label: 'Peshawar', address: 'Cantt' },
      ]);
      prisma.serviceRequest.findMany.mockResolvedValue([
        { id: 'job-1', city: 'Peshawar' },
        { id: 'job-2', city: 'peshawar' },
      ]);

      const result = await service.listCities();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Peshawar');
      expect(result[0].areasCount).toBe(1);
      expect(result[0].workersCount).toBe(2);
      expect(result[0].ordersCount).toBe(2);
    });

    it('createCity creates a city and records an audit log', async () => {
      prisma.city.findFirst.mockResolvedValue(null);
      prisma.city.create.mockResolvedValue(mockCity);

      const result = await service.createCity(
        {
          name: 'Peshawar',
          nameUrdu: 'پشاور',
        },
        mockAdmin,
      );

      expect(prisma.city.create).toHaveBeenCalledWith({
        data: { name: 'Peshawar', nameUrdu: 'پشاور', isActive: true },
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'admin-1',
          action: 'CITY_CREATED',
        }),
      );
      expect(result.name).toBe('Peshawar');
    });

    it('createCity rejects duplicate city names', async () => {
      prisma.city.findFirst.mockResolvedValue(mockCity);

      await expect(
        service.createCity({ name: 'Peshawar' }, mockAdmin),
      ).rejects.toThrow(ConflictException);
    });

    it('toggleCity updates isActive status and cascades deactivation to child areas', async () => {
      prisma.city.findUnique.mockResolvedValue(mockCity);
      prisma.city.update.mockResolvedValue({ ...mockCity, isActive: false });

      const result = await service.toggleCity('city-1', false, mockAdmin);

      expect(prisma.city.update).toHaveBeenCalledWith({
        where: { id: 'city-1' },
        data: { isActive: false },
      });
      expect(prisma.area.updateMany).toHaveBeenCalledWith({
        where: { cityId: 'city-1' },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'admin-1',
          action: 'CITY_DEACTIVATED',
        }),
      );
    });

    it('deleteCity deletes a city record', async () => {
      prisma.city.findUnique.mockResolvedValue({ ...mockCity, _count: { areas: 0 } });
      prisma.city.delete.mockResolvedValue(mockCity);

      const result = await service.deleteCity('city-1', mockAdmin);

      expect(prisma.city.delete).toHaveBeenCalledWith({ where: { id: 'city-1' } });
      expect(result).toEqual({ success: true, id: 'city-1' });
    });
  });

  describe('Areas Management', () => {
    it('listAreas returns areas with parent city and calculated counts', async () => {
      prisma.area.findMany.mockResolvedValue([mockArea]);
      prisma.serviceArea.findMany.mockResolvedValue([
        { userId: 'w1', label: 'Hayatabad', address: 'Phase 5' },
      ]);
      prisma.serviceRequest.findMany.mockResolvedValue([
        { id: 'job-1', area: 'Hayatabad' },
      ]);

      const result = await service.listAreas();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hayatabad');
      expect(result[0].cityName).toBe('Peshawar');
      expect(result[0].workersCount).toBe(1);
      expect(result[0].ordersCount).toBe(1);
    });

    it('createArea requires a valid parent city', async () => {
      prisma.city.findUnique.mockResolvedValue(null);

      await expect(
        service.createArea(
          {
            cityId: 'non-existent',
            name: 'Hayatabad',
          },
          mockAdmin,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('createArea creates an area when parent city exists', async () => {
      prisma.city.findUnique.mockResolvedValue(mockCity);
      prisma.area.findFirst.mockResolvedValue(null);
      prisma.area.create.mockResolvedValue(mockArea);

      const result = await service.createArea(
        {
          cityId: 'city-1',
          name: 'Hayatabad',
          nameUrdu: 'حیات آباد',
        },
        mockAdmin,
      );

      expect(prisma.area.create).toHaveBeenCalledWith({
        data: {
          cityId: 'city-1',
          name: 'Hayatabad',
          nameUrdu: 'حیات آباد',
          isActive: true,
        },
        include: expect.objectContaining({
          city: expect.any(Object),
        }),
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'admin-1',
          action: 'AREA_CREATED',
        }),
      );
      expect(result.name).toBe('Hayatabad');
    });

    it('toggleArea toggles area active status', async () => {
      prisma.area.findUnique.mockResolvedValue(mockArea);
      prisma.area.update.mockResolvedValue({ ...mockArea, isActive: false });

      const result = await service.toggleArea('area-1', false, mockAdmin);

      expect(prisma.area.update).toHaveBeenCalledWith({
        where: { id: 'area-1' },
        data: { isActive: false },
        include: expect.objectContaining({
          city: expect.any(Object),
        }),
      });
      expect(result.isActive).toBe(false);
    });

    it('deleteArea deletes an area record', async () => {
      prisma.area.findUnique.mockResolvedValue(mockArea);
      prisma.area.delete.mockResolvedValue(mockArea);

      const result = await service.deleteArea('area-1', mockAdmin);

      expect(prisma.area.delete).toHaveBeenCalledWith({ where: { id: 'area-1' } });
      expect(result).toEqual({ success: true, id: 'area-1' });
    });
  });
});
