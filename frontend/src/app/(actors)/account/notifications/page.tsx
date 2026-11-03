'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import AccountSubNav from '@/features/account/AccountSubNav';
import Pagination from '@/components/common/pagination/Pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  Clock,
} from 'lucide-react';
import type { NotificationType } from '@stayreco/shared';
import { getApiErrorMessage } from '@/lib/api-error';
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
  { id: 'promo', label: 'Ưu đãi & Voucher', types: ['PROMOTION'] },
  { id: 'system', label: 'Bảo mật & Hệ thống', types: ['REVIEW', 'ALERT', 'SYSTEM'] },
];

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

  const changeFilter = (id: FilterId) => {
    setFilter(id);
    setPage(1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
      <Header />

      <main className="w-full flex-1 bg-[#f7f9ff]">
        <AccountSubNav activeTab="notifications" />

        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Thông báo', active: true },
            ]}
          />

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Trung tâm thông báo
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Cập nhật đơn đặt phòng, thanh toán, hoàn tiền và các thay đổi từ khách sạn.
              </p>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="h-9 shrink-0 gap-1.5 px-4 text-xs font-semibold"
              >
                <CheckCheck className="size-4 text-emerald-600" />
                Đánh dấu tất cả đã đọc ({unreadCount})
              </Button>
            )}
          </div>

          <Card className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => changeFilter(item.id)}
                    className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      filter === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-slate-100 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setUnreadOnly((value) => !value);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  unreadOnly
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className={`size-2 rounded-full ${unreadOnly ? 'bg-primary' : 'bg-slate-300'}`} />
                Chỉ chưa đọc
              </button>
            </div>

            {notificationsQuery.error && (
              <Alert variant="destructive" className="bg-red-50 p-4">
                <AlertTitle>Không tải được thông báo</AlertTitle>
                <AlertDescription className="mt-1 flex flex-col items-start gap-3">
                  <span>{getApiErrorMessage(notificationsQuery.error, 'Vui lòng thử lại sau.')}</span>
                  <Button size="sm" variant="outline" onClick={() => void notificationsQuery.refetch()}>
                    Thử lại
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {notificationsQuery.isLoading && (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            )}

            {!notificationsQuery.isLoading && !notificationsQuery.error && notifications.length === 0 && (
              <div className="space-y-2 py-12 text-center text-muted-foreground">
                <Bell className="mx-auto size-10 text-slate-300" />
                <p className="text-sm font-semibold">Không có thông báo nào</p>
                <p className="text-xs">
                  {unreadOnly ? 'Bạn đã đọc hết thông báo trong mục này.' : 'Thông báo mới sẽ xuất hiện ở đây.'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = TYPE_ICON[notification.type];
                return (
                  <article
                    key={notification.id}
                    className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${
                      notification.isRead
                        ? 'border-border bg-white hover:bg-slate-50'
                        : 'border-primary/20 bg-primary/5 shadow-2xs'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white shadow-2xs ${TYPE_TONE[notification.type]}`}
                    >
                      <Icon className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                          {notification.title ?? TYPE_LABEL[notification.type]}
                          {!notification.isRead && <span className="inline-block size-2 rounded-full bg-secondary" />}
                        </h3>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="size-3" /> {timeAgo(notification.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-border text-[10px] font-semibold text-muted-foreground">
                          {TYPE_LABEL[notification.type]}
                        </Badge>
                      </div>

                      <p className="text-xs leading-relaxed text-muted-foreground">{notification.message}</p>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={() => {
                              if (!notification.isRead) markRead.mutate(notification.id);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                          >
                            Xem chi tiết <ArrowRight className="size-3.5" />
                          </Link>
                        )}

                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() => markRead.mutate(notification.id)}
                            disabled={markRead.isPending}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-emerald-600"
                          >
                            <Check className="size-3.5" /> Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="border-t border-border pt-4">
                <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
              </div>
            )}

            {notificationsQuery.isFetching && !notificationsQuery.isLoading && (
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <AlertCircle className="size-3.5" /> Đang cập nhật…
              </p>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
