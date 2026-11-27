import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { PricingModule } from '../pricing/pricing.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { FilterSuggestionsController } from './filter-suggestions.controller';
import { FilterSuggestions } from './filter-suggestions.service';
import { StaysController } from './stays.controller';
import { StaysService } from './stays.service';

@Module({
  imports: [PricingModule, AvailabilityModule, RecommendationsModule],
  controllers: [StaysController, FilterSuggestionsController],
  providers: [StaysService, FilterSuggestions],
  exports: [StaysService],
})
export class StaysModule {}
