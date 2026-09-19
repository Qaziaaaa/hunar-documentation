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
