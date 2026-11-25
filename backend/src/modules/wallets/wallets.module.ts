import { Module, forwardRef } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { CustomerWalletController } from './customer-wallet.controller';
import { CustomerWalletService } from './customer-wallet.service';
import { HotelWalletController } from './hotel-wallet.controller';
import { HotelWalletService } from './hotel-wallet.service';
import { WalletLedger } from './wallet-ledger';
import { WalletPaymentService } from './wallet-payment.service';

@Module({
  // The wallet pays a booking, and bookings move money through the ledger: the two modules need each other.
  imports: [forwardRef(() => BookingsModule)],
  controllers: [HotelWalletController, CustomerWalletController],
  providers: [
    WalletLedger,
    HotelWalletService,
    CustomerWalletService,
    WalletPaymentService,
  ],
  exports: [WalletLedger],
})
export class WalletsModule {}
