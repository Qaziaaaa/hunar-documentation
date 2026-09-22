import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MinLength(10)
  comment?: string;
}

/** Accepted by POST /reviews (Task 19) — job is supplied in the body. */
export class SubmitReviewByJobDto extends CreateReviewDto {
  @IsString()
  @IsUUID()
  jobId: string;
}

export class ReviewQueryDto {
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
