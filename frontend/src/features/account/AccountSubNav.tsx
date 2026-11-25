'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, Bell, Compass, Lock, Luggage, User, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadNotificationCount } from '@/features/notifications/api/notification-queries';

/** Trips first: it is what customers come to the account area for. */
export const ACCOUNT_TABS = [
  { href: '/account/bookings', label: 'Chuyến đi của tôi', icon: Luggage },
  { href: '/account/profile', label: 'Hồ sơ cá nhân', icon: User },
  { href: '/account/rewards', label: 'Voucher & Điểm thưởng', icon: Award },
  { href: '/account/wallet', label: 'Ví & Hoàn tiền', icon: Wallet },
  { href: '/account/notifications', label: 'Thông báo', icon: Bell },
  { href: '/account/preferences', label: 'Sở thích du lịch', icon: Compass },
  { href: '/account/security', label: 'Mật khẩu & bảo mật', icon: Lock },
] as const;

/** The account pages' tab bar; the active tab scrolls into view on narrow screens. Rendered once by `AccountShell`. */
export default function AccountSubNav() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);
  const unread = useUnreadNotificationCount().data ?? 0;

  // Centre the active tab inside the bar only: scrollIntoView would scroll the whole page down to the sticky bar.
  useEffect(() => {
    const tab = activeRef.current;
    const bar = tab?.parentElement;
    if (!tab || !bar) return;
    bar.scrollLeft = tab.offsetLeft - (bar.clientWidth - tab.clientWidth) / 2;
  }, [pathname]);

  return (
    <nav aria-label="Tài khoản" className="sticky top-16 z-30 w-full border-b border-border bg-card shadow-xs lg:top-20">
      <div className="relative mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
        <div className="no-scrollbar relative flex items-center gap-1 overflow-x-auto py-2">
          {ACCOUNT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                ref={isActive ? activeRef : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span>{tab.label}</span>
                {tab.href === '/account/notifications' && unread > 0 && (
                  <span
                    className={cn(
                      'min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white',
                    )}
                  >
                    {unread > 99 ? '99+' : unread}
                    <span className="sr-only"> chưa đọc</span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent sm:hidden"
          aria-hidden
        />
      </div>
    </nav>
  );
}
