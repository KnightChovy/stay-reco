import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { PricingModule } from '../pricing/pricing.module';
import { WalletsModule } from '../wallets/wallets.module';
import { BookingsController } from './bookings.controller';
import { BookingCancellationService } from './booking-cancellation.service';
import { BookingMailer } from './booking-mailer';
import { BookingsService } from './bookings.service';
import { HoldExpiryService } from './hold-expiry.service';
import { HotelBookingsController } from './hotel-bookings.controller';
import { HotelBookingsService } from './hotel-bookings.service';
import { RefundDecisionsService } from './refund-decisions.service';
import { SepayPayment } from './sepay-payment';

@Module({
  imports: [PricingModule, AvailabilityModule, WalletsModule],
  controllers: [BookingsController, HotelBookingsController],
  providers: [
    BookingsService,
    BookingCancellationService,
    BookingMailer,
    HotelBookingsService,
    RefundDecisionsService,
    HoldExpiryService,
    SepayPayment,
  ],
  exports: [
    BookingsService,
    BookingMailer,
    HoldExpiryService,
    RefundDecisionsService,
  ],
})
export class BookingsModule {}
