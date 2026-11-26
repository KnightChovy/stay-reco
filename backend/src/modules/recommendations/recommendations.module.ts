import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { PreferenceRanking } from './preference-ranking';
import { RecommendationsService } from './recommendations.service';

@Module({
  controllers: [RecommendationsController],
  providers: [RecommendationsService, PreferenceRanking],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
