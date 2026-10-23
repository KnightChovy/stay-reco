import { Module } from '@nestjs/common';
import { PriceEngine } from './price-engine';
import { PricingRulesController } from './pricing-rules.controller';
import { PricingRulesService } from './pricing-rules.service';

@Module({
  controllers: [PricingRulesController],
  providers: [PricingRulesService, PriceEngine],
  exports: [PriceEngine],
})
export class PricingModule {}
