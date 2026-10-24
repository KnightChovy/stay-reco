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
  bookingVoucherResponseSchema,
  cancellationQuoteResponseSchema,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import {
  type RequestMeta,
  ReqMeta,
} from '../../common/decorators/request-meta.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  ApiAccess,
  ApiData,
  ApiErrors,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { BookingCancellationService } from './booking-cancellation.service';
import { BookingsService } from './bookings.service';
import {
  CancelBookingDto,
  CreateBookingDto,
  MyBookingsQueryDto,
} from './dto/booking.dto';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly cancellation: BookingCancellationService,
  ) {}

  @ApiOperation({
    summary: 'Book a room type: hold the rooms for 15 minutes',
    description:
      'Prices the stay again and holds the rooms on every night. A total different from `expectedTotal` answers `BOOKING_PRICE_CHANGED` with the new total as the `message` of the `expectedTotal` detail (MSG13); not enough rooms answers `ROOM_SOLD_OUT` (MSG12). The booking is `PENDING` with its invoice `UNPAID`; `payment` holds the transfer details until the hold expires.',
  })
  @Roles(UserRole.CUSTOMER)
  @ApiData(bookingResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.ROOM_TYPE_NOT_FOUND,
    ErrorCode.ROOM_SOLD_OUT,
    ErrorCode.BOOKING_PRICE_CHANGED,
  )
  @Post('bookings')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.bookings.create(user, dto);
  }

  @ApiOperation({
    summary: 'Get a booking',
    description:
      'Poll it every 3–5 s on the payment page until `status` leaves `PENDING`.',
  })
  @ApiAccess(
    'The customer who booked; the hotel owner (also while suspended); staff of the hotel with `BOOKING` or `REFUND`. Anyone else gets `BOOKING_NOT_FOUND`.',
  )
  @ApiData(bookingResponseSchema)
  @ApiErrors(ErrorCode.BOOKING_NOT_FOUND, ErrorCode.FORBIDDEN)
  @Get('bookings/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookings.findOne(user, id);
  }

  @ApiOperation({
    summary: 'My trips: the signed-in customer\x27s bookings',
    description:
      '`tab`: `upcoming` (default: PENDING and CONFIRMED), `staying` (CHECKED_IN), `completed` (COMPLETED, NO_SHOW), `cancelled` (CANCELLED, EXPIRED). `search` matches the booking code. Newest first.',
  })
  @Roles(UserRole.CUSTOMER)
  @ApiPage(bookingSummaryResponseSchema)
  @Get('me/bookings')
  listMine(@CurrentUser() user: AuthUser, @Query() query: MyBookingsQueryDto) {
    return this.bookings.listMine(user, query);
  }

  @ApiOperation({
    summary: 'E-voucher of a paid booking',
    description:
      'For the customer who booked, while the booking is CONFIRMED or CHECKED_IN. Render `qrToken` as a QR code; the hotel checks its signature at check-in. Another status answers `BOOKING_STATUS_CONFLICT`.',
  })
  @Roles(UserRole.CUSTOMER)
  @ApiData(bookingVoucherResponseSchema)
  @ApiErrors(ErrorCode.BOOKING_NOT_FOUND, ErrorCode.BOOKING_STATUS_CONFLICT)
  @Get('bookings/:id/voucher')
  voucher(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookings.voucher(user, id);
  }

  @ApiOperation({
    summary: 'What cancelling the booking now would cost',
    description:
      'For the customer who booked. No fee before `freeUntil`, otherwise `feePercent` of the amount paid; `needsApproval` is false when nothing is refunded (the booking is then cancelled at once). Same status rules as the cancel.',
  })
  @Roles(UserRole.CUSTOMER)
  @ApiData(cancellationQuoteResponseSchema)
  @ApiErrors(
    ErrorCode.BOOKING_NOT_FOUND,
    ErrorCode.BOOKING_STATUS_CONFLICT,
    ErrorCode.CANCELLATION_NOT_ALLOWED,
  )
  @Get('bookings/:id/cancellation-quote')
  cancellationQuote(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cancellation.quote(user, id);
  }

  @ApiOperation({
    summary: 'Cancel a booking',
    description:
      'Only a CONFIRMED booking without a pending refund. Refund 0: the booking is CANCELLED at once and its nights released. Refund above 0: a refund request; the invoice becomes REFUND_PENDING and the booking stays CONFIRMED with its rooms until the hotel decides. After check-in: `CANCELLATION_NOT_ALLOWED`; any other status or a pending refund: `BOOKING_STATUS_CONFLICT`.',
  })
  @Roles(UserRole.CUSTOMER)
  @ApiData(bookingResponseSchema)
  @ApiErrors(
    ErrorCode.BOOKING_NOT_FOUND,
    ErrorCode.BOOKING_STATUS_CONFLICT,
    ErrorCode.CANCELLATION_NOT_ALLOWED,
  )
  @Post('bookings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.cancellation.cancel(user, id, dto, meta);
  }
}
