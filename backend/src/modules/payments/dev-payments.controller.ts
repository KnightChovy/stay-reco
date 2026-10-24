import {
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { bookingResponseSchema } from '@stayreco/shared';
import { randomUUID } from 'crypto';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { ApiData, ApiErrors } from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { BookingsService } from '../bookings/bookings.service';
import { DevOnly } from './dev-only.guard';
import { PaymentConfirmationService } from './payment-confirmation.service';

@ApiTags('bookings')
@DevOnly()
@Controller()
export class DevPaymentsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly payments: PaymentConfirmationService,
  ) {}

  @ApiOperation({
    summary: 'Pay a booking without a bank transfer (development only)',
    description:
      'Only when the backend runs with `PAYMENT_SIMULATOR=true` outside production; otherwise 404. Runs the same confirmation as a matching SePay transfer of exactly the booking total: the booking becomes `CONFIRMED`, the invoice `PAID`, the held nights `BOOKED`, and the hotel wallet receives the amount. For the customer who booked; a booking that is no longer `PENDING` answers `BOOKING_STATUS_CONFLICT`.',
  })
  @Roles(UserRole.CUSTOMER)
  @ApiData(bookingResponseSchema)
  @ApiErrors(ErrorCode.BOOKING_NOT_FOUND, ErrorCode.BOOKING_STATUS_CONFLICT)
  @Post('dev/bookings/:id/simulate-payment')
  @HttpCode(HttpStatus.OK)
  async simulate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const booking = await this.bookings.findOne(user, id);
    const result = await this.payments.confirm({
      code: booking.code,
      amount: booking.totalAmount,
      transactionId: `sim-${randomUUID()}`,
      paidAt: new Date(),
    });
    if (result.status !== 'CONFIRMED') {
      throw new ConflictException({
        code: ErrorCode.BOOKING_STATUS_CONFLICT,
        message: `The booking is ${booking.status}, not waiting for payment`,
      });
    }
    return this.bookings.findOne(user, id);
  }
}
