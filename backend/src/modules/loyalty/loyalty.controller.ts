import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  loyaltyAccountResponseSchema,
  loyaltyEntryResponseSchema,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  ApiData,
  ApiErrors,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { LoyaltyEntryQueryDto } from './dto/loyalty.dto';
import { LoyaltyService } from './loyalty.service';

/** The platform-wide loyalty programme as a customer sees it (BR-11). */
@ApiTags('loyalty')
@Controller()
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @ApiOperation({
    summary: 'My points, tier and what the balance is worth',
    description:
      'The account is opened on first read, so a customer who has never earned anything sees a balance of 0 rather than an error. `tier` comes from `lifetimePoints`, which spending never lowers; `nextTier` is what is left to the next one, and null at the top. `balanceValue` is the balance in dong at the programme rate.',
  })
  @ApiData(loyaltyAccountResponseSchema)
  @ApiErrors(ErrorCode.LOYALTY_PROGRAM_NOT_FOUND)
  @Roles(UserRole.CUSTOMER)
  @Get('me/loyalty')
  account(@CurrentUser() user: AuthUser) {
    return this.loyalty.account(user.accountId);
  }

  @ApiOperation({
    summary: 'My points history',
    description:
      'Newest first. `kind` is `EARNED` at check-out, `SPENT` when a booking used points, or `REFUNDED` when such a booking never became a stay. `points` is positive when credited and negative when spent.',
  })
  @ApiPage(loyaltyEntryResponseSchema)
  @Roles(UserRole.CUSTOMER)
  @Get('me/loyalty/entries')
  entries(@CurrentUser() user: AuthUser, @Query() query: LoyaltyEntryQueryDto) {
    return this.loyalty.entries(user.accountId, query);
  }
}
