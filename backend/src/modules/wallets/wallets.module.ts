import { Module } from '@nestjs/common';
import { HotelWalletController } from './hotel-wallet.controller';
import { HotelWalletService } from './hotel-wallet.service';
import { WalletLedger } from './wallet-ledger';

@Module({
  controllers: [HotelWalletController],
  providers: [WalletLedger, HotelWalletService],
  exports: [WalletLedger],
})
export class WalletsModule {}
