import { createBookingSchema } from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class CreateBookingDto extends zodDto(createBookingSchema) {}
