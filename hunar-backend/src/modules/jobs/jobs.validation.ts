import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { JobStatus, Urgency } from '@prisma/client';

export function IsFutureOrPresentDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFutureOrPresentDate',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} must not be in the past`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (!value) return true;
          const date = new Date(value);
          if (isNaN(date.getTime())) return false;
          // Allow 5 minutes clock-skew grace period
          const nowWithGrace = new Date(Date.now() - 5 * 60 * 1000);
          return date >= nowWithGrace;
        },
      },
    });
  };
}

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  voiceNoteUrl?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsEnum(Urgency)
  urgency?: Urgency;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  suggestedVisitCharge?: number;

  @IsOptional()
  @IsDateString()
  @IsFutureOrPresentDate()
  preferredVisitTime?: string;
}

export class CancelJobDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CustomerJobsQueryDto {
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsString()
  tab?: string;

  @IsOptional()
  @IsString()
  scheduleType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class AvailableJobsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  /** Search radius in kilometers (default 10). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  radiusKm?: number;

  /** Worker skill / category filter. */
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  city?: string;

  /** Suggested visit charge range (Rs). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minCharge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxCharge?: number;

  /** Only jobs posted within the last N minutes. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  postedWithinMin?: number;

  /** Only jobs that have no offers yet. */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasNoOffers?: boolean;

  /** Filter by worker relevance (categories/skills). When false, returns all categories. */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  onlyRelevant?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
