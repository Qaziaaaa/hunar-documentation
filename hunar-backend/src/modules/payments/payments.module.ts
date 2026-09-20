import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { WalletService } from './wallet.service';
import { LedgerService } from './ledger.service';
import { WalletListener } from './wallet.listener';

@Module({
  controllers: [PaymentsController],
  providers: [WalletService, LedgerService, WalletListener],
  exports: [WalletService, LedgerService],
})
export class PaymentsModule {}