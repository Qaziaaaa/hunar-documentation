import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class RepairEstimateDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsObject()
  itemsBreakdown?: Record<string, unknown>;
}

export class RepairCounterDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RepairAcceptDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;
}

export class RepairRevisionDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class RepairRevisionDecisionDto {
  @IsString()
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';
}

export class RepairQueryDto {
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
  @IsIn(['PROPOSED', 'COUNTERED', 'ACCEPTED', 'REJECTED'])
  status?: string;
}

export class RepairIdParams {
  @IsUUID()
  id: string;
}

export class VisitIdParams {
  @IsUUID()
  visitId: string;
}
