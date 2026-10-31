import { notificationListQuerySchema } from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class NotificationListQueryDto extends zodDto(
  notificationListQuerySchema,
) {}
