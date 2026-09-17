import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RepairService } from './repair.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import {
  RepairAcceptDto,
  RepairCounterDto,
  RepairEstimateDto,
  RepairQueryDto,
  RepairRevisionDto,
} from './repair.validation';

@Controller()
export class RepairController {
  constructor(private readonly repairService: RepairService) {}

  @Get('repairs/my')
  getMyRepairs(@CurrentUser() user: JwtPayload, @Query() query: RepairQueryDto) {
    return this.repairService.getMyRepairs(user, query);
  }

  @Get('repairs/:id')
  getRepair(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.repairService.getRepairDetail(id, user);
  }

  @Post('visits/:visitId/estimate')
  @Roles(Role.WORKER)
  estimate(
    @CurrentUser() user: JwtPayload,
    @Param('visitId', ParseUUIDPipe) visitId: string,
    @Body() dto: RepairEstimateDto,
  ) {
    return this.repairService.createEstimate(visitId, user, dto);
  }

  @Put('repairs/:id/counter')
  counter(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RepairCounterDto,
  ) {
    return this.repairService.counterRepair(id, user, dto);
  }

  @Put('repairs/:id/accept')
  @Roles(Role.CUSTOMER)
  accept(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RepairAcceptDto,
  ) {
    return this.repairService.acceptRepair(id, user, dto);
  }

  @Put('repairs/:id/reject')
  @Roles(Role.CUSTOMER)
  reject(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.repairService.rejectRepair(id, user);
  }

  @Put('repairs/:id/start')
  @Roles(Role.WORKER)
  start(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.repairService.startRepair(id, user);
  }

  @Put('repairs/:id/complete')
  @Roles(Role.WORKER)
  complete(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.repairService.completeRepair(id, user);
  }

  @Post('repairs/:id/revision')
  @Roles(Role.WORKER)
  requestRevision(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RepairRevisionDto,
  ) {
    return this.repairService.requestRevision(id, user, dto);
  }

  @Put('repairs/:id/revision/:revisionId')
  decideRevision(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('revisionId', ParseUUIDPipe) revisionId: string,
    @Body() dto: { action: 'approve' | 'reject' },
  ) {
    return this.repairService.decideRevision(id, revisionId, user, dto.action);
  }
}
