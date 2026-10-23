import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { WalletsModule } from '../wallets/wallets.module';
import { DevPaymentsController } from './dev-payments.controller';
import { DevOnlyGuard } from './dev-only.guard';
import { PaymentConfirmationService } from './payment-confirmation.service';

@Module({
  imports: [BookingsModule, WalletsModule],
  controllers: [DevPaymentsController],
  providers: [PaymentConfirmationService, DevOnlyGuard],
  exports: [PaymentConfirmationService],
})
export class PaymentsModule {}
