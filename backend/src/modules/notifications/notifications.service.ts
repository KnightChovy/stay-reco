import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Notification,
  NotificationListQuery,
  ReadAllResult,
  UnreadCount,
} from '@stayreco/shared';
import { ErrorCode } from '../../common/errors/error-code';
import { Paginated } from '../../common/http/api-response';
import { pageArgs } from '../../common/http/pagination';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import type {
  Notification as NotificationRow,
  NotificationType,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** One in-app notification to write; `link` is the app path it opens. */
export interface NewNotification {
  userAccountId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
}

const toNotification = (n: NotificationRow): Notification => ({
  id: n.notificationId,
  type: n.type,
  title: n.title,
  message: n.message,
  link: n.link,
  isRead: n.isRead,
  createdAt: n.createdAt.toISOString(),
});

/**
 * In-app notifications (decision O12): written next to the booking, refund and change-request emails, read by every
 * signed-in role from `/me/notifications`. A notification is only ever visible to its recipient.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(notification: NewNotification) {
    await this.prisma.notification.create({
      data: {
        ...notification,
        // The column is VARCHAR(255); email subjects stay well below it, but never fail on a long one.
        title: notification.title.slice(0, 255),
      },
    });
  }

  /** Newest first; `unread` keeps only the unread ones. */
  async list(
    accountId: string,
    query: NotificationListQuery,
  ): Promise<Paginated<Notification>> {
    const where = {
      userAccountId: accountId,
      ...(query.unread !== undefined && { isRead: !query.unread }),
    } satisfies Prisma.NotificationWhereInput;
    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { notificationId: 'asc' }],
        ...pageArgs(query),
      }),
      this.prisma.notification.count({ where }),
    ]);
    return Paginated.of(rows.map(toNotification), { ...query, total });
  }

  async unreadCount(accountId: string): Promise<UnreadCount> {
    return {
      count: await this.prisma.notification.count({
        where: { userAccountId: accountId, isRead: false },
      }),
    };
  }

  /** Marking a read notification again is fine; someone else's is not found. */
  async markRead(
    accountId: string,
    notificationId: string,
  ): Promise<Notification> {
    const { count } = isUuid(notificationId)
      ? await this.prisma.notification.updateMany({
          where: { notificationId, userAccountId: accountId },
          data: { isRead: true },
        })
      : { count: 0 };
    if (!count) {
      throw new NotFoundException({
        code: ErrorCode.NOTIFICATION_NOT_FOUND,
        message: 'Notification not found',
      });
    }
    return toNotification(
      await this.prisma.notification.findUniqueOrThrow({
        where: { notificationId },
      }),
    );
  }

  async markAllRead(accountId: string): Promise<ReadAllResult> {
    const { count } = await this.prisma.notification.updateMany({
      where: { userAccountId: accountId, isRead: false },
      data: { isRead: true },
    });
    return { updated: count };
  }
}
