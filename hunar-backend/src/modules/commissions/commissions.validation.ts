import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ScreenshotSubmitDto {
  @IsString()
  screenshotUrl: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminVerifyDto {
  @IsIn(['RECEIVED', 'VERIFIED'])
  status: 'RECEIVED' | 'VERIFIED';
}

export class CommissionQueryDto {
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
  @IsIn(['PENDING', 'RECEIVED', 'VERIFIED'])
  status?: string;
}
