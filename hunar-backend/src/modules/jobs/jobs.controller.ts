import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ParseOrderCodePipe } from '../../common/helpers/order-code.util';
import { JobsService } from './jobs.service';
import {
  AvailableJobsQueryDto,
  CancelJobDto,
  CreateJobDto,
  CustomerJobsQueryDto,
} from './jobs.validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
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
    @Param('id', ParseOrderCodePipe) id: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    return this.jobsService.getJobDetail(id, user, Number(lat), Number(lng));
  }

  @Put(':id/cancel')
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseOrderCodePipe) id: string,
    @Body() dto: CancelJobDto,
  ) {
    return this.jobsService.cancelJob(id, user, dto);
  }

  @Put(':id/complete')
  @Roles(Role.WORKER, Role.ADMIN)
  complete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseOrderCodePipe) id: string,
  ) {
    return this.jobsService.completeJob(id, user);
  }
}

/** Task 23 — the assigned worker's active jobs (non-terminal states). */
@Controller('workers/me/jobs')
export class WorkerJobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('active')
  @Roles(Role.WORKER)
  getActive(@CurrentUser() user: JwtPayload, @Query() query: CustomerJobsQueryDto) {
    return this.jobsService.getActiveJobs(user.sub, query);
  }

  @Get('history')
  @Roles(Role.WORKER)
  getHistory(@CurrentUser() user: JwtPayload, @Query() query: CustomerJobsQueryDto) {
    return this.jobsService.getHistoryJobs(user.sub, query);
  }
}

/** Public service categories directory */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly jobsService: JobsService) {}

  @Public()
  @Get()
  getCategories() {
    return this.jobsService.getCategories();
  }
}

/** Customer and Worker disputes & support tickets */
@Controller('disputes')
export class DisputesController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(Role.CUSTOMER, Role.WORKER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.jobsService.createDispute(user.sub, dto);
  }

  @Get('my')
  @Roles(Role.CUSTOMER, Role.WORKER)
  getMyDisputes(@CurrentUser() user: JwtPayload) {
    return this.jobsService.getMyDisputes(user.sub);
  }
}

