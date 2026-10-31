import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { PricingModule } from '../pricing/pricing.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletsModule } from '../wallets/wallets.module';
import { BookingsController } from './bookings.controller';
import { BookingCancellationService } from './booking-cancellation.service';
import { BookingMailer } from './booking-mailer';
import { BookingsService } from './bookings.service';
import { ChangeRequestsController } from './change-requests.controller';
import { ChangeRequestsService } from './change-requests.service';
import { FrontDeskController } from './front-desk.controller';
import { FrontDeskService } from './front-desk.service';
import { HoldExpiryService } from './hold-expiry.service';
import { HotelBookingsController } from './hotel-bookings.controller';
import { HotelBookingsService } from './hotel-bookings.service';
import { NoShowService } from './no-show.service';
import { RefundDecisionsService } from './refund-decisions.service';
import { SepayPayment } from './sepay-payment';
import { SettlementService } from './settlement.service';

@Module({
  imports: [
    PricingModule,
    AvailabilityModule,
    WalletsModule,
    NotificationsModule,
  ],
  controllers: [
    BookingsController,
    HotelBookingsController,
    FrontDeskController,
    ChangeRequestsController,
  ],
  providers: [
    BookingsService,
    BookingCancellationService,
    BookingMailer,
    ChangeRequestsService,
    FrontDeskService,
    HotelBookingsService,
    RefundDecisionsService,
    HoldExpiryService,
    NoShowService,
    SepayPayment,
    SettlementService,
  ],
  exports: [
    BookingsService,
    BookingMailer,
    HoldExpiryService,
    RefundDecisionsService,
  ],
})
export class BookingsModule {}
