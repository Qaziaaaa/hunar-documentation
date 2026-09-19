import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateMyProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  avatarUrl?: string;
}

// Step 1 (basic information), Step 2 (skills/categories) and Step 3 (experience & bio)
// are saved through one composite endpoint so the wizard can persist each step as it is completed.
export class UpdateWorkerProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  skills?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}

export class UpdateAvailabilityDto {
  @IsBoolean()
  isAvailable: boolean;
}

export class ServiceAreaInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  label: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

// Step 4 — the worker's full set of service areas (replace semantics).
export class UpdateServiceAreasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceAreaInputDto)
  serviceAreas: ServiceAreaInputDto[];
}

export class DocumentInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;
}

// Step 5 — CNIC front/back are required; certificate is optional.
export class UpdateDocumentsDto {
  @ValidateNested()
  @Type(() => DocumentInputDto)
  cnicFront: DocumentInputDto;

  @ValidateNested()
  @Type(() => DocumentInputDto)
  cnicBack: DocumentInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentInputDto)
  certificate?: DocumentInputDto;
}
