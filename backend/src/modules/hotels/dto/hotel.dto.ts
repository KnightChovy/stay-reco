import {
  cancellationPolicySchema,
  createHotelSchema,
  hotelAmenitiesSchema,
  hotelPoliciesSchema,
  lateCheckoutPolicySchema,
  roomConfigSchema,
  updateHotelImageSchema,
  updateHotelSchema,
  uploadHotelImageSchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class CancellationPolicyDto extends zodDto(cancellationPolicySchema) {}
export class LateCheckoutPolicyDto extends zodDto(lateCheckoutPolicySchema) {}
export class CreateHotelDto extends zodDto(createHotelSchema) {}
export class UpdateHotelDto extends zodDto(updateHotelSchema) {}
export class HotelAmenitiesDto extends zodDto(hotelAmenitiesSchema) {}
export class HotelPoliciesDto extends zodDto(hotelPoliciesSchema) {}
export class RoomConfigDto extends zodDto(roomConfigSchema) {}
export class UploadHotelImageDto extends zodDto(uploadHotelImageSchema) {}
export class UpdateHotelImageDto extends zodDto(updateHotelImageSchema) {}
