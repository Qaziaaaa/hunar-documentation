import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CommissionStatus, DisputeStatus, DisputeType, JobStatus, WalletLedgerType, WorkerVerificationStatus, WithdrawalStatus } from '@prisma/client';

export const USER_STATUS_FILTERS = ['active', 'suspended'] as const;
export type UserStatusFilter = (typeof USER_STATUS_FILTERS)[number];

export const VERIFICATION_STATUSES = [
  WorkerVerificationStatus.NOT_SUBMITTED,
  WorkerVerificationStatus.PENDING,
  WorkerVerificationStatus.APPROVED,
  WorkerVerificationStatus.REJECTED,
  WorkerVerificationStatus.REQUEST_CHANGES,
  WorkerVerificationStatus.REVOKED,
] as const;

// Shared list query for the admin customer/worker directories (search + status + pagination).
export class AdminUserListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(USER_STATUS_FILTERS)
  status?: UserStatusFilter;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class AdminWorkerListQueryDto extends AdminUserListQueryDto {
  @IsOptional()
  @IsIn(VERIFICATION_STATUSES)
  verificationStatus?: WorkerVerificationStatus;
}

// Job directory query for the admin jobs screen (Admin flow §7.1).
export class AdminJobListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

// Suspend is a sensitive action — the admin must always state why (stored in the audit trail).
export class SuspendUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

// Force-cancel is a sensitive action — the admin must always state why (stored in the audit trail).
export class ForceCancelJobDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

export class AdminTransactionListQueryDto {
  @IsOptional()
  @IsEnum(WalletLedgerType)
  type?: WalletLedgerType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// Payments feed (Admin flow §8 — Step F). Payments are derived from paid jobs: there is no
// standalone Payment table, so this lists jobs whose status means the customer has paid.
export class AdminPaymentListQueryDto {
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// Commission snapshot feed (Admin flow §8 — Step F). Read-only oversight of platform revenue.
export class AdminCommissionListQueryDto {
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// Withdrawal queue (Admin flow §8 — Step F). Admin oversight of worker withdrawal requests.
export class AdminWithdrawalListQueryDto {
  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AdminProcessWithdrawalDto {
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

// Wallet freeze (Admin flow §8). Admin freezes a worker's wallet during a dispute.
export class AdminFreezeWalletDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

// Dispute queue (Admin flow §10). Admin dispute resolution.
export class AdminDisputeListQueryDto {
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsEnum(DisputeType)
  type?: DisputeType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AdminResolveDisputeDto {
  @IsEnum(['resolve', 'dismiss', 'escalate'])
  action: 'resolve' | 'dismiss' | 'escalate';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolution?: string; // Required for resolve, optional for dismiss/escalate

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AdminDisputeNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

// Category management (Admin flow §11). Service category CRUD.
export class AdminCategoryListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  isActive?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AdminCreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameUrdu?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class AdminUpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameUrdu?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

// Platform settings (Admin flow §12). Admin views and updates platform settings.
export class AdminUpdateCommissionRateDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate: number;
}

export class AdminUpdateSettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  serviceRadiusKm?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxPhotosPerJob?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  allowedFileTypes?: string;

  @IsOptional()
  @IsString()
  announcement?: string;
}

// Reports (Admin flow §13). Analytics reports with export.
export class AdminReportQueryDto {
  @IsEnum(['jobs-funnel', 'worker-performance', 'revenue', 'growth'])
  type: 'jobs-funnel' | 'worker-performance' | 'revenue' | 'growth';

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(['json', 'csv'])
  format?: 'json' | 'csv';
}

// Audit trail (Admin flow §15). Admin views audit log.
export class AdminAuditListQueryDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  actorId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// Admin notifications (Admin flow §14). Admin notification inbox.
export class AdminNotificationListQueryDto {
  @IsOptional()
  @IsIn(['true', 'false'])
  isRead?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AdminMarkNotificationsReadDto {
  @IsArray()
  @IsUUID(4, { each: true })
  notificationIds: string[];
}
