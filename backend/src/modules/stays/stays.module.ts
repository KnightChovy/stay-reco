import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { PricingModule } from '../pricing/pricing.module';
import { StaysController } from './stays.controller';
import { StaysService } from './stays.service';

@Module({
  imports: [PricingModule, AvailabilityModule],
  controllers: [StaysController],
  providers: [StaysService],
})
export class StaysModule {}
