import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CommissionsService } from './commissions.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { AdminVerifyDto, CommissionQueryDto, ScreenshotSubmitDto } from './commissions.validation';

@Controller()
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get('commissions/my')
  @Roles(Role.WORKER)
  getMyCommissions(@CurrentUser() user: JwtPayload, @Query() query: CommissionQueryDto) {
    return this.commissionsService.getMyCommissions(user.sub, query);
  }

  @Get('earnings/summary')
  @Roles(Role.WORKER)
  getEarningsSummary(@CurrentUser() user: JwtPayload) {
    return this.commissionsService.getEarningsSummary(user.sub);
  }

  @Get('commissions/:id')
  getCommission(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.commissionsService.getCommission(id, user);
  }

  @Put('commissions/:id/screenshot')
  @Roles(Role.WORKER)
  submitScreenshot(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScreenshotSubmitDto,
  ) {
    return this.commissionsService.submitScreenshot(id, user, dto);
  }

  @Put('commissions/:id/status')
  @Roles(Role.ADMIN)
  adminVerify(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminVerifyDto) {
    return this.commissionsService.adminVerify(id, dto);
  }
}
