import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { partnerPortfolioResponseSchema } from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiData } from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { StatsRangeQueryDto } from './dto/stats.dto';
import { PortfolioService } from './portfolio.service';

/** The partner dashboard over all the partner's hotels (docs/api/partner-dashboard.md §4.7, BR-21). */
@ApiTags('dashboard')
@Controller('me/hotels')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Roles(UserRole.HOTEL_PARTNER)
  @ApiOperation({
    summary: 'Every hotel of the signed-in partner over a period',
    description:
      'Each hotel (drafts included, by name) with its room revenue, net received and occupancy compared with the previous period, the average rating of the period and its open action items by severity; plus the totals, whose occupancy comes from the summed room nights. Same `from` / `to` as `stats/overview`. Also while the partner is suspended.',
  })
  @ApiData(partnerPortfolioResponseSchema)
  @Get('stats')
  stats(@CurrentUser() user: AuthUser, @Query() query: StatsRangeQueryDto) {
    return this.portfolio.portfolio(user.accountId, query);
  }
}
