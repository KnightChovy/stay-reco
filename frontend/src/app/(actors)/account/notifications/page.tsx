'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import AccountSubNav from '@/features/account/AccountSubNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCircle2,
  Calendar,
  Gift,
  ShieldAlert,
  Info,
  ChevronRight,
  Trash2,
  CheckCheck,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

type NotifFilter = 'all' | 'booking' | 'promo' | 'security';

interface NotificationItem {
  id: string;
  type: NotifFilter;
  title: string;
  message: string;
  timestamp: string;
  isUnread: boolean;
  linkText?: string;
  linkHref?: string;
}

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<NotifFilter>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'booking',
      title: 'Đặt phòng thành công #SR-261020-0842',
      message: 'Yêu cầu đặt phòng tại An Nhiên Riverside Hotel đã được xác nhận. Mã QR E-Voucher đã sẵn sàng.',
      timestamp: '10 phút trước',
      isUnread: true,
      linkText: 'Xem chi tiết đơn',
      linkHref: '/account/bookings/SR-261020-0842',
    },
    {
      id: '2',
      type: 'promo',
      title: 'Tặng bạn Voucher 15% mùa Thu Đà Lạt',
      message: 'Mã ưu đãi STAYAUTUMN15 đã được thêm vào ví voucher của bạn. Áp dụng cho resort Đà Lạt trước 30/11.',
      timestamp: '2 giờ trước',
      isUnread: true,
      linkText: 'Dùng voucher ngay',
      linkHref: '/account/rewards',
    },
    {
      id: '3',
      type: 'security',
      title: 'Cảnh báo đăng nhập từ thiết bị mới',
      message: 'Tài khoản vừa được đăng nhập trên Chrome macOS tại Đà Nẵng (IP: 118.69.192.83).',
      timestamp: '1 ngày trước',
      isUnread: false,
      linkText: 'Kiểm tra bảo mật',
      linkHref: '/account/security',
    },
    {
      id: '4',
      type: 'booking',
      title: 'Nhắc nhở nhận phòng ngày 20/10/2026',
      message: 'Chuyến đi Đà Nẵng của bạn sẽ bắt đầu sau 6 ngày nữa. Hãy kiểm tra thời tiết & gọi xe đưa đón.',
      timestamp: '2 ngày trước',
      isUnread: false,
      linkText: 'Xem hành trình',
      linkHref: '/account/bookings/SR-261020-0842',
    },
    {
      id: '5',
      type: 'promo',
      title: 'Thưởng +100 điểm StayMiles từ đánh giá',
      message: 'Đánh giá của bạn về Mộc Nhiên Eco Lodge đã được duyệt thành công.',
      timestamp: '5 ngày trước',
      isUnread: false,
      linkText: 'Xem ví điểm thưởng',
      linkHref: '/account/rewards',
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const filteredNotifs = notifications.filter(
    (n) => activeFilter === 'all' || n.type === activeFilter
  );

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const getNotifIcon = (type: NotifFilter) => {
    switch (type) {
      case 'booking':
        return <Calendar className="size-5 text-primary" />;
      case 'promo':
        return <Gift className="size-5 text-amber-500" />;
      case 'security':
        return <ShieldAlert className="size-5 text-red-500" />;
      default:
        return <Info className="size-5 text-slate-500" />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff]">
        <AccountSubNav activeTab="notifications" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Thông báo', active: true },
            ]}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Trung tâm thông báo
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Cập nhật thông tin đơn đặt phòng, ưu đãi voucher và cảnh báo an toàn tài khoản.
              </p>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllRead}
                className="h-9 px-4 text-xs font-semibold gap-1.5 shrink-0"
              >
                <CheckCheck className="size-4 text-emerald-600" /> Đánh dấu tất cả đã đọc ({unreadCount})
              </Button>
            )}
          </div>

          <Card className="p-6 bg-white border border-border shadow-xs rounded-2xl space-y-6">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border no-scrollbar">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'booking', label: 'Đặt phòng' },
                { id: 'promo', label: 'Ưu đãi & Voucher' },
                { id: 'security', label: 'Bảo mật & Hệ thống' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id as NotifFilter)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeFilter === filter.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-slate-100 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {filteredNotifs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <Bell className="size-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold">Không có thông báo nào trong mục này</p>
                </div>
              ) : (
                filteredNotifs.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                      item.isUnread
                        ? 'bg-primary/5 border-primary/20 shadow-2xs'
                        : 'bg-white border-border hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-white border border-border shadow-2xs shrink-0 mt-0.5">
                      {getNotifIcon(item.type)}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          {item.title}
                          {item.isUnread && (
                            <span className="size-2 rounded-full bg-secondary inline-block" />
                          )}
                        </h3>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" /> {item.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>

                      {item.linkText && item.linkHref && (
                        <div className="pt-2">
                          <Link
                            href={item.linkHref}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                          >
                            <span>{item.linkText}</span>
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
