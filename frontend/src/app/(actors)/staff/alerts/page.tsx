'use client';

import Link from 'next/link';
import { AlertTriangle, Bell, Check, CheckCheck, ChevronRight, CircleAlert, CircleCheck, Clock, Info, type LucideIcon } from 'lucide-react';
import type { ActionItem, ActionItemSeverity } from '@stayreco/shared';
import { ActionBar, ActionMenu } from '@/components/common/ActionBar';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStaffHotel } from '@/features/staff/components/StaffHotelProvider';
import { useActionItems } from '@/features/staff/api/staff-queries';
import { formatCalendarDate, formatDateTime } from '@/features/staff/lib/labels';
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

const severityStyles: Record<ActionItemSeverity, { icon: LucideIcon; className: string; label: string }> = {
  CRITICAL: { icon: CircleAlert, className: 'text-red-600 bg-red-50', label: 'Khẩn' },
  WARNING: { icon: AlertTriangle, className: 'text-amber-600 bg-amber-50', label: 'Cần chú ý' },
  INFO: { icon: Info, className: 'text-sky-600 bg-sky-50', label: 'Thông tin' },
};

/** Staff-facing action items only; owner-only types are skipped. */
function present(item: ActionItem): { title: string; detail?: string; href: string } | null {
  switch (item.type) {
    case 'OVERDUE_CHECKOUTS':
      return { title: `${item.count} booking quá giờ trả phòng`, detail: 'Khách vẫn đang lưu trú sau giờ trả phòng.', href: '/staff/check-out' };
    case 'REFUND_REQUESTS_PENDING':
      return {
        title: `${item.count} yêu cầu hoàn tiền chờ xử lý`,
        detail: `Yêu cầu cũ nhất lúc ${formatDateTime(item.params.oldestAt)}`,
        href: '/staff/refunds',
      };
    case 'CHANGE_REQUESTS_PENDING':
      return {
        title: `${item.count} yêu cầu đổi booking chờ xử lý`,
        detail: `Yêu cầu cũ nhất lúc ${formatDateTime(item.params.oldestAt)}`,
        href: '/staff/bookings',
      };
    case 'HIGH_DEMAND_DATES':
      return {
        title: `${item.count} ngày tới công suất từ ${item.params.threshold}%`,
        detail: `Sớm nhất ${formatCalendarDate(item.params.firstDate)}.`,
        href: '/staff/availability',
      };
    default:
      return null;
  }
}

function ActionItemsSection({ hotelId }: { hotelId: string }) {
  const query = useActionItems(hotelId);
  const entries = (query.data?.items ?? [])
    .map((item) => ({ item, view: present(item) }))
    .filter((entry): entry is { item: ActionItem; view: NonNullable<ReturnType<typeof present>> } => !!entry.view);

  return (
    <section aria-labelledby="alerts-actions" className="space-y-3">
      <h2 id="alerts-actions" className="text-base font-bold text-foreground">Việc cần xử lý</h2>
      {query.isLoading ? (
        <LoadingState rows={2} label="Đang tải việc cần xử lý…" />
      ) : query.isError ? (
        <ErrorState title="Không tải được việc cần xử lý" error={query.error} onRetry={() => void query.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState icon={CircleCheck} title="Không có việc nào cần xử lý" description="Mọi yêu cầu đều đã được xử lý." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {entries.map(({ item, view }) => {
            const severity = severityStyles[item.severity];
            const Icon = severity.icon;
            return (
              <li key={item.type}>
                <Link href={view.href} className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60">
                  <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', severity.className)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{view.title}</span>
                    {view.detail && <span className="block text-xs text-muted-foreground">{view.detail}</span>}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">{severity.label}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function NotificationsSection() {
  const query = useNotifications({ page: 1, pageSize: 20 });
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const notifications = query.data?.notifications ?? [];

  return (
    <section aria-labelledby="alerts-notifications" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="alerts-notifications" className="text-base font-bold text-foreground">Thông báo gần đây</h2>
        {(unread.data ?? 0) > 0 && (
          <ActionBar
            primary={
              <Button variant="outline" className="h-10 gap-1.5 text-xs" disabled={markAll.isPending} onClick={() => markAll.mutate()}>
                <CheckCheck className="size-4" aria-hidden /> Đọc tất cả
              </Button>
            }
          />
        )}
      </div>
      {query.isLoading ? (
        <LoadingState rows={3} label="Đang tải thông báo…" />
      ) : query.isError ? (
        <ErrorState title="Không tải được thông báo" error={query.error} onRetry={() => void query.refetch()} />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Chưa có thông báo nào" description="Thông báo mới về đặt phòng, hoàn tiền sẽ xuất hiện ở đây." />
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_TYPE_ICON[notification.type];
            const title = notification.title ?? NOTIFICATION_TYPE_LABEL[notification.type];
            const body = (
              <>
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', NOTIFICATION_TYPE_TONE[notification.type])}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      {!notification.isRead && (
                        <>
                          <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                          <span className="sr-only">Chưa đọc: </span>
                        </>
                      )}
                      {title}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" aria-hidden /> {notificationTimeAgo(notification.createdAt)}
                    </span>
                  </span>
                  <span className="block text-sm text-muted-foreground">{notification.message}</span>
                </span>
              </>
            );
            const rowClass = 'flex min-w-0 flex-1 items-start gap-3 rounded-xl p-3 text-left';
            return (
              <li
                key={notification.id}
                className={cn(
                  'flex items-start gap-1 rounded-xl border',
                  notification.isRead ? 'border-border bg-card' : 'border-primary/20 bg-primary/5',
                )}
              >
                {notification.link ? (
                  <Link
                    href={notification.link}
                    onClick={() => {
                      if (!notification.isRead) markRead.mutate(notification.id);
                    }}
                    className={cn(rowClass, 'transition-colors hover:bg-muted/60')}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={rowClass}>{body}</div>
                )}
                {!notification.isRead && (
                  <div className="p-1.5">
                    <ActionMenu
                      variant="icon"
                      label={`Thao tác với thông báo "${title}"`}
                      items={[
                        { label: 'Đánh dấu đã đọc', description: 'Không mở thông báo', icon: Check, disabled: markRead.isPending, onSelect: () => markRead.mutate(notification.id) },
                      ]}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function StaffAlertsPage() {
  const { hotel } = useStaffHotel();
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 font-sans antialiased text-foreground">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Thông báo & cảnh báo</h1>
        <p className="text-sm text-muted-foreground">Việc đang chờ lễ tân và thông báo gửi cho tài khoản của bạn.</p>
      </header>
      {hotel && <ActionItemsSection hotelId={hotel.summary.id} />}
      <NotificationsSection />
    </div>
  );
}
