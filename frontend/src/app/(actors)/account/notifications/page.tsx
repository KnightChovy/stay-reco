'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Clock, Loader2 } from 'lucide-react';
import type { Notification, NotificationType } from '@stayreco/shared';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import Pagination from '@/components/common/pagination/Pagination';
import { ActionMenu } from '@/components/common/ActionBar';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api-error';
import { AccountPageHeader, accountContainer, notify } from '@/features/account/AccountShell';
import { SegmentedFilter } from '@/features/account/SegmentedFilter';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/features/notifications/api/notification-queries';
import {
  NOTIFICATION_TYPE_ICON as TYPE_ICON,
  NOTIFICATION_TYPE_LABEL as TYPE_LABEL,
  NOTIFICATION_TYPE_TONE as TYPE_TONE,
  notificationTimeAgo as timeAgo,
} from '@/features/notifications/lib/presentation';

type FilterId = 'all' | 'booking' | 'promo' | 'system';

const FILTERS: { id: FilterId; label: string; types?: NotificationType[] }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'booking', label: 'Đặt phòng', types: ['BOOKING', 'PAYMENT'] },
  { id: 'promo', label: 'Ưu đãi & voucher', types: ['PROMOTION'] },
  { id: 'system', label: 'Bảo mật & hệ thống', types: ['REVIEW', 'ALERT', 'SYSTEM'] },
];

/**
 * One notification. With a link the whole card opens it (and marks it read); the only other action, marking it read
 * without opening, sits in the card's "⋯" menu.
 */
function NotificationCard({
  notification,
  onRead,
  pending,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  pending: boolean;
}) {
  const Icon = TYPE_ICON[notification.type];
  const typeLabel = TYPE_LABEL[notification.type];
  const title = notification.title ?? typeLabel;
  const showType = title.trim().toLowerCase() !== typeLabel.trim().toLowerCase();

  const body = (
    <>
      <div
        className={cn(
          'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-2xs',
          TYPE_TONE[notification.type],
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            {!notification.isRead && (
              <>
                <span className="inline-block size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <span className="sr-only">Chưa đọc: </span>
              </>
            )}
            {title}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" aria-hidden /> {timeAgo(notification.createdAt)}
          </span>
        </div>
        {showType && <p className="text-xs font-semibold text-muted-foreground">{typeLabel}</p>}
        <p className="text-sm leading-relaxed text-muted-foreground">{notification.message}</p>
        {notification.link && <span className="inline-block pt-1 text-sm font-semibold text-primary">Xem chi tiết →</span>}
      </div>
    </>
  );

  const cardClass = cn(
    'flex min-w-0 flex-1 items-start gap-4 rounded-xl p-4 text-left',
    notification.link && 'transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-primary',
  );

  return (
    <article
      className={cn(
        'flex items-start gap-1 rounded-xl border transition-all',
        notification.isRead ? 'border-border bg-card' : 'border-primary/20 bg-primary/5 shadow-2xs',
      )}
    >
      {notification.link ? (
        <Link
          href={notification.link}
          onClick={() => {
            if (!notification.isRead) onRead(notification.id);
          }}
          className={cardClass}
        >
          {body}
        </Link>
      ) : (
        <div className={cardClass}>{body}</div>
      )}
      {!notification.isRead && (
        <div className="p-2">
          <ActionMenu
            variant="icon"
            label={`Thao tác với thông báo "${title}"`}
            items={[
              {
                label: 'Đánh dấu đã đọc',
                description: 'Không mở thông báo',
                icon: Check,
                disabled: pending,
                onSelect: () => onRead(notification.id),
              },
            ]}
          />
        </div>
      )}
    </article>
  );
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterId>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const activeFilter = FILTERS.find((item) => item.id === filter) ?? FILTERS[0];
  const params = useMemo(
    () => ({
      type: activeFilter.types,
      unread: unreadOnly || undefined,
      page,
      pageSize: 8,
    }),
    [activeFilter.types, unreadOnly, page],
  );

  const notificationsQuery = useNotifications(params);
  const unreadCountQuery = useUnreadNotificationCount();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const notifications = notificationsQuery.data?.notifications ?? [];
  const meta = notificationsQuery.data?.meta;
  const unreadCount = unreadCountQuery.data ?? 0;
  const filtered = filter !== 'all' || unreadOnly;

  const changeFilter = (id: FilterId) => {
    setFilter(id);
    setPage(1);
  };

  const showAll = () => {
    setFilter('all');
    setUnreadOnly(false);
    setPage(1);
  };

  return (
    <div className={cn(accountContainer.narrow, 'space-y-6')}>
      <AppBreadcrumb
        items={[
          { label: 'Tài khoản', href: '/account/profile' },
          { label: 'Thông báo', active: true },
        ]}
      />

      <AccountPageHeader
        title="Thông báo"
        description="Cập nhật đơn đặt phòng, thanh toán, hoàn tiền và các thay đổi từ khách sạn."
        actions={
          unreadCount > 0 && (
            <Button
              variant="ghost"
              onClick={() =>
                markAllRead.mutate(undefined, {
                  onSuccess: () => notify.success('Đã đánh dấu tất cả là đã đọc'),
                  onError: (error) => notify.error('Không đánh dấu được', getApiErrorMessage(error)),
                })
              }
              disabled={markAllRead.isPending}
              className="h-10 shrink-0 gap-1.5 self-start px-3 whitespace-nowrap md:self-auto"
            >
              {markAllRead.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
              Đánh dấu tất cả đã đọc ({unreadCount})
            </Button>
          )
        }
      />

      <Card className="space-y-5 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedFilter
            label="Lọc theo loại thông báo"
            options={FILTERS.map((item) => ({ value: item.id, label: item.label }))}
            value={filter}
            onChange={changeFilter}
          />
          <button
            type="button"
            aria-pressed={unreadOnly}
            onClick={() => {
              setUnreadOnly((value) => !value);
              setPage(1);
            }}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center gap-1.5 self-start rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors sm:self-auto',
              unreadOnly
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <span className={cn('size-2 rounded-full', unreadOnly ? 'bg-primary' : 'bg-muted-foreground/40')} aria-hidden />
            Chỉ chưa đọc
          </button>
        </div>

        {notificationsQuery.isLoading ? (
          <LoadingState rows={3} label="Đang tải thông báo…" />
        ) : notificationsQuery.error ? (
          <ErrorState
            title="Không tải được thông báo"
            error={notificationsQuery.error}
            onRetry={() => void notificationsQuery.refetch()}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filtered ? 'Không có thông báo nào khớp bộ lọc' : 'Chưa có thông báo nào'}
            description={
              unreadOnly
                ? 'Bạn đã đọc hết thông báo trong mục này.'
                : filtered
                  ? 'Thử xem tất cả thông báo của bạn.'
                  : 'Thông báo về đơn đặt phòng, thanh toán và ưu đãi sẽ xuất hiện ở đây.'
            }
            action={
              filtered && (
                <Button variant="outline" onClick={showAll} className="h-10 px-4">
                  Xem tất cả thông báo
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                pending={markRead.isPending}
                onRead={(id) => markRead.mutate(id)}
              />
            ))}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="border-t border-border pt-4">
            <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}

        {notificationsQuery.isFetching && !notificationsQuery.isLoading && (
          <p role="status" className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> Đang cập nhật…
          </p>
        )}
      </Card>
    </div>
  );
}
