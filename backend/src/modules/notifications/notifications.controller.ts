import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  notificationResponseSchema,
  readAllResponseSchema,
  unreadCountResponseSchema,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  ApiData,
  ApiErrors,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { NotificationListQueryDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

/** The signed-in account's in-app notifications (decision O12), for every role. */
@ApiTags('notifications')
@Controller('me/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @ApiOperation({
    summary: 'My notifications',
    description:
      'Newest first. `unread=true` keeps only the unread ones; `false` or no value lists all. `link` is the app path to open (`/account/bookings/<id>`, `/staff/bookings/<id>`, `/partner/bookings`), null when there is nothing to open.',
  })
  @ApiPage(notificationResponseSchema)
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: NotificationListQueryDto,
  ) {
    return this.notifications.list(user.accountId, query);
  }

  @ApiOperation({ summary: 'How many of my notifications are unread' })
  @ApiData(unreadCountResponseSchema)
  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notifications.unreadCount(user.accountId);
  }

  @ApiOperation({
    summary: 'Mark one notification as read',
    description:
      'Marking a read notification again is fine. Someone else\x27s notification answers `NOTIFICATION_NOT_FOUND`.',
  })
  @ApiData(notificationResponseSchema)
  @ApiErrors(ErrorCode.NOTIFICATION_NOT_FOUND)
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.markRead(user.accountId, id);
  }

  @ApiOperation({ summary: 'Mark all my notifications as read' })
  @ApiData(readAllResponseSchema)
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.accountId);
  }
}
