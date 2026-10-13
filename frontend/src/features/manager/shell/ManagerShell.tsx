"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
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
    section: "ĐỐI TÁC & RỦI RO",
  },
  {
    href: "/manager/verifications",
    label: "Xác minh đối tác",
    icon: BadgeCheck,
    badge: 12,
    section: "ĐỐI TÁC & RỦI RO",
  },
  {
    href: "/manager/compliance",
    label: "Tuân thủ & chất lượng",
    icon: ShieldAlert,
    badge: 3,
    section: "ĐỐI TÁC & RỦI RO",
  },
  {
    href: "/manager/revenue",
    label: "Doanh thu nền tảng",
    icon: ChartNoAxesCombined,
    section: "TÀI CHÍNH NỀN TẢNG",
  },
  {
    href: "/manager/cashflow",
    label: "Dòng tiền & đối soát",
    icon: Landmark,
    section: "TÀI CHÍNH NỀN TẢNG",
  },
  {
    href: "/manager/transactions",
    label: "Giao dịch & quyết toán",
    icon: WalletCards,
    badge: 6,
    section: "TÀI CHÍNH NỀN TẢNG",
  },
];

export function ManagerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const items = navigation.map((item) => ({
    ...item,
    isActive: pathname === item.href,
  }));

  return (
    <SidebarProvider>
      <Sidebar
        items={items}
        roleLabel="Platform Operations"
        contextName="Thị trường Việt Nam"
      />
      <SidebarInset className="min-w-0 bg-background">
        <Navbar
          context={{
            name: "Trung tâm điều hành Việt Nam",
            meta: "248 đối tác · 32 tỉnh thành",
            status: "Hệ thống ổn định",
          }}
          user={{ name: "Trần Đình Quân", role: "Platform Manager" }}
          notificationCount={3}
          searchPlaceholder="Tìm đối tác, giao dịch hoặc hồ sơ..."
          showSidebarTrigger
          profileHref="/manager/profile"
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
