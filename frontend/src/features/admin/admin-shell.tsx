'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { CreditCard, LayoutDashboard, ReceiptText, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import Sidebar, { SidebarProvider, type SidebarItem } from '@/components/common/sidebar/Sidebar';
import Navbar from '@/components/common/navbar/Navbar';
import { SidebarInset } from '@/components/ui/sidebar';
import { useAuthStore } from '@/lib/auth-store';

const navigation: Omit<SidebarItem, 'isActive'>[] = [
  { href: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard, section: 'QUẢN TRỊ HỆ THỐNG' },
  { href: '/admin/users', label: 'Người dùng & Phân quyền', icon: UsersRound, section: 'QUẢN TRỊ HỆ THỐNG' },
  { href: '/admin/payment-settings', label: 'Cấu hình thanh toán', icon: CreditCard, section: 'TÀI CHÍNH & CẤU HÌNH' },
  { href: '/admin/transactions', label: 'Nhật ký giao dịch', icon: ReceiptText, section: 'TÀI CHÍNH & CẤU HÌNH' },
  { href: '/admin/logs', label: 'Nhật ký & Bảo mật', icon: ShieldCheck, section: 'AN TOÀN HỆ THỐNG' },
  { href: '/admin/ai-settings', label: 'Cấu hình AI toàn hệ thống', icon: Sparkles, section: 'AN TOÀN HỆ THỐNG' },
];

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const items = navigation.map((item) => ({
    ...item,
    isActive: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }));

  return (
    <SidebarProvider>
      <Sidebar items={items} roleLabel="System Administration" contextName="StayReco Platform" />
      <SidebarInset className="min-w-0 bg-background">
        <Navbar
          context={{ name: 'Trung tâm quản trị StayReco' }}
          user={{ name: user?.name ?? 'Quản trị viên', role: 'Admin', avatarUrl: user?.avatarUrl }}
          searchPlaceholder="Tìm người dùng, giao dịch hoặc cấu hình..."
          showSidebarTrigger
          profileHref="/admin/dashboard"
        />
        <main className="min-h-[calc(100dvh-5rem)] bg-background p-3 sm:p-4 lg:p-5">
          <div className="sr-dense-ui mx-auto min-h-[calc(100dvh-8rem)] max-w-370 rounded-3xl bg-card p-4 shadow-[0_1px_2px_rgb(32_43_54/4%),0_18px_48px_rgb(32_43_54/6%)] ring-1 ring-border/70 md:p-5 xl:p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
