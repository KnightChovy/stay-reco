import { updatePreferencesSchema } from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class UpdatePreferencesDto extends zodDto(updatePreferencesSchema) {}
