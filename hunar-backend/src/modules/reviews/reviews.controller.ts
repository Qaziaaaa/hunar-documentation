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
  @Roles(Role.CUSTOMER, Role.WORKER)
  create(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(jobId, user.sub, dto);
  }

  /** Task 19 — POST /reviews, job id in body (allows both customer and worker reviews). */
  @Post('reviews')
  @Roles(Role.CUSTOMER, Role.WORKER)
  submit(@CurrentUser() user: JwtPayload, @Body() dto: SubmitReviewByJobDto) {
    return this.reviewsService.createReview(dto.jobId, user.sub, dto);
  }

  @Get('jobs/:jobId/reviews')
  getJobReviews(@Param('jobId') jobId: string, @Query() query: ReviewQueryDto) {
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

  @Get('reviews/user/:userId')
  getUserReviews(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.getReviewsForUser(userId, query);
  }
}
