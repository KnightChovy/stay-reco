import {
  hotelLoyaltyProgramSchema,
  loyaltyEntryQuerySchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class LoyaltyEntryQueryDto extends zodDto(loyaltyEntryQuerySchema) {}
export class HotelLoyaltyProgramDto extends zodDto(hotelLoyaltyProgramSchema) {}
