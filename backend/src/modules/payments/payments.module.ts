import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { WalletsModule } from '../wallets/wallets.module';
import { DevPaymentsController } from './dev-payments.controller';
import { DevOnlyGuard } from './dev-only.guard';
import { PaymentConfirmationService } from './payment-confirmation.service';
import { SepayApiKeyGuard } from './sepay-api-key.guard';
import { SepayWebhookController } from './sepay-webhook.controller';
import { SepayWebhookService } from './sepay-webhook.service';

@Module({
  imports: [BookingsModule, WalletsModule],
  controllers: [DevPaymentsController, SepayWebhookController],
  providers: [
    PaymentConfirmationService,
    DevOnlyGuard,
    SepayWebhookService,
    SepayApiKeyGuard,
  ],
  exports: [PaymentConfirmationService],
})
export class PaymentsModule {}
