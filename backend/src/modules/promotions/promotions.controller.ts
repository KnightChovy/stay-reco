import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  discountQuoteResponseSchema,
  promotionResponseSchema,
  voucherResponseSchema,
  z,
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
  ApiHotelAccess,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import {
  CreatePromotionDto,
  DiscountQuoteDto,
  IssueVouchersDto,
  PromotionListQueryDto,
  UpdatePromotionDto,
} from './dto/promotion.dto';
import { PromotionsService } from './promotions.service';
import { StayDiscountService } from './stay-discount.service';

/** Discount campaigns and the personal codes under them (BR-06). */
@ApiTags('promotions')
@Controller()
export class PromotionsController {
  constructor(
    private readonly promotions: PromotionsService,
    private readonly stayDiscount: StayDiscountService,
  ) {}

  @ApiOperation({
    summary: "A hotel's discount campaigns",
    description:
      'Newest first. `active=true` keeps the ones a booking could use today: switched on, inside their dates and with uses left. Each campaign carries `usable`, which is that same check.',
  })
  @HotelAccessRequired('member')
  @ApiPage(promotionResponseSchema)
  @Get('hotels/:hotelId/promotions')
  list(
    @Param('hotelId') hotelId: string,
    @Query() query: PromotionListQueryDto,
  ) {
    return this.promotions.list(hotelId, query);
  }

  @ApiOperation({
    summary: 'Start a discount campaign',
    description:
      'A campaign applies to a stay on its own, with no code typed. `PERCENTAGE` is 0-100, `FIXED_AMOUNT` is dong. `minBookingAmount` is the stay total it needs to reach; `maxUses` caps how many bookings may take it.',
  })
  @HotelAccessRequired('owner')
  @ApiData(promotionResponseSchema, 201)
  @Post('hotels/:hotelId/promotions')
  create(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: CreatePromotionDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.promotions.create(hotelId, dto, user.accountId, meta);
  }

  @ApiOperation({
    summary: 'Change a campaign',
    description:
      'Does not touch the uses already made: lowering `maxUses` below them stops the campaign rather than rewriting the bookings that already took the discount.',
  })
  @ApiHotelAccess('owner', ErrorCode.PROMOTION_NOT_FOUND)
  @ApiData(promotionResponseSchema)
  @Patch('promotions/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.promotions.update(user, id, dto, meta);
  }

  @ApiOperation({
    summary: 'Switch a campaign off',
    description:
      'Sets `isActive` to false. A campaign is never deleted: bookings point at it, and the discounts already given stay readable.',
  })
  @ApiHotelAccess('owner', ErrorCode.PROMOTION_NOT_FOUND)
  @ApiData(promotionResponseSchema)
  @Delete('promotions/:id')
  deactivate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.promotions.deactivate(user, id, meta);
  }

  @ApiOperation({
    summary: 'Hand personal codes to customers',
    description:
      'One code per customer, under the campaign terms. `maxDiscount` caps a percentage in dong; `expiresAt` ends the code earlier than the campaign.',
  })
  @ApiHotelAccess('owner', ErrorCode.PROMOTION_NOT_FOUND)
  @ApiData(z.array(voucherResponseSchema), 201)
  @ApiErrors(ErrorCode.PROMOTION_NOT_ACTIVE, ErrorCode.NOT_FOUND)
  @Post('promotions/:id/vouchers')
  issueVouchers(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: IssueVouchersDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.promotions.issueVouchers(user, id, dto, meta);
  }

  @ApiOperation({
    summary: 'My discount codes',
    description:
      'Newest first, the spent and expired ones included. `active=true` keeps only the ones still usable. `usable` is false once the code is spent, past its expiry, or its campaign stops running.',
  })
  @ApiPage(voucherResponseSchema)
  @Roles(UserRole.CUSTOMER)
  @Get('me/vouchers')
  listMine(
    @CurrentUser() user: AuthUser,
    @Query() query: PromotionListQueryDto,
  ) {
    return this.promotions.listMine(user.accountId, query);
  }

  @ApiOperation({
    summary: 'What a stay would cost with a discount',
    description:
      'Read-only: holds nothing and spends nothing. Answers the stay subtotal, the one discount that applies and `expectedTotal`, which is what `POST /bookings` must be sent. Leaving `code` out shows the automatic campaigns only. A booking takes a campaign **or** a code, never both, and always the one that saves more. A code that cannot be used answers its own error rather than silently falling back.',
  })
  @ApiData(discountQuoteResponseSchema)
  @ApiErrors(
    ErrorCode.ROOM_TYPE_NOT_FOUND,
    ErrorCode.VOUCHER_NOT_FOUND,
    ErrorCode.VOUCHER_ALREADY_USED,
    ErrorCode.VOUCHER_EXPIRED,
    ErrorCode.VOUCHER_NOT_APPLICABLE,
  )
  @Roles(UserRole.CUSTOMER)
  @Post('bookings/discount-quote')
  quote(@CurrentUser() user: AuthUser, @Body() dto: DiscountQuoteDto) {
    return this.stayDiscount.quote(user.accountId, dto);
  }
}
