import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  hotelLoyaltyProgramResponseSchema,
  loyaltyAccountResponseSchema,
  loyaltyEntryResponseSchema,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import {
  ReqMeta,
  type RequestMeta,
} from '../../common/decorators/request-meta.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import {
  ApiData,
  ApiErrors,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import {
  HotelLoyaltyProgramDto,
  LoyaltyEntryQueryDto,
} from './dto/loyalty.dto';
import { LoyaltyService } from './loyalty.service';

/** The platform-wide loyalty programme as a customer sees it (BR-11), and the rules a hotel adds on top (L8–L11). */
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

  @ApiOperation({
    summary: "The hotel's own loyalty rules",
    description:
      "What applies to stays at this hotel on top of the platform programme: the earning rate, whether points are taken and the share of a stay they may pay. While the hotel has saved nothing, `custom` is false and the platform rules are shown. `limits` gives the range a save must respect; the value of a point is the platform's and the same at every hotel.",
  })
  @HotelAccessRequired('owner-view')
  @ApiData(hotelLoyaltyProgramResponseSchema)
  @ApiErrors(ErrorCode.LOYALTY_PROGRAM_NOT_FOUND)
  @Get('hotels/:hotelId/loyalty-program')
  hotelProgram(@Param('hotelId') hotelId: string) {
    return this.loyalty.hotelProgram(hotelId);
  }

  @ApiOperation({
    summary: "Save the hotel's own loyalty rules",
    description:
      'Replaces the rules as a whole. `pointsPerCurrency` must be the platform rate for now (`limits` gives the range; a higher rate opens once the hotel giving the extra points also pays for them); `maxRedeemPercent` is 1-100 of the stay after the discount; `acceptsPoints: false` refuses points at this hotel. `isActive: false` goes back to the platform rules and keeps the saved values. Applies to quotes and bookings made afterwards, and to every check-out from now on.',
  })
  @HotelAccessRequired('owner')
  @ApiData(hotelLoyaltyProgramResponseSchema)
  @ApiErrors(ErrorCode.LOYALTY_PROGRAM_NOT_FOUND)
  @Put('hotels/:hotelId/loyalty-program')
  saveHotelProgram(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: HotelLoyaltyProgramDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.loyalty.saveHotelProgram(hotelId, dto, user.accountId, meta);
  }
}
