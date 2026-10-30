import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
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
  ApiHotelAccess,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { ChangeRequestsService } from './change-requests.service';
import { ChangeRequestDto, RejectChangeDto } from './dto/booking.dto';

const DECIDE_ACCESS =
  'The owner (not while suspended: `PARTNER_SUSPENDED`) or staff with `BOOKING`; other staff get `FORBIDDEN`';

@ApiTags('bookings')
@Controller()
export class ChangeRequestsController {
  constructor(private readonly changes: ChangeRequestsService) {}

  @ApiOperation({
    summary: 'Ask the hotel to change guest details',
    description:
      'UC25, decision O11. For the customer who booked, only while `CONFIRMED` (`BOOKING_STATUS_CONFLICT`) and not while a refund request waits (`REFUND_DECISION_PENDING`), one waiting request at a time (`CHANGE_REQUEST_PENDING`). Only the guest name, contact phone, arrival time and special requests (`null` clears the last two); dates, room type and guests never change (BR-09). Fields equal to the booking are dropped; when none is left the answer is `VALIDATION_ERROR`. The hotel is emailed; `changeRequest` shows the request. A request still waiting when the booking is cancelled, checked in or marked no-show is closed automatically (`REJECTED`, with a fixed reason).',
  })
  @Roles(UserRole.CUSTOMER)
  @ApiData(bookingResponseSchema)
  @ApiErrors(
    ErrorCode.BOOKING_NOT_FOUND,
    ErrorCode.BOOKING_STATUS_CONFLICT,
    ErrorCode.REFUND_DECISION_PENDING,
    ErrorCode.CHANGE_REQUEST_PENDING,
  )
  @Post('bookings/:id/change-request')
  @HttpCode(HttpStatus.OK)
  request(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ChangeRequestDto,
  ) {
    return this.changes.request(user, id, dto);
  }

  @ApiOperation({
    summary: 'Accept the waiting change request',
    description:
      'UC43. The booking must still be `CONFIRMED` (`BOOKING_STATUS_CONFLICT`) with no refund request waiting (`REFUND_DECISION_PENDING`: the owner decides the refund first) and takes the requested values; the customer is emailed. No waiting request: `CHANGE_REQUEST_STATUS_CONFLICT`.',
  })
  @ApiHotelAccess('member', ErrorCode.BOOKING_NOT_FOUND)
  @ApiAccess(DECIDE_ACCESS)
  @ApiData(bookingResponseSchema)
  @ApiErrors(
    ErrorCode.FORBIDDEN,
    ErrorCode.PARTNER_SUSPENDED,
    ErrorCode.BOOKING_STATUS_CONFLICT,
    ErrorCode.REFUND_DECISION_PENDING,
    ErrorCode.CHANGE_REQUEST_STATUS_CONFLICT,
  )
  @Post('bookings/:id/accept-change')
  @HttpCode(HttpStatus.OK)
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.changes.accept(user, id);
  }

  @ApiOperation({
    summary: 'Reject the waiting change request',
    description:
      'UC43. The booking keeps its details; `reason` is emailed to the customer and shown in `changeRequest`. Possible whatever the booking status. No waiting request: `CHANGE_REQUEST_STATUS_CONFLICT`.',
  })
  @ApiHotelAccess('member', ErrorCode.BOOKING_NOT_FOUND)
  @ApiAccess(DECIDE_ACCESS)
  @ApiData(bookingResponseSchema)
  @ApiErrors(
    ErrorCode.FORBIDDEN,
    ErrorCode.PARTNER_SUSPENDED,
    ErrorCode.CHANGE_REQUEST_STATUS_CONFLICT,
  )
  @Post('bookings/:id/reject-change')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectChangeDto,
  ) {
    return this.changes.reject(user, id, dto);
  }
}
