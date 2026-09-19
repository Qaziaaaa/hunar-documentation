import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { WorkerProfileService } from './worker-profile.service';
import {
  UpdateAvailabilityDto,
  UpdateDocumentsDto,
  UpdateMyProfileDto,
  UpdateServiceAreasDto,
  UpdateWorkerProfileDto,
} from './users.validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly workerProfileService: WorkerProfileService,
  ) {}

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMyProfile(user.sub);
  }

  @Put('me')
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateMyProfileDto) {
    return this.usersService.updateMe(user.sub, dto);
  }

  // ----- Worker onboarding (6-step wizard) -----

  @Get('worker/me')
  @Roles(Role.WORKER)
  workerOnboarding(@CurrentUser() user: JwtPayload) {
    return this.workerProfileService.getWorkerOnboarding(user.sub);
  }

  // Step 1 (name + photo) / Step 2 (skills) / Step 3 (experience + bio).
  // Phone is pre-filled from signup and is intentionally not part of this payload.
  @Put('worker/me')
  @Roles(Role.WORKER)
  updateWorkerProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateWorkerProfileDto) {
    return this.workerProfileService.updateWorkerProfile(user.sub, dto);
  }

  // Step 4 — service areas (coordinates + address; Mapbox geocoding; PostGIS storage).
  @Put('worker/service-areas')
  @Roles(Role.WORKER)
  saveServiceAreas(@CurrentUser() user: JwtPayload, @Body() dto: UpdateServiceAreasDto) {
    return this.workerProfileService.saveServiceAreas(user.sub, dto);
  }

  // Step 5 — verification documents (CNIC front/back required, certificate optional).
  @Put('worker/documents')
  @Roles(Role.WORKER)
  saveDocuments(@CurrentUser() user: JwtPayload, @Body() dto: UpdateDocumentsDto) {
    return this.workerProfileService.saveDocuments(user.sub, dto);
  }

  // Step 6 — review & submit for admin verification.
  @Post('worker/submit')
  @Roles(Role.WORKER)
  submitForVerification(@CurrentUser() user: JwtPayload) {
    return this.workerProfileService.submitForVerification(user.sub);
  }

  @Get('worker/me/verification')
  @Roles(Role.WORKER)
  getVerification(@CurrentUser() user: JwtPayload) {
    return this.workerProfileService.getVerification(user.sub);
  }

  @Put('worker/availability')
  @Roles(Role.WORKER)
  setAvailability(@CurrentUser() user: JwtPayload, @Body() dto: UpdateAvailabilityDto) {
    return this.workerProfileService.toggleAvailability(user.sub, dto);
  }

  @Get('worker/:id')
  getPublicWorkerProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.workerProfileService.getPublicProfile(id);
  }
}
