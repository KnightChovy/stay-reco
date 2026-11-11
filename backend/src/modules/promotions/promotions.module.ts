import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module';
import { DiscountService } from './discount.service';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { StayDiscountService } from './stay-discount.service';

@Module({
  imports: [PricingModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, DiscountService, StayDiscountService],
  exports: [DiscountService, StayDiscountService],
})
export class PromotionsModule {}
