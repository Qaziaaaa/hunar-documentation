import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaymentGateway, PaymentMethod } from '@prisma/client';


/** Customer initiates a Payment for a completed job (Module 3 ΓÇö Payments Backend). */
export class CreatePaymentDto {
  /** Job this payment settles. The service derives customer/worker/visitCharge from it. */
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  /** Gateway is required for non-COD methods (CARD / MOBILE_WALLET). */
  @ValidateIf((o) => o.method !== PaymentMethod.COD)
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  /** Optional override of the amount to pay (defaults to visitCharge + amount from the job). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CustomerPaymentsQueryDto {
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

  @IsOptional()
  @IsEnum(['INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'])
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Boolean)
  onlyPending?: boolean;
}

const TOPUP_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
const LEDGER_TYPES = [
  'COMMISSION_HELD',
  'COMMISSION_RELEASED',
  'COMMISSION_DEDUCTED',
  'TOPUP_CREDIT',
  'EARNINGS_CREDIT',
] as const;

export class TopupDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  screenshotUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class TopupQueryDto {
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

  @IsOptional()
  @IsIn(TOPUP_STATUSES)
  status?: (typeof TOPUP_STATUSES)[number];
}

export class WalletLedgerQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsIn(LEDGER_TYPES)
  type?: (typeof LEDGER_TYPES)[number];
}

export class JobActionDto {
  @IsString()
  @IsNotEmpty()
  jobId: string;
}

export class TopupDecideDto {
  @IsIn(['APPROVED', 'REJECTED'])
  action: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
