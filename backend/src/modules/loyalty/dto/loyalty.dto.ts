import { loyaltyEntryQuerySchema } from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class LoyaltyEntryQueryDto extends zodDto(loyaltyEntryQuerySchema) {}
