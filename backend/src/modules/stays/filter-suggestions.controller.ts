import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { filterSuggestionResponseSchema, z } from '@stayreco/shared';
import {
  CurrentUser,
  type AuthUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiData } from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { HotelSearchQueryDto } from './dto/stay.dto';
import { FilterSuggestions } from './filter-suggestions.service';

@ApiTags('search')
@Controller()
export class FilterSuggestionsController {
  constructor(private readonly suggestions: FilterSuggestions) {}

  @ApiOperation({
    summary: 'Search filters suggested to me',
    description:
      'Customer only. Takes the same query as `GET /hotels` and returns up to 4 filters to offer above the results, best first: a filter is scored by how likely this customer wants it (their preferences, what most of the stays they rated 4★ or more share, free cancellation when booking 30 days or more ahead) times how much it concentrates the hotels the recommender ranks best for them (one that keeps a smaller share of them is left out). A filter already applied, one that would not narrow the search, or one that would leave fewer than 3 hotels is never suggested. Nothing is applied: the customer taps one and the search applies it as any filter. Empty when there is nothing worth suggesting.',
  })
  @ApiData(z.array(filterSuggestionResponseSchema))
  @Roles(UserRole.CUSTOMER)
  @Header('Cache-Control', 'private, no-store')
  @Get('me/filter-suggestions')
  suggest(@CurrentUser() user: AuthUser, @Query() query: HotelSearchQueryDto) {
    return this.suggestions.suggest(query, user.accountId);
  }
}
