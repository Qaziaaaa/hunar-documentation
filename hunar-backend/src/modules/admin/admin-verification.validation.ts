import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { WorkerVerificationStatus } from '@prisma/client';

// The verification workflow supports exactly these three human-admin outcomes.
export const ADMIN_DECISIONS = [
  WorkerVerificationStatus.APPROVED,
  WorkerVerificationStatus.REJECTED,
  WorkerVerificationStatus.REQUEST_CHANGES,
] as const;

export class VerificationDecisionDto {
  @IsIn(ADMIN_DECISIONS)
  decision: (typeof ADMIN_DECISIONS)[number];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  adminNote?: string;
}

// Spec-aligned per-action bodies (PUT .../reject and .../request-changes).
export class RejectVerificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

export class RequestChangesDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  adminNote!: string;
}

// Revoking an approved verification is sensitive — a reason is mandatory.
export class RevokeVerificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}
