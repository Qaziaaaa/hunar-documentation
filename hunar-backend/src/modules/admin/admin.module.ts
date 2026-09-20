import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminVerificationController } from './admin-verification.controller';
import { AdminVerificationService } from './admin-verification.service';
import { AuditService } from './audit.service';

@Module({
  controllers: [AdminController, AdminVerificationController],
  providers: [AdminService, AdminVerificationService, AuditService],
  exports: [AuditService],
})
export class AdminModule {}
