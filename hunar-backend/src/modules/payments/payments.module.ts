import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WalletService } from './wallet.service';
import { LedgerService } from './ledger.service';
import { WalletListener } from './wallet.listener';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, WalletService, LedgerService, WalletListener],
  exports: [PaymentsService, WalletService, LedgerService],
})
export class PaymentsModule {}
