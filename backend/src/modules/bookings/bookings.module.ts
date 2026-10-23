import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { PricingModule } from '../pricing/pricing.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { HoldExpiryService } from './hold-expiry.service';
import { SepayPayment } from './sepay-payment';

@Module({
  imports: [PricingModule, AvailabilityModule],
  controllers: [BookingsController],
  providers: [BookingsService, HoldExpiryService, SepayPayment],
  exports: [BookingsService, HoldExpiryService],
})
export class BookingsModule {}
