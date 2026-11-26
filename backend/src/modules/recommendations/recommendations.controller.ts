import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  recommendationsResponseSchema,
  recommenderEvaluationResponseSchema,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiData } from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { RecommendationQueryDto } from './dto/recommendation.dto';
import { RecommendationsService } from './recommendations.service';
import { RecommenderEvaluationService } from './recommender-evaluation.service';

/** Hotels picked by the trained recommender (recommender/ at the repo root), newest run first. */
@ApiTags('recommendations')
@Controller()
export class RecommendationsController {
  constructor(
    private readonly recommendations: RecommendationsService,
    private readonly evaluation: RecommenderEvaluationService,
  ) {}

  @ApiOperation({
    summary: 'How well the served recommender does',
    description:
      'Admin only. The offline evaluation the served run made of itself (the paper\x27s cold-start split, full-catalogue ranking, K = 10) against content only, CF only, popularity and random, overall and by guests\x27 number of stays; where the served lists put their top 10 by how reviewed the hotels are (the long tail); and how many bookings of the last 30 days came from a recommendation.',
  })
  @ApiData(recommenderEvaluationResponseSchema)
  @Roles(UserRole.ADMIN)
  @Get('admin/recommender/evaluation')
  evaluate() {
    return this.evaluation.latest();
  }

  @ApiOperation({
    summary: 'Hotels recommended for me',
    description:
      "Ranked by the model trained on every guest's stays and reviews, with one line saying why each was picked. A customer the last training run does not know yet is ranked from their preferences (`source: PREFERENCES`) until the model scores them, seconds later. Each item carries `explanation` (the share and predicted rating of each part) and the answer a `profile` (what the list is built from). `items` is empty before the first run. Prices are base prices per night: availability for dates is checked on the hotel page.",
  })
  @ApiData(recommendationsResponseSchema)
  @Roles(UserRole.CUSTOMER)
  @Get('me/recommendations')
  mine(@CurrentUser() user: AuthUser, @Query() query: RecommendationQueryDto) {
    return this.recommendations.list(user.accountId, query);
  }

  @ApiOperation({
    summary: 'Recommended hotels for signed-out visitors',
    description:
      'Public. The best-rated hotels by the same model, for someone it knows nothing about. Signed-in customers should call `GET /me/recommendations`.',
  })
  @ApiData(recommendationsResponseSchema)
  @Public()
  @Get('recommendations')
  anonymous(@Query() query: RecommendationQueryDto) {
    return this.recommendations.list(null, query);
  }
}
