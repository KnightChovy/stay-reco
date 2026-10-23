import { createBookingSchema, myBookingsQuerySchema } from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class CreateBookingDto extends zodDto(createBookingSchema) {}
export class MyBookingsQueryDto extends zodDto(myBookingsQuerySchema) {}
