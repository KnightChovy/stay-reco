import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletsModule } from '../wallets/wallets.module';
import { PayoutMailer } from './payout-mailer';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';

@Module({
  imports: [WalletsModule, NotificationsModule],
  controllers: [PayoutsController],
  providers: [PayoutsService, PayoutMailer],
})
export class PayoutsModule {}
