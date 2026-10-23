import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { bookingResponseSchema } from '@stayreco/shared';
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
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/booking.dto';

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
}
