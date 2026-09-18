import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminVerificationService } from './admin-verification.service';
import { VerificationDecisionDto } from './admin-verification.validation';

@Controller('admin')
export class AdminVerificationController {
  constructor(private readonly verificationService: AdminVerificationService) {}

  // Admin review queue — pending worker submissions awaiting a human decision.
  @Get('verifications/pending')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  listPending() {
    return this.verificationService.listPending();
  }

  // Human admin decision: APPROVED / REJECTED (requires reason) / REQUEST_CHANGES (requires admin note).
  @Put('verifications/:userId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  decide(@Param('userId', ParseUUIDPipe) userId: string, @Body() dto: VerificationDecisionDto) {
    return this.verificationService.decide(userId, dto);
  }
}
