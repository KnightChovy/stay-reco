import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
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
  ],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantTools],
})
export class AssistantModule {}
