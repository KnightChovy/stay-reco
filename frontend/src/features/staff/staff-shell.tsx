'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangle, BadgePercent, CalendarDays, Inbox, KeyRound, LayoutDashboard, LineChart, LogOut, ReceiptText, Sparkles } from 'lucide-react';
import Navbar from '@/components/common/navbar/Navbar';
import Sidebar, { SidebarProvider, type SidebarItem } from '@/components/common/sidebar/Sidebar';
import { SidebarInset } from '@/components/ui/sidebar';

const navigation: Omit<SidebarItem, 'isActive'>[] = [
  { href: '/staff/dashboard', label: 'Tổng quan ca làm', icon: LayoutDashboard, section: 'TÁC VỤ VẬN HÀNH' },
  { href: '/staff/bookings', label: 'Danh sách đặt phòng', icon: ReceiptText, section: 'TÁC VỤ VẬN HÀNH' },
  { href: '/staff/check-in', label: 'Check-in & Gán phòng', icon: KeyRound, section: 'TÁC VỤ VẬN HÀNH' },
  { href: '/staff/check-out', label: 'Check-out', icon: LogOut, section: 'TÁC VỤ VẬN HÀNH' },
  { href: '/staff/inbox', label: 'Hộp thư & Khiếu nại', icon: Inbox, badge: 2, section: 'TÁC VỤ VẬN HÀNH' },
  { href: '/staff/refunds', label: 'Hoàn tiền & Chính sách', icon: BadgePercent, section: 'TÁC VỤ VẬN HÀNH' },
  { href: '/staff/alerts', label: 'Cảnh báo nghiệp vụ', icon: AlertTriangle, badge: 1, section: 'TÁC VỤ VẬN HÀNH' },
  { href: '/staff/marketing/content', label: 'Thư viện nội dung AI', icon: Sparkles, section: 'NỘI DUNG & MARKETING' },
  { href: '/staff/marketing/calendar', label: 'Lịch đăng & Kết nối kênh', icon: CalendarDays, section: 'NỘI DUNG & MARKETING' },
  { href: '/staff/marketing/analytics', label: 'Hiệu quả tiếp thị', icon: LineChart, section: 'NỘI DUNG & MARKETING' },
];

export function StaffShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const items = navigation.map((item) => ({
    ...item,
    isActive: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }));

  return (
    <SidebarProvider>
      <Sidebar items={items} roleLabel="Staff Operations" contextName="An Nhiên Riverside Hotel" />
      <SidebarInset className="min-w-0 bg-background">
        <Navbar
          context={{ name: 'An Nhiên Riverside Hotel', meta: 'Ca sáng · Đà Nẵng', status: 'Đang trực' }}
          user={{ name: 'Nguyễn Hương Ly', role: 'Trưởng ca Lễ tân' }}
          notificationCount={2}
          searchPlaceholder="Tìm đặt phòng, khách lưu trú hoặc phòng..."
          showSidebarTrigger
          profileHref="/staff/dashboard"
        />
        <main className="min-h-[calc(100dvh-5rem)] bg-background p-3 sm:p-4 lg:p-5">
          <div className="sr-dense-ui mx-auto min-h-[calc(100dvh-8rem)] max-w-[1480px] rounded-[1.5rem] bg-card p-4 shadow-[0_1px_2px_rgb(32_43_54/4%),0_18px_48px_rgb(32_43_54/6%)] ring-1 ring-border/70 md:p-5 xl:p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
