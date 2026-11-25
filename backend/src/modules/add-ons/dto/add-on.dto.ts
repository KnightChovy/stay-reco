import {
  addBookingAddOnSchema,
  createAddOnSchema,
  updateAddOnSchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class CreateAddOnDto extends zodDto(createAddOnSchema) {}
export class UpdateAddOnDto extends zodDto(updateAddOnSchema) {}
export class AddBookingAddOnDto extends zodDto(addBookingAddOnSchema) {}
