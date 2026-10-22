import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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
  ValidateIf,
} from 'class-validator';
import {
  CommissionStatus,
  DisputeStatus,
  DisputeType,
  JobStatus,
  VisitStatus,
  WalletLedgerType,
  WorkerVerificationStatus,
  WithdrawalStatus,
} from '@prisma/client';

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

  // Delta polling: return only jobs created after this ISO timestamp (newer
  // than everything the client already has). Optional — callers without it
  // see the unchanged newest-first list.
  @IsOptional()
  @IsDateString()
  since?: string;

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

export enum SuspensionType {
  PERMANENT = 'PERMANENT',
  TEMPORARY = 'TEMPORARY',
}

export enum SuspensionDuration {
  TWO_HOURS = '2_HOURS',
  SIX_HOURS = '6_HOURS',
  TWELVE_HOURS = '12_HOURS',
  ONE_DAY = '1_DAY',
  THREE_DAYS = '3_DAYS',
  ONE_WEEK = '1_WEEK',
  TWO_WEEKS = '2_WEEKS',
  ONE_MONTH = '1_MONTH',
}

export function computeSuspendedUntil(duration: string, now: Date = new Date()): Date {
  const until = new Date(now.getTime());
  switch (duration) {
    case '2_HOURS':
      until.setHours(until.getHours() + 2);
      break;
    case '6_HOURS':
      until.setHours(until.getHours() + 6);
      break;
    case '12_HOURS':
      until.setHours(until.getHours() + 12);
      break;
    case '1_DAY':
      until.setDate(until.getDate() + 1);
      break;
    case '3_DAYS':
      until.setDate(until.getDate() + 3);
      break;
    case '1_WEEK':
      until.setDate(until.getDate() + 7);
      break;
    case '2_WEEKS':
      until.setDate(until.getDate() + 14);
      break;
    case '1_MONTH':
      until.setMonth(until.getMonth() + 1);
      break;
    default:
      until.setDate(until.getDate() + 1);
      break;
  }
  return until;
}

// Suspend is a sensitive action — the admin must always state why (stored in the audit trail).
// Supports Permanent and Temporary suspensions per Section 5 specification.
export class SuspendUserDto {
  @IsOptional()
  @IsEnum(SuspensionType)
  type?: SuspensionType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  violationType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ValidateIf((o) => o.type === SuspensionType.TEMPORARY)
  @IsOptional()
  @IsEnum(SuspensionDuration)
  duration?: SuspensionDuration;
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

// Manual wallet top-up by admin
export class AdminTopUpWalletDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000000)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultVisitCharge?: number;
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

  @IsOptional()
  distanceSlabs?: any;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultVisitCharge?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
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

  // Wallet rules — enforced by payments/wallet.service (hold gate + offline rule).
  // 0 = workers may never go negative; more negative = larger allowed debt.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-100000)
  @Max(0)
  walletMaxNegativeBalance?: number;

  // Worker controls — enforced by offers.service (createOffer cap).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxActiveOffersPerWorker?: number;
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

export class AdminKpiStatsDto {
  @IsInt()
  totalJobs: number;

  @IsInt()
  openJobs: number;

  @IsInt()
  activeJobs: number;

  @IsInt()
  completedJobs: number;

  @IsInt()
  cancelledJobs: number;

  @IsInt()
  totalCustomers: number;

  @IsInt()
  newCustomersThisWeek: number;

  @IsInt()
  totalWorkers: number;

  @IsInt()
  verifiedWorkers: number;

  @IsInt()
  pendingWorkers: number;

  @IsInt()
  suspendedWorkers: number;

  @IsNumber()
  totalRevenue: number;

  @IsInt()
  totalPaymentsProcessed: number;

  @IsInt()
  activeNowCount: number;
}

export class AdminVisitListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

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

export class AdminReviewListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsIn(['true', 'false'])
  isVisible?: string;

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
