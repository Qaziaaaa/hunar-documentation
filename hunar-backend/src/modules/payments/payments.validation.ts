import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

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