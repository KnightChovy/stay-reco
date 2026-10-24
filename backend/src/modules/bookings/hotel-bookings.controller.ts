import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  bookingResponseSchema,
  bookingSummaryResponseSchema,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  CurrentHotelAccess,
  HotelAccessRequired,
} from '../../common/hotel-access/hotel-access.guard';
import type { HotelAccess } from '../../common/hotel-access/hotel-access.service';
import {
  ApiAccess,
  ApiData,
  ApiErrors,
  ApiHotelAccess,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import {
  ForwardRefundDto,
  HotelBookingsQueryDto,
  RejectRefundDto,
} from './dto/booking.dto';
import { HotelBookingsService } from './hotel-bookings.service';
import { RefundDecisionsService } from './refund-decisions.service';

@ApiTags('bookings')
@Controller()
export class HotelBookingsController {
  constructor(
    private readonly hotelBookings: HotelBookingsService,
    private readonly refunds: RefundDecisionsService,
  ) {}

  @ApiOperation({
    summary: "List the hotel's bookings",
    description:
      'Read-only (UC57). `status` and `paymentStatus` may be repeated; `?paymentStatus=REFUND_PENDING` is the refund queue. `search` matches the booking code or the guest name. `sort`: `check-in-asc` (default), `check-in-desc`, `created-desc`.',
  })
  @HotelAccessRequired('member')
  @ApiAccess(
    'The owner (also while suspended) or staff with `BOOKING` or `REFUND`; other staff get `FORBIDDEN`.',
  )
  @ApiPage(bookingSummaryResponseSchema)
  @Get('hotels/:hotelId/bookings')
  list(
    @CurrentHotelAccess() access: HotelAccess,
    @Query() query: HotelBookingsQueryDto,
  ) {
    return this.hotelBookings.list(access, query);
  }

  @ApiOperation({
    summary: 'Forward a refund request to the partner with a note',
    description:
      'Staff with `REFUND` only, after checking the request against the policy fixed on the booking. Optional: the owner can decide at any time. Shown in the booking timeline as `REFUND_FORWARDED`.',
  })
  @ApiHotelAccess('member', ErrorCode.BOOKING_NOT_FOUND)
  @ApiData(bookingResponseSchema)
  @ApiErrors(ErrorCode.REFUND_STATUS_CONFLICT)
  @Post('bookings/:id/forward-refund')
  @HttpCode(HttpStatus.OK)
  forward(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ForwardRefundDto,
  ) {
    return this.refunds.forward(user, id, dto);
  }

  @ApiOperation({
    summary: 'Approve a refund request',
    description:
      'The owner, also while suspended. The booking becomes `CANCELLED` and its nights are released; the refund fixed when the customer cancelled moves from the hotel wallet to the customer wallet; the invoice becomes `REFUNDED` or `PARTIALLY_REFUNDED`.',
  })
  @ApiHotelAccess('owner-view', ErrorCode.BOOKING_NOT_FOUND)
  @ApiData(bookingResponseSchema)
  @ApiErrors(ErrorCode.REFUND_STATUS_CONFLICT)
  @Post('bookings/:id/approve-refund')
  @HttpCode(HttpStatus.OK)
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.refunds.approve(user, id);
  }

  @ApiOperation({
    summary: 'Reject a refund request',
    description:
      'The owner, not while suspended. Only for the BR-20 reasons: already refunded or a duplicate request, the booking status no longer allows it, suspected fraud with evidence. The invoice goes back to `PAID`, the booking stays `CONFIRMED`, and the customer sees the reason in `refundRejection`.',
  })
  @ApiHotelAccess('owner', ErrorCode.BOOKING_NOT_FOUND)
  @ApiData(bookingResponseSchema)
  @ApiErrors(ErrorCode.REFUND_STATUS_CONFLICT)
  @Post('bookings/:id/reject-refund')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectRefundDto,
  ) {
    return this.refunds.reject(user, id, dto);
  }
}
