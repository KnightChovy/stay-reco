"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  ChartNoAxesCombined,
  Landmark,
  LayoutDashboard,
  ShieldAlert,
  WalletCards,
} from "lucide-react";

import Sidebar, {
  SidebarProvider,
  type SidebarItem,
} from "@/components/common/sidebar/Sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import Navbar from "@/components/common/navbar/Navbar";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useAuthStore } from "@/lib/auth-store";
import { usePendingVerificationCount } from "../api/manager-queries";

/** Screens still built on the sample data of `@/lib/manager-data` until their APIs exist (Phase 6). */
const DEMO_BADGE = "Mẫu";

const navigation: Omit<SidebarItem, "isActive">[] = [
  {
    href: "/manager/dashboard",
    label: "Tổng quan điều hành",
    icon: LayoutDashboard,
    section: "TRUNG TÂM ĐIỀU HÀNH",
  },
  {
    href: "/manager/partners",
    label: "Đối tác khách sạn",
    icon: Building2,
    badge: DEMO_BADGE,
    section: "ĐỐI TÁC & RỦI RO",
  },
  {
    href: "/manager/verifications",
    label: "Xác minh đối tác",
    icon: BadgeCheck,
    section: "ĐỐI TÁC & RỦI RO",
  },
  {
    href: "/manager/compliance",
    label: "Tuân thủ & chất lượng",
    icon: ShieldAlert,
    badge: DEMO_BADGE,
    section: "ĐỐI TÁC & RỦI RO",
  },
  {
    href: "/manager/revenue",
    label: "Doanh thu nền tảng",
    icon: ChartNoAxesCombined,
    badge: DEMO_BADGE,
    section: "TÀI CHÍNH NỀN TẢNG",
  },
  {
    href: "/manager/cashflow",
    label: "Dòng tiền & đối soát",
    icon: Landmark,
    badge: DEMO_BADGE,
    section: "TÀI CHÍNH NỀN TẢNG",
  },
  {
    href: "/manager/transactions",
    label: "Giao dịch & quyết toán",
    icon: WalletCards,
    badge: DEMO_BADGE,
    section: "TÀI CHÍNH NỀN TẢNG",
  },
];

export function ManagerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  // The one real count of the sidebar: requests waiting for a decision.
  const { count: pendingVerifications } = usePendingVerificationCount();
  const items = navigation.map((item) => ({
    ...item,
    isActive: pathname === item.href,
    badge:
      item.href === "/manager/verifications" && pendingVerifications > 0
        ? pendingVerifications
        : item.badge,
  }));

  return (
    <SidebarProvider>
      <a
        href="#manager-main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Bỏ qua điều hướng
      </a>
      {/* Logout is in the account menu of the navbar, so the sidebar does not repeat it. */}
      <Sidebar items={items} roleLabel="Vận hành nền tảng" contextName="Thị trường Việt Nam" showLogout={false} />
      <SidebarInset className="min-w-0 bg-background">
        <Navbar
          // No context box: its partner count and "system stable" status were sample figures shown as live ones.
          user={{ name: user?.name ?? "Quản lý nền tảng", role: "Quản lý nền tảng", avatarUrl: user?.avatarUrl }}
          // The verification queue is the one searchable list (hotel name), so the header search opens it.
          searchPlaceholder="Tìm hồ sơ xác minh theo tên khách sạn"
          onSearch={(query) => {
            if (query) router.push(`/manager/verifications?search=${encodeURIComponent(query)}`);
          }}
          notifications={<NotificationBell allHref={null} />}
          showSidebarTrigger
          profileHref="/manager/profile"
        />
        <main
          id="manager-main"
          tabIndex={-1}
          className="min-h-[calc(100dvh-5rem)] bg-background p-3 outline-none sm:p-4 lg:p-5"
        >
          <div className="sr-dense-ui mx-auto min-h-[calc(100dvh-8rem)] max-w-[1480px] rounded-[1.5rem] bg-card p-4 shadow-[0_1px_2px_rgb(32_43_54/4%),0_18px_48px_rgb(32_43_54/6%)] ring-1 ring-border/70 md:p-5 xl:p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
