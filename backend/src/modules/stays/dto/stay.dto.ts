import { hotelSearchQuerySchema, stayQuerySchema } from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class HotelSearchQueryDto extends zodDto(hotelSearchQuerySchema) {}
export class StayQueryDto extends zodDto(stayQuerySchema) {}
