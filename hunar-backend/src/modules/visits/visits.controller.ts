import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { VisitsService } from './visits.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { InspectionDto, StartVisitDto, TrackLocationDto, VisitQueryDto } from './visits.validation';

@Controller()
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get('visits/my')
  getMyVisits(@CurrentUser() user: JwtPayload, @Query() query: VisitQueryDto) {
    return this.visitsService.getMyVisits(user, query);
  }

  @Get('visits/:id')
  getVisit(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.visitsService.getVisit(id, user);
  }

  @Put('visits/:id/schedule')
  @Roles(Role.WORKER)
  schedule(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartVisitDto,
  ) {
    return this.visitsService.rescheduleVisit(id, user, new Date(dto.scheduledTime));
  }

  @Put('visits/:id/start')
  @Roles(Role.WORKER)
  start(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.visitsService.startVisit(id, user);
  }

  @Put('visits/:id/arrived')
  @Roles(Role.WORKER)
  arrived(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.visitsService.workerArrived(id, user);
  }

  @Put('visits/:id/inspection')
  @Roles(Role.WORKER)
  inspection(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InspectionDto,
  ) {
    return this.visitsService.submitInspection(id, user, dto);
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
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Query('limit') limit?: number,
  ) {
    return this.visitsService.getLocationHistory(jobId, user, Number(limit) || 100);
  }
}
