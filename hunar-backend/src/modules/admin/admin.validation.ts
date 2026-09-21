import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { JobStatus, WalletLedgerType, WorkerVerificationStatus } from '@prisma/client';

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
