import {
  connectSocialAccountSchema,
  contentListQuerySchema,
  facebookConnectSchema,
  facebookExchangeSchema,
  generateContentSchema,
  learnBrandVoiceSchema,
  rejectContentSchema,
  scheduleContentSchema,
  scheduleListQuerySchema,
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
export class ConnectSocialAccountDto extends zodDto(
  connectSocialAccountSchema,
) {}
export class FacebookExchangeDto extends zodDto(facebookExchangeSchema) {}
export class FacebookConnectDto extends zodDto(facebookConnectSchema) {}
export class ScheduleContentDto extends zodDto(scheduleContentSchema) {}
export class ScheduleListQueryDto extends zodDto(scheduleListQuerySchema) {}
