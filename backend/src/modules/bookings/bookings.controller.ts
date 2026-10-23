import {
  Body,
  Controller,
  Get,
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
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  ApiAccess,
  ApiData,
  ApiErrors,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, MyBookingsQueryDto } from './dto/booking.dto';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

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
      'For the customer who booked, once the booking is CONFIRMED (also while checked in or completed). Render `qrToken` as a QR code; the hotel checks its signature at check-in. Another status answers `BOOKING_STATUS_CONFLICT`.',
  })
  @Roles(UserRole.CUSTOMER)
  @ApiData(bookingVoucherResponseSchema)
  @ApiErrors(ErrorCode.BOOKING_NOT_FOUND, ErrorCode.BOOKING_STATUS_CONFLICT)
  @Get('bookings/:id/voucher')
  voucher(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookings.voucher(user, id);
  }
}
