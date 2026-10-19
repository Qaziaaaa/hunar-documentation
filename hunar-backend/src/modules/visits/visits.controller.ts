import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { VisitsService } from './visits.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import {
  InspectionDto,
  StartVisitDto,
  TrackLocationDto,
  VerifyArrivalOtpDto,
  VisitQueryDto,
} from './visits.validation';
import { ParseOrderCodePipe } from '../../common/helpers/order-code.util';

@Controller()
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get('visits/my')
  getMyVisits(@CurrentUser() user: JwtPayload, @Query() query: VisitQueryDto) {
    return this.visitsService.getMyVisits(user, query);
  }

  @Get('visits/:id')
  getVisit(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.visitsService.getVisit(id, user);
  }

  @Put('visits/:id/schedule')
  @Roles(Role.WORKER)
  schedule(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: StartVisitDto,
  ) {
    return this.visitsService.rescheduleVisit(id, user, new Date(dto.scheduledTime));
  }

  @Put('visits/:id/start')
  @Roles(Role.WORKER)
  start(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.visitsService.startVisit(id, user);
  }

  @Put('jobs/:jobId/start')
  @Roles(Role.WORKER)
  startByJob(
    @CurrentUser() user: JwtPayload,
    @Param('jobId', ParseOrderCodePipe) jobId: string,
  ) {
    return this.visitsService.startVisit(jobId, user);
  }

  @Put('visits/:id/arrived')
  @Roles(Role.WORKER)
  arrived(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body?: { otp?: string },
  ) {
    return this.visitsService.workerArrived(id, user, body?.otp);
  }

  @Put('jobs/:jobId/arrived')
  @Roles(Role.WORKER)
  arrivedByJob(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
    @Body() body?: { otp?: string },
  ) {
    return this.visitsService.workerArrived(jobId, user, body?.otp);
  }

  @Put('visits/:id/verify-arrival-otp')
  verifyArrivalOtp(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: VerifyArrivalOtpDto,
  ) {
    return this.visitsService.verifyArrivalOtp(id, user, dto.otp);
  }

  @Put('jobs/:jobId/verify-arrival-otp')
  verifyJobArrivalOtp(
    @CurrentUser() user: JwtPayload,
    @Param('jobId', ParseOrderCodePipe) jobId: string,
    @Body() dto: VerifyArrivalOtpDto,
  ) {
    return this.visitsService.verifyArrivalOtp(jobId, user, dto.otp);
  }

  @Put('visits/:id/inspection')
  @Roles(Role.WORKER)
  inspection(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: InspectionDto,
  ) {
    return this.visitsService.submitInspection(id, user, dto);
  }

  @Put('jobs/:jobId/inspection')
  @Roles(Role.WORKER)
  inspectionByJob(
    @CurrentUser() user: JwtPayload,
    @Param('jobId', ParseOrderCodePipe) jobId: string,
    @Body() dto: InspectionDto,
  ) {
    return this.visitsService.submitInspection(jobId, user, dto);
  }

  /** Task 22 — job-level inspection report (customer views, worker can re-read). */
  @Get('jobs/:jobId/inspection')
  jobInspection(
    @CurrentUser() user: JwtPayload,
    @Param('jobId', ParseOrderCodePipe) jobId: string,
  ) {
    return this.visitsService.getJobInspection(jobId, user);
  }

  @Post('location/track')
  @Roles(Role.WORKER)
  track(
    @CurrentUser() user: JwtPayload,
    @Query('jobId') jobId: string | undefined,
    @Body() dto: TrackLocationDto,
  ) {
    return this.visitsService.trackLocation(user, jobId ?? undefined, dto);
  }

  @Put('workers/me/location')
  @Roles(Role.WORKER)
  updateMyLocation(@CurrentUser() user: JwtPayload, @Body() dto: TrackLocationDto) {
    return this.visitsService.trackLocation(user, undefined, dto);
  }

  @Get('location/track/:jobId')
  history(
    @CurrentUser() user: JwtPayload,
    @Param('jobId', ParseOrderCodePipe) jobId: string,
    @Query('limit') limit?: number,
  ) {
    return this.visitsService.getLocationHistory(jobId, user, Number(limit) || 100);
  }
}
