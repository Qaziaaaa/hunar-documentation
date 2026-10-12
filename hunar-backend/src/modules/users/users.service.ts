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
        email: (user as any).email ?? null,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }

  // Personal profile update (name/photo/email/skills/bio/serviceAreas/workshop).
  async updateMe(userId: string, dto: UpdateMyProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email.trim() || null } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl || null } : {}),
      },
    });

    if (user.role === Role.WORKER) {
      const expYears = dto.experienceYears ?? dto.yearsExperience;
      const isAvail = dto.profileVisible ?? dto.privacy?.profileVisible;

      if (
        dto.skills !== undefined ||
        expYears !== undefined ||
        dto.bio !== undefined ||
        isAvail !== undefined
      ) {
        await this.prisma.workerProfile.upsert({
          where: { userId },
          update: {
            ...(dto.skills !== undefined ? { skills: dto.skills } : {}),
            ...(expYears !== undefined ? { experienceYears: expYears } : {}),
            ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
            ...(isAvail !== undefined ? { isAvailable: isAvail } : {}),
          },
          create: {
            userId,
            skills: dto.skills ?? [],
            experienceYears: expYears,
            bio: dto.bio,
            isAvailable: isAvail ?? true,
          },
        });
      }

      // Handle service areas and workshop location if provided
      if (dto.serviceAreas !== undefined || dto.workshopLocation !== undefined) {
        const areasToSave: Array<{
          label: string;
          address: string;
          latitude: number;
          longitude: number;
        }> = [];

        if (dto.workshopLocation && dto.workshopLocation.trim()) {
          areasToSave.push({
            label: 'Workshop',
            address: dto.workshopLocation.trim(),
            latitude: 34.0045,
            longitude: 71.477,
          });
        }

        if (Array.isArray(dto.serviceAreas)) {
          for (const item of dto.serviceAreas) {
            if (typeof item === 'string' && item.trim()) {
              const label = item.trim();
              if (
                label.toLowerCase() !== 'workshop' &&
                !areasToSave.some((a) => a.label === label)
              ) {
                areasToSave.push({
                  label,
                  address: `${label}, Peshawar`,
                  latitude: 34.0151,
                  longitude: 71.5249,
                });
              }
            } else if (item && typeof item === 'object' && item.label) {
              areasToSave.push({
                label: item.label,
                address: item.address || `${item.label}, Peshawar`,
                latitude: item.latitude ?? 34.0151,
                longitude: item.longitude ?? 71.5249,
              });
            }
          }
        }

        if (areasToSave.length > 0) {
          await this.prisma.serviceArea.deleteMany({ where: { userId } });
          for (const area of areasToSave) {
            await this.prisma.serviceArea.create({
              data: {
                userId,
                label: area.label,
                address: area.address,
                latitude: area.latitude,
                longitude: area.longitude,
              },
            });
          }
        }
      }

      return this.workerProfileService.getWorkerOnboarding(userId);
    }

    return {
      user: {
        id: updated.id,
        phone: updated.phone,
        email: (updated as any).email ?? null,
        name: updated.name,
        avatarUrl: updated.avatarUrl,
        role: updated.role,
      },
    };
  }

  async getPrivacy(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let showVisitCharge = true;
    if (user.workerProfile?.adminNote) {
      try {
        const parsed = JSON.parse(user.workerProfile.adminNote);
        if (typeof parsed.showVisitCharge === 'boolean') {
          showVisitCharge = parsed.showVisitCharge;
        }
      } catch {
        // Plain string admin note
      }
    }

    return {
      profileVisible: user.workerProfile ? user.workerProfile.isAvailable : true,
      showVisitCharge,
    };
  }

  async updatePrivacy(
    userId: string,
    dto: { profileVisible?: boolean; showVisitCharge?: boolean },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.WORKER) {
      let adminNoteObj: Record<string, any> = {};
      if (user.workerProfile?.adminNote) {
        try {
          adminNoteObj = JSON.parse(user.workerProfile.adminNote);
        } catch {
          // Plain string admin note
        }
      }

      const updateData: any = {};
      if (dto.profileVisible !== undefined) {
        updateData.isAvailable = dto.profileVisible;
      }
      if (dto.showVisitCharge !== undefined) {
        adminNoteObj.showVisitCharge = dto.showVisitCharge;
        updateData.adminNote = JSON.stringify(adminNoteObj);
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.workerProfile.upsert({
          where: { userId },
          update: updateData,
          create: {
            userId,
            isAvailable: dto.profileVisible ?? true,
            adminNote: updateData.adminNote,
          },
        });
      }
    }

    return this.getPrivacy(userId);
  }

  async deleteMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: 'Deleted Account',
        avatarUrl: null,
      },
    });
    return { success: true, message: 'Account deleted successfully' };
  }
}
