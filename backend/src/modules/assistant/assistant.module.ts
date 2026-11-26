import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { WalletsModule } from '../wallets/wallets.module';
import { MarketingModule } from '../marketing/marketing.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { StaysModule } from '../stays/stays.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantTools } from './assistant.tools';

@Module({
  imports: [
    MarketingModule,
    StaysModule,
    BookingsModule,
    RecommendationsModule,
    PromotionsModule,
    LoyaltyModule,
    WalletsModule,
  ],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantTools],
})
export class AssistantModule {}
