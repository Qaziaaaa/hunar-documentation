import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { IsOrderCode } from '../../common/helpers/order-code.util';

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/** Accepted by POST /reviews (Task 19) — job is supplied in the body. */
export class SubmitReviewByJobDto extends CreateReviewDto {
  @IsString()
  @IsOrderCode()
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
