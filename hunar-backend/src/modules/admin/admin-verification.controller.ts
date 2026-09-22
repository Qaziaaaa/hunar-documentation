import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { Role, WorkerVerificationStatus } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { AdminVerificationService } from './admin-verification.service';
import {
  RejectVerificationDto,
  RequestChangesDto,
  RevokeVerificationDto,
  VerificationDecisionDto,
} from './admin-verification.validation';

// Admin verification workflow (Admin flow §M2, tasks 18–23).
// Static routes are declared before ':userId' so "pending" is never captured as an id.
@Controller('admin/verifications')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminVerificationController {
  constructor(private readonly verificationService: AdminVerificationService) {}

  // Queue of pending submissions.
  @Get()
  list() {
    return this.verificationService.listPending();
  }

  // Backwards-compatible alias for the queue.
  @Get('pending')
  listPending() {
    return this.verificationService.listPending();
  }

  // Full submission detail (documents, skills, experience, service areas).
  @Get(':userId')
  detail(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.verificationService.getDetail(userId);
  }

  // Generic decision endpoint (kept for compatibility).
  @Put(':userId')
  decide(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: VerificationDecisionDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.verificationService.decide(userId, dto, actor);
  }

  @Put(':userId/approve')
  approve(@Param('userId', ParseUUIDPipe) userId: string, @CurrentUser() actor: JwtPayload) {
    return this.verificationService.decide(
      userId,
      { decision: WorkerVerificationStatus.APPROVED },
      actor,
    );
  }

  @Put(':userId/reject')
  reject(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: RejectVerificationDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.verificationService.decide(
      userId,
      { decision: WorkerVerificationStatus.REJECTED, reason: dto.reason },
      actor,
    );
  }

  @Put(':userId/request-changes')
  requestChanges(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: RequestChangesDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.verificationService.decide(
      userId,
      { decision: WorkerVerificationStatus.REQUEST_CHANGES, adminNote: dto.adminNote },
      actor,
    );
  }

  @Put(':userId/revoke')
  revoke(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: RevokeVerificationDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.verificationService.revoke(userId, dto, actor);
  }
}
