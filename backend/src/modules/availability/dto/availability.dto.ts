import {
  availabilityQuerySchema,
  updateAvailabilitySchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class AvailabilityQueryDto extends zodDto(availabilityQuerySchema) {}
export class UpdateAvailabilityDto extends zodDto(updateAvailabilitySchema) {}
