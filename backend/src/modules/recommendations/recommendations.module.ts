import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { ModelRefreshService } from './model-refresh.service';
import { PreferenceRanking } from './preference-ranking';
import { RecommendationProfiles } from './recommendation-profile';
import { RecommenderEvaluationService } from './recommender-evaluation.service';
import { RecommendationsService } from './recommendations.service';

@Module({
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    PreferenceRanking,
    RecommendationProfiles,
    RecommenderEvaluationService,
    ModelRefreshService,
  ],
  exports: [RecommendationsService, ModelRefreshService],
})
export class RecommendationsModule {}
