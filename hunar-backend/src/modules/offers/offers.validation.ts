import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateOfferDto {
  /** Worker's proposed visit charge (Rs). Price is locked on acceptance. */
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  visitCharge: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CounterOfferDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  visitCharge: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RespondOfferDto {
  /** Accepted offer price (Rs) — the counter/response total for counteroffers. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  visitCharge?: number;
}

export class OfferListQueryDto {
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
  @IsIn(['PENDING', 'VIEWING', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'])
  status?: string;

  @IsOptional()
  @IsString()
  jobId?: string;
}
