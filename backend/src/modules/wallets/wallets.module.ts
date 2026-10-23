import { Module } from '@nestjs/common';
import { WalletLedger } from './wallet-ledger';

@Module({
  providers: [WalletLedger],
  exports: [WalletLedger],
})
export class WalletsModule {}
