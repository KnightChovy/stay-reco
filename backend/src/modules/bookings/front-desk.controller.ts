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
  roomOptionsResponseSchema,
  roomResponseSchema,
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
} from '../../common/swagger/api-docs.decorators';
import { BookingLookupQueryDto, CheckInDto } from './dto/booking.dto';
import { FrontDeskService } from './front-desk.service';

const FRONT_DESK_ACCESS =
  'The owner (not while suspended: `PARTNER_SUSPENDED`) or staff with `FRONT_DESK`; other staff get `FORBIDDEN`';

@ApiTags('front-desk')
@Controller()
export class FrontDeskController {
  constructor(private readonly frontDesk: FrontDeskService) {}

  @ApiOperation({
    summary: "Find a guest's booking by code or voucher QR",
    description:
      'UC37. `code`: the booking code as typed at the desk (dashes and case do not matter). `qrToken`: the token read from the voucher QR; its signature is checked, a bad one answers `VOUCHER_INVALID` (MSG20). A booking of another hotel answers `BOOKING_NOT_FOUND`. Any status is returned.',
  })
  @HotelAccessRequired('member')
  @ApiAccess(
    'The owner (also while suspended) or staff with `FRONT_DESK` or `BOOKING`; other staff get `FORBIDDEN`',
  )
  @ApiData(bookingResponseSchema)
  @ApiErrors(ErrorCode.VOUCHER_INVALID, ErrorCode.BOOKING_NOT_FOUND)
  @Get('hotels/:hotelId/bookings/lookup')
  lookup(
    @CurrentUser() user: AuthUser,
    @CurrentHotelAccess() access: HotelAccess,
    @Query() query: BookingLookupQueryDto,
  ) {
    return this.frontDesk.lookup(user, access, query);
  }

  @ApiOperation({
    summary: 'Rooms that can be assigned at check-in',
    description:
      'UC38, BR-10. Only a booking check-in accepts now, with the same errors (`BOOKING_STATUS_CONFLICT`, `REFUND_DECISION_PENDING`, `CHECK_IN_NOT_OPEN`). `held`: the rooms it holds on the remaining nights, with their status. `available`: other rooms of the booked type that are `AVAILABLE` and free on every remaining night (from today, or the check-in date when it is ahead, to the night before check-out).',
  })
  @ApiHotelAccess('member', ErrorCode.BOOKING_NOT_FOUND)
  @ApiAccess(FRONT_DESK_ACCESS)
  @ApiData(roomOptionsResponseSchema)
  @ApiErrors(
    ErrorCode.FORBIDDEN,
    ErrorCode.PARTNER_SUSPENDED,
    ErrorCode.BOOKING_STATUS_CONFLICT,
    ErrorCode.CHECK_IN_NOT_OPEN,
    ErrorCode.REFUND_DECISION_PENDING,
  )
  @Get('bookings/:id/room-options')
  roomOptions(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.frontDesk.roomOptions(user, id);
  }

  @ApiOperation({
    summary: 'Check the guest in',
    description:
      'UC36. Only a `CONFIRMED` booking with a `PAID` invoice, from the check-in date to the day before check-out (otherwise `CHECK_IN_NOT_OPEN`); a waiting refund request answers `REFUND_DECISION_PENDING`. `roomIds` (as many as the booking\x27s rooms) picks the rooms, otherwise the held rooms are used; each must be of the booked type, `AVAILABLE` and free on the remaining nights (`ROOM_NOT_ASSIGNABLE`). The booking becomes `CHECKED_IN`, the remaining nights move to the rooms, the rooms become `OCCUPIED` and `assignedRooms` lists them.',
  })
  @ApiHotelAccess('member', ErrorCode.BOOKING_NOT_FOUND)
  @ApiAccess(FRONT_DESK_ACCESS)
  @ApiData(bookingResponseSchema)
  @ApiErrors(
    ErrorCode.FORBIDDEN,
    ErrorCode.PARTNER_SUSPENDED,
    ErrorCode.BOOKING_STATUS_CONFLICT,
    ErrorCode.CHECK_IN_NOT_OPEN,
    ErrorCode.REFUND_DECISION_PENDING,
    ErrorCode.ROOM_NOT_ASSIGNABLE,
  )
  @Post('bookings/:id/check-in')
  @HttpCode(HttpStatus.OK)
  checkIn(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CheckInDto,
  ) {
    return this.frontDesk.checkIn(user, id, dto);
  }

  @ApiOperation({
    summary: 'Mark a no-show',
    description:
      'Decisions O4, O5. Only a `CONFIRMED` booking with a `PAID` invoice, from the day after the check-in date (otherwise `NO_SHOW_NOT_ALLOWED`); a waiting refund request answers `REFUND_DECISION_PENDING`. The booking becomes `NO_SHOW`, the nights from today on are released, the hotel keeps the payment and the platform commission is charged. A job does the same for bookings still `CONFIRMED` at the hotel\x27s check-out time (12:00 when not set) on the check-out date.',
  })
  @ApiHotelAccess('member', ErrorCode.BOOKING_NOT_FOUND)
  @ApiAccess(FRONT_DESK_ACCESS)
  @ApiData(bookingResponseSchema)
  @ApiErrors(
    ErrorCode.FORBIDDEN,
    ErrorCode.PARTNER_SUSPENDED,
    ErrorCode.BOOKING_STATUS_CONFLICT,
    ErrorCode.NO_SHOW_NOT_ALLOWED,
    ErrorCode.REFUND_DECISION_PENDING,
  )
  @Post('bookings/:id/no-show')
  @HttpCode(HttpStatus.OK)
  noShow(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.frontDesk.noShow(user, id);
  }

  @ApiOperation({
    summary: 'Check the guest out',
    description:
      'UC39. Only a `CHECKED_IN` booking, early or late (O9). The booking becomes `COMPLETED` and its rooms `CLEANING`. Leaving before the check-out date releases the nights from today on, without refund. The platform commission is charged now; the hotel\x27s money becomes available after the holding period (money-rules §5.4).',
  })
  @ApiHotelAccess('member', ErrorCode.BOOKING_NOT_FOUND)
  @ApiAccess(FRONT_DESK_ACCESS)
  @ApiData(bookingResponseSchema)
  @ApiErrors(
    ErrorCode.FORBIDDEN,
    ErrorCode.PARTNER_SUSPENDED,
    ErrorCode.BOOKING_STATUS_CONFLICT,
  )
  @Post('bookings/:id/check-out')
  @HttpCode(HttpStatus.OK)
  checkOut(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.frontDesk.checkOut(user, id);
  }

  @ApiOperation({
    summary: 'Mark a room cleaned',
    description:
      '`CLEANING` → `AVAILABLE`; another status answers `ROOM_STATUS_CONFLICT`.',
  })
  @ApiHotelAccess('member', ErrorCode.ROOM_NOT_FOUND)
  @ApiAccess(FRONT_DESK_ACCESS)
  @ApiData(roomResponseSchema)
  @ApiErrors(
    ErrorCode.FORBIDDEN,
    ErrorCode.PARTNER_SUSPENDED,
    ErrorCode.ROOM_STATUS_CONFLICT,
  )
  @Post('rooms/:id/clean')
  @HttpCode(HttpStatus.OK)
  clean(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.frontDesk.cleanRoom(user, id);
  }
}
