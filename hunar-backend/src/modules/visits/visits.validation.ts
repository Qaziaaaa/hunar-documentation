import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class StartVisitDto {
  @IsDateString()
  scheduledTime: string;
}

export class InspectionDto {
  @IsString()
  diagnosis: string;

  @IsString()
  repairPlan: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  repairEstimate: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  inspectionPhotos?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estimatedRepairTimeMin?: number;
}

export class VisitQueryDto {
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
  @IsEnum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
  status?: string;
}

export class TrackLocationDto {
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  live?: boolean;
}
