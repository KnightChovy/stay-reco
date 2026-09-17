'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ReceiptText,
  KeyRound,
  LogOut,
  Inbox,
  BadgePercent,
  AlertTriangle,
  Sparkles,
  CalendarDays,
  LineChart,
  QrCode,
  Hotel,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

export default function StaffSidebar() {
  const pathname = usePathname();

  const navItemsOps = [
    { href: '/staff/dashboard', label: 'Tổng quan ca làm', icon: LayoutDashboard },
    { href: '/staff/bookings', label: 'Danh sách đặt phòng', icon: ReceiptText },
    { href: '/staff/check-in', label: 'Check-in & Gán phòng', icon: KeyRound },
    { href: '/staff/check-out', label: 'Check-out', icon: LogOut },
    { href: '/staff/inbox', label: 'Hộp thư & Khiếu nại', icon: Inbox, badge: '2', badgeColor: 'bg-orange-100 text-[#934a33]' },
    { href: '/staff/refunds', label: 'Hoàn tiền & Chính sách', icon: BadgePercent },
    { href: '/staff/alerts', label: 'Cảnh báo nghiệp vụ', icon: AlertTriangle, badge: '1', badgeColor: 'bg-red-100 text-red-700' },
  ];

  const navItemsMarketing = [
    { href: '/staff/marketing/content', label: 'Thư viện nội dung AI', icon: Sparkles },
    { href: '/staff/marketing/calendar', label: 'Lịch đăng & Kết nối kênh', icon: CalendarDays },
    { href: '/staff/marketing/analytics', label: 'Hiệu quả tiếp thị', icon: LineChart },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[248px] bg-white z-50 flex flex-col shadow-xs border-r border-border font-sans antialiased">
      {/* Hotel Switcher Header */}
      <div className="h-16 px-4 flex items-center gap-3 bg-slate-50 border-b border-border">
        <div className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
          <Hotel className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-foreground truncate leading-tight">An Nhiên Riverside</div>
          <div className="text-[11px] text-muted-foreground truncate">128 Bạch Đằng, Đà Nẵng</div>
        </div>
        <button type="button" className="text-muted-foreground hover:text-foreground p-1 rounded">
          <ChevronDown className="size-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <nav className="space-y-1">
          <div className="px-2 pb-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Tác vụ vận hành
          </div>
          {navItemsOps.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/staff/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors font-medium ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <nav className="space-y-1">
          <div className="px-2 pb-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Nội dung & Marketing
          </div>
          {navItemsMarketing.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors font-medium ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 bg-slate-50 border-t border-border space-y-3">
        <Link href="/staff/check-in" className="block">
          <button
            type="button"
            className="w-full h-10 px-3 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold shadow-2xs hover:bg-[#193b56] transition-colors"
          >
            <QrCode className="size-4" />
            <span>Quét mã QR Voucher</span>
          </button>
        </Link>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate">PMS Đồng bộ 10:45</span>
          </div>
          <span className="font-mono">v2.4</span>
        </div>
      </div>
    </aside>
  );
}
