import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  pricePreviewResponseSchema,
  pricingRuleResponseSchema,
  z,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import {
  ApiData,
  ApiErrors,
  ApiHotelAccess,
} from '../../common/swagger/api-docs.decorators';
import {
  CreatePricingRuleDto,
  PricePreviewQueryDto,
  PricingRuleListQueryDto,
  UpdatePricingRuleDto,
} from './dto/pricing.dto';
import { PricingRulesService } from './pricing-rules.service';

@ApiTags('pricing')
@Controller()
export class PricingRulesController {
  constructor(private readonly rules: PricingRulesService) {}

  @ApiOperation({
    summary: "List the hotel's pricing rules",
    description:
      'Highest priority first, then the newest. The base price is not a rule: it is `basePrice` on the room type.',
  })
  @HotelAccessRequired('member')
  @ApiData(z.array(pricingRuleResponseSchema))
  @Get('hotels/:hotelId/pricing-rules')
  list(
    @Param('hotelId') hotelId: string,
    @Query() query: PricingRuleListQueryDto,
  ) {
    return this.rules.list(hotelId, query);
  }

  @HotelAccessRequired('owner')
  @ApiOperation({
    summary: 'Create a pricing rule',
    description:
      'One rule applies per night: the matching active rule with the highest priority, ties to the newest. `SEASON` needs `validFrom` / `validTo`, `EARLY_BIRD` `minDaysBefore`, `LAST_MINUTE` `maxDaysBefore`. An amount that would bring the base price to 0 or below returns `VALIDATION_ERROR` on `adjustmentValue`.',
  })
  @ApiData(pricingRuleResponseSchema, HttpStatus.CREATED)
  @ApiErrors(ErrorCode.ROOM_TYPE_NOT_FOUND)
  @Post('hotels/:hotelId/pricing-rules')
  create(@Param('hotelId') hotelId: string, @Body() dto: CreatePricingRuleDto) {
    return this.rules.create(hotelId, dto);
  }

  @ApiHotelAccess('owner', ErrorCode.PRICING_RULE_NOT_FOUND)
  @ApiOperation({
    summary: 'Update a pricing rule',
    description:
      'Only the fields sent change; the rule is validated as a whole after the change. `null` clears an optional field. Existing bookings keep their prices.',
  })
  @ApiData(pricingRuleResponseSchema)
  @Patch('pricing-rules/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePricingRuleDto,
  ) {
    return this.rules.update(user, id, dto);
  }

  @ApiOperation({ summary: 'Delete a pricing rule' })
  @ApiHotelAccess('owner', ErrorCode.PRICING_RULE_NOT_FOUND)
  @Delete('pricing-rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.rules.remove(user, id);
  }

  @ApiOperation({
    summary: 'Preview the price of one night',
    description:
      'The price of the night `date` for a stay starting that night and booked on `bookedOn` (default: today in Vietnam), with the rule that set it.',
  })
  @ApiHotelAccess('member', ErrorCode.ROOM_TYPE_NOT_FOUND)
  @ApiData(pricePreviewResponseSchema)
  @Get('room-types/:id/price-preview')
  preview(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: PricePreviewQueryDto,
  ) {
    return this.rules.preview(user, id, query);
  }
}
