'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const items = navigation.map((item) => ({
    ...item,
    isActive: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }));

  return (
    <SidebarProvider className="admin-role">
      <Sidebar items={items} roleLabel="Hệ thống quản trị" contextName="StayReco Admin" collapsibleToIcon />
      <SidebarInset className="min-w-0 bg-background">
        <Navbar
          className="sticky top-0 z-20 shrink-0"
          context={{ name: navigation.find((item) => pathname.startsWith(item.href))?.label ?? 'Quản trị hệ thống', meta: 'StayReco / Quản trị hệ thống' }}
          user={{ name: user?.name ?? 'Quản trị viên', role: 'Admin', avatarUrl: user?.avatarUrl }}
          searchPlaceholder="Tìm tên hoặc email người dùng..."
          onSearch={(query) => router.push(`/admin/users?search=${encodeURIComponent(query)}`)}
          showSidebarTrigger
          profileHref="/admin/dashboard"
        />
        <main className="min-h-[calc(100dvh-5rem)] bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto min-h-[calc(100dvh-8rem)] max-w-370">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
