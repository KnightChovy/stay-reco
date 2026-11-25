import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { recommendationsResponseSchema } from '@stayreco/shared';
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

/** Hotels picked by the trained recommender (recommender/ at the repo root), newest run first. */
@ApiTags('recommendations')
@Controller()
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @ApiOperation({
    summary: 'Hotels recommended for me',
    description:
      "Ranked by the model trained on every guest's stays and reviews, with one line saying why each was picked. A customer the last training run did not know yet gets the signed-out list, with `personalized: false`. `items` is empty before the first run. Prices are base prices per night: availability for dates is checked on the hotel page.",
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
