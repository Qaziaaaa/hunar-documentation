import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveCities() {
    return this.prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        nameUrdu: true,
        areas: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, nameUrdu: true },
        },
      },
    });
  }

  async getActiveAreas(cityName?: string) {
    return this.prisma.area.findMany({
      where: {
        isActive: true,
        city: {
          isActive: true,
          ...(cityName ? { name: { equals: cityName, mode: 'insensitive' } } : {}),
        },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        nameUrdu: true,
        cityId: true,
        city: { select: { id: true, name: true, nameUrdu: true } },
      },
    });
  }
}
