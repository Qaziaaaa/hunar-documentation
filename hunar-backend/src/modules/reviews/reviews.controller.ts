import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { CreateReviewDto, ReviewQueryDto, SubmitReviewByJobDto } from './reviews.validation';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('jobs/:jobId/review')
  @Roles(Role.CUSTOMER)
  create(
    @CurrentUser() user: JwtPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(jobId, user.sub, dto);
  }

  /** Task 19 — POST /reviews, job id in body (documented customer contract). */
  @Post('reviews')
  @Roles(Role.CUSTOMER)
  submit(@CurrentUser() user: JwtPayload, @Body() dto: SubmitReviewByJobDto) {
    return this.reviewsService.createReview(dto.jobId, user.sub, dto);
  }

  @Get('jobs/:jobId/reviews')
  getJobReviews(@Param('jobId', ParseUUIDPipe) jobId: string, @Query() query: ReviewQueryDto) {
    return this.reviewsService.getJobReviews(jobId, query);
  }

  /** Task 20 — my reviews (as the reviewing customer). */
  @Get('reviews/customer')
  @Roles(Role.CUSTOMER)
  myReviews(@CurrentUser() user: JwtPayload, @Query() query: ReviewQueryDto) {
    return this.reviewsService.getCustomerReviews(user.sub, query);
  }

  @Get('reviews/worker/:workerId')
  getWorkerReviews(
    @Param('workerId', ParseUUIDPipe) workerId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.getWorkerReviews(workerId, query);
  }

  /** Task 21 — GET /workers/[id]/reviews (documented customer contract). */
  @Get('workers/:workerId/reviews')
  workerReviews(
    @Param('workerId', ParseUUIDPipe) workerId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.getWorkerReviews(workerId, query);
  }
}
