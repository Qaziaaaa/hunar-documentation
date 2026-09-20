import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaymentGateway, PaymentMethod } from '@prisma/client';

/** Customer initiates a Payment for a completed job (Module 3 — Payments Backend). */
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
