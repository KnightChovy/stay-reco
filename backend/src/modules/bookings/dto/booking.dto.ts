import {
  bookingLookupQuerySchema,
  cancelBookingSchema,
  checkInSchema,
  createBookingSchema,
  forwardRefundSchema,
  hotelBookingsQuerySchema,
  myBookingsQuerySchema,
  rejectRefundSchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class CreateBookingDto extends zodDto(createBookingSchema) {}
export class CancelBookingDto extends zodDto(cancelBookingSchema) {}
export class MyBookingsQueryDto extends zodDto(myBookingsQuerySchema) {}
export class HotelBookingsQueryDto extends zodDto(hotelBookingsQuerySchema) {}
export class ForwardRefundDto extends zodDto(forwardRefundSchema) {}
export class RejectRefundDto extends zodDto(rejectRefundSchema) {}
export class BookingLookupQueryDto extends zodDto(bookingLookupQuerySchema) {}
export class CheckInDto extends zodDto(checkInSchema) {}
