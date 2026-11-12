import {
  contentListQuerySchema,
  generateContentSchema,
  learnBrandVoiceSchema,
  rejectContentSchema,
  updateBrandVoiceSchema,
  updateContentSchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class UpdateBrandVoiceDto extends zodDto(updateBrandVoiceSchema) {}
export class LearnBrandVoiceDto extends zodDto(learnBrandVoiceSchema) {}
export class GenerateContentDto extends zodDto(generateContentSchema) {}
export class UpdateContentDto extends zodDto(updateContentSchema) {}
export class RejectContentDto extends zodDto(rejectContentSchema) {}
export class ContentListQueryDto extends zodDto(contentListQuerySchema) {}
