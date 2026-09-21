import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import {
  AvailableJobsQueryDto,
  CancelJobDto,
  CreateJobDto,
  CustomerJobsQueryDto,
} from './jobs.validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { Role } from '@prisma/client';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateJobDto) {
    return this.jobsService.createJob(user.sub, dto);
  }

  @Get('available')
  @Roles(Role.WORKER)
  getAvailable(@CurrentUser() user: JwtPayload, @Query() query: AvailableJobsQueryDto) {
    return this.jobsService.getAvailableJobs(user, query);
  }

  @Get('customer')
  @Roles(Role.CUSTOMER)
  getCustomerJobs(@CurrentUser() user: JwtPayload, @Query() query: CustomerJobsQueryDto) {
    return this.jobsService.getCustomerJobs(user.sub, query);
  }

  @Get(':id')
  getDetail(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return this.jobsService.getJobDetail(id, user, Number(lat), Number(lng));
  }

  @Put(':id/cancel')
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelJobDto,
  ) {
    return this.jobsService.cancelJob(id, user, dto);
  }
}
