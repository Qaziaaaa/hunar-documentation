import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import {
  JobActionDto,
  TopupDecideDto,
  TopupDto,
  TopupQueryDto,
  WalletLedgerQueryDto,
} from './payments.validation';
import { WalletService } from './wallet.service';

// Task 7 — Worker Wallet. All money endpoints are worker-scoped; the only
// admin route is the top-up decision (Approve/Reject).
@Controller()
export class PaymentsController {
  constructor(private readonly wallet: WalletService) {}

  // ----- Wallet balance & ledger -----

  @Get('wallet/balance')
  @Roles(Role.WORKER)
  balance(@CurrentUser() user: JwtPayload) {
    return this.wallet.getBalance(user.sub);
  }

  @Get('wallet/ledger')
  @Roles(Role.WORKER)
  ledger(@CurrentUser() user: JwtPayload, @Query() query: WalletLedgerQueryDto) {
    return this.wallet.getLedger(user.sub, query);
  }

  @Get('workers/me/earnings')
  @Roles(Role.WORKER)
  earnings(@CurrentUser() user: JwtPayload) {
    return this.wallet.getEarningsSummary(user.sub);
  }

  // ----- Top-ups -----

  @Post('wallet/topup')
  @Roles(Role.WORKER)
  topup(@CurrentUser() user: JwtPayload, @Body() dto: TopupDto) {
    return this.wallet.submitTopup(user.sub, dto);
  }

  @Get('wallet/topup/status')
  @Roles(Role.WORKER)
  topupStatus(@CurrentUser() user: JwtPayload, @Query() query: TopupQueryDto) {
    return this.wallet.getMyTopups(user.sub, query);
  }

  @Put('wallet/topups/:id/status')
  @Roles(Role.ADMIN)
  decideTopup(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TopupDecideDto,
  ) {
    return this.wallet.decideTopup(id, user.sub, dto);
  }

  // ----- Commission lifecycle (idempotent, Redis-keyed) -----

  @Post('wallet/hold-commission')
  @Roles(Role.WORKER)
  holdCommission(@CurrentUser() user: JwtPayload, @Body() dto: JobActionDto) {
    return this.wallet.holdCommissionForJob(user.sub, dto.jobId);
  }

  @Post('wallet/confirm-commission')
  @Roles(Role.WORKER)
  confirmCommission(@CurrentUser() user: JwtPayload, @Body() dto: JobActionDto & { commissionId?: string }) {
    const commissionId = dto.commissionId ?? dto.jobId;
    return this.wallet.confirmCommission(dto.jobId, commissionId);
  }

  @Post('wallet/reverse-commission')
  @Roles(Role.WORKER)
  reverseCommission(@CurrentUser() user: JwtPayload, @Body() dto: JobActionDto) {
    return this.wallet.reverseCommissionForJob(dto.jobId);
  }

  // ----- Admin: platform wallet inspection -----

  @Get('admin/wallet/platform')
  @Roles(Role.ADMIN)
  platformWallet() {
    return this.wallet.getPlatformWallet();
  }
}