'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/features/notifications/api/notification-queries';
import {
  NOTIFICATION_TYPE_ICON,
  NOTIFICATION_TYPE_LABEL,
  NOTIFICATION_TYPE_TONE,
  notificationTimeAgo,
} from '@/features/notifications/lib/presentation';

/**
 * The header bell: a compact preview of the latest 5 notifications. The full page is one click away; opening the
 * panel does not navigate.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notificationsQuery = useNotifications({ page: 1, pageSize: 5 });
  const unreadCountQuery = useUnreadNotificationCount();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = unreadCountQuery.data ?? 0;

  return (
    <Popover open={open} onOpenChange={(next) => setOpen(next)}>
      <PopoverTrigger
        className="relative inline-flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted focus-visible:outline-none"
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(92vw,380px)] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-bold text-foreground">Thông báo</p>
            <p className="text-[11px] text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã đọc hết thông báo'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline disabled:opacity-60"
            >
              <CheckCheck className="size-3.5" /> Đọc tất cả
            </button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          {notificationsQuery.isLoading && (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          )}

          {!notificationsQuery.isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="size-8 text-slate-300" />
              <p className="text-xs font-semibold text-foreground">Chưa có thông báo nào</p>
              <p className="text-[11px] text-muted-foreground">Thông báo mới sẽ xuất hiện ở đây.</p>
            </div>
          )}

          {notifications.map((notification) => {
            const Icon = NOTIFICATION_TYPE_ICON[notification.type];
            const content = (
              <span className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${NOTIFICATION_TYPE_TONE[notification.type]}`}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span
                      className={`line-clamp-2 text-xs ${
                        notification.isRead ? 'font-semibold text-foreground' : 'font-bold text-foreground'
                      }`}
                    >
                      {notification.title ?? NOTIFICATION_TYPE_LABEL[notification.type]}
                    </span>
                    {!notification.isRead && (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-secondary" />
                    )}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-muted-foreground">
                    {notification.message}
                  </span>
                  <span className="mt-1 block text-[10px] font-medium text-slate-400">
                    {notificationTimeAgo(notification.createdAt)}
                  </span>
                </span>
              </span>
            );

            const onClick = () => {
              if (!notification.isRead) markRead.mutate(notification.id);
              setOpen(false);
            };

            return notification.link ? (
              <Link
                key={notification.id}
                href={notification.link}
                onClick={onClick}
                className={`block border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50 ${
                  notification.isRead ? 'bg-white' : 'bg-primary/[0.04]'
                }`}
              >
                {content}
              </Link>
            ) : (
              <button
                key={notification.id}
                type="button"
                onClick={onClick}
                className={`block w-full border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 ${
                  notification.isRead ? 'bg-white' : 'bg-primary/[0.04]'
                }`}
              >
                {content}
              </button>
            );
          })}
        </div>

        <div className="border-t border-border bg-slate-50/80 p-2">
          <Link
            href="/account/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-white"
          >
            Xem tất cả thông báo <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {notificationsQuery.isFetching && !notificationsQuery.isLoading && (
          <span className="absolute right-3 top-3 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
          </span>
        )}
      </PopoverContent>
    </Popover>
  );
}
