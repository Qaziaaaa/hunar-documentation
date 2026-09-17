import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { CreateReviewDto, ReviewQueryDto } from './reviews.validation';

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

  @Get('jobs/:jobId/reviews')
  getJobReviews(@Param('jobId', ParseUUIDPipe) jobId: string, @Query() query: ReviewQueryDto) {
    return this.reviewsService.getJobReviews(jobId, query);
  }

  @Get('reviews/worker/:workerId')
  getWorkerReviews(
    @Param('workerId', ParseUUIDPipe) workerId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.getWorkerReviews(workerId, query);
  }
}
