'use client';

import React from 'react';
import Link from 'next/link';
import {
  User,
  Lock,
  Bell,
  Compass,
  Award,
  Luggage,
  Wallet
} from 'lucide-react';

interface AccountSubNavProps {
  activeTab: 'profile' | 'security' | 'notifications' | 'preferences' | 'rewards' | 'bookings' | 'wallet';
}

export default function AccountSubNav({ activeTab }: AccountSubNavProps) {
  const tabs = [
    { id: 'profile', label: 'Hồ sơ cá nhân', href: '/account/profile', icon: User },
    { id: 'security', label: 'Mật khẩu & bảo mật', href: '/account/security', icon: Lock },
    { id: 'notifications', label: 'Thông báo', href: '/account/notifications', icon: Bell },
    { id: 'preferences', label: 'Sở thích du lịch', href: '/account/preferences', icon: Compass },
    { id: 'rewards', label: 'Voucher & Điểm thưởng', href: '/account/rewards', icon: Award },
    { id: 'wallet', label: 'Ví & Hoàn tiền', href: '/account/wallet', icon: Wallet },
    { id: 'bookings', label: 'Chuyến đi của tôi', href: '/account/bookings', icon: Luggage },
  ];

  return (
    <div className="sticky top-16 z-30 w-full border-b border-border bg-white shadow-xs lg:top-20">
      <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link key={tab.id} href={tab.href}>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-slate-100'
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{tab.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
