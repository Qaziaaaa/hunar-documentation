import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class TopUpDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  transactionRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;

  @IsString()
  @MaxLength(500)
  screenshotUrl: string;
}

export class WalletQueryDto {
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

export class HoldCommissionDto {
  @IsUUID()
  jobId: string;
}

export class ConfirmCommissionDto {
  @IsUUID()
  jobId: string;

  @Matches(/^\d{6}$/)
  otp: string;
}

export class ReverseCommissionDto {
  @IsUUID()
  jobId: string;
}

export class WithdrawDto {
  @Type(() => Number)
  @IsNumber()
  @Min(100)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestId?: string;
}

export class VerifyTopUpDto {
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}