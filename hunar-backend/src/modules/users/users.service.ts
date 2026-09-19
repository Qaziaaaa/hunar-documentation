import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkerProfileService } from './worker-profile.service';
import { UpdateMyProfileDto } from './users.validation';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workerProfileService: WorkerProfileService,
  ) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === Role.WORKER) {
      return this.workerProfileService.getWorkerOnboarding(userId);
    }
    return {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }

  // Personal profile update (name/photo). Phone is never changeable here — it is the signup identity.
  async updateMe(userId: string, dto: UpdateMyProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl || null } : {}),
      },
    });
    return {
      user: {
        id: updated.id,
        phone: updated.phone,
        name: updated.name,
        avatarUrl: updated.avatarUrl,
        role: updated.role,
      },
    };
  }
}
