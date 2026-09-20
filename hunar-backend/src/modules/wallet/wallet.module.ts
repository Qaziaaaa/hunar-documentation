import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletController, PlatformWalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [AuthModule],
  controllers: [WalletController, PlatformWalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}