import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { PricingModule } from '../pricing/pricing.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { StaysController } from './stays.controller';
import { StaysService } from './stays.service';

@Module({
  imports: [PricingModule, AvailabilityModule, RecommendationsModule],
  controllers: [StaysController],
  providers: [StaysService],
  exports: [StaysService],
})
export class StaysModule {}
