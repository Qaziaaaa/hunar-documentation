import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { WalletService } from './wallet.service';
import {
  ConfirmCommissionDto,
  HoldCommissionDto,
  ReverseCommissionDto,
  TopUpDto,
  VerifyTopUpDto,
  WalletQueryDto,
  WithdrawDto,
} from './wallet.validation';

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Post('topup')
  @Roles(Role.WORKER)
  topUp(@CurrentUser() user: JwtPayload, @Body() dto: TopUpDto) {
    return this.wallet.requestTopUp(user.sub, dto);
  }

  @Get('topup/status')
  @Roles(Role.WORKER)
  topUpStatus(@CurrentUser() user: JwtPayload, @Query() query: WalletQueryDto) {
    return this.wallet.getTopUpStatus(user.sub, query);
  }

  @Get('balance')
  @Roles(Role.WORKER)
  balance(@CurrentUser() user: JwtPayload) {
    return this.wallet.getBalance(user.sub);
  }

  @Get('ledger')
  @Roles(Role.WORKER)
  ledger(@CurrentUser() user: JwtPayload, @Query() query: WalletQueryDto) {
    return this.wallet.getLedger(user.sub, query);
  }

  @Post('hold-commission')
  @Roles(Role.WORKER)
  holdCommission(@CurrentUser() user: JwtPayload, @Body() dto: HoldCommissionDto) {
    return this.wallet.holdCommission({ jobId: dto.jobId, workerId: user.sub });
  }

  @Post('confirm-commission')
  @Roles(Role.WORKER)
  confirmCommission(@CurrentUser() user: JwtPayload, @Body() dto: ConfirmCommissionDto) {
    return this.wallet.confirmCommission(user.sub, dto);
  }

  @Post('reverse-commission')
  @Roles(Role.WORKER)
  reverseCommission(@CurrentUser() user: JwtPayload, @Body() dto: ReverseCommissionDto) {
    return this.wallet.reverseCommission(dto.jobId, user.sub);
  }

  @Post('withdraw')
  @Roles(Role.WORKER)
  withdraw(@CurrentUser() user: JwtPayload, @Body() dto: WithdrawDto) {
    return this.wallet.withdraw(user.sub, dto);
  }

  @Put('topup/:id/verify')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  verifyTopUp(@Param('id', ParseUUIDPipe) id: string, @Body() dto: VerifyTopUpDto) {
    return this.wallet.verifyTopUp(id, dto.action, dto.note);
  }
}

@Controller('platform-wallet')
export class PlatformWalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get('balance')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  platformBalance() {
    return this.wallet.getPlatformBalance();
  }
}
