"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  BookOpenCheck,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  LayoutDashboard,
  Percent,
  ShieldCheck,
  Sparkles,
  Tags,
  UsersRound,
} from "lucide-react";
import Navbar from "@/components/common/navbar/Navbar";
import Sidebar, {
  SidebarProvider,
  type SidebarItem,
} from "@/components/common/sidebar/Sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

const navigation: Omit<SidebarItem, "isActive">[] = [
  {
    href: "/partner/dashboard",
    label: "Tổng quan",
    icon: LayoutDashboard,
    section: "KINH DOANH",
  },
  {
    href: "/partner/bookings",
    label: "Đặt phòng",
    icon: BookOpenCheck,
    badge: 5,
    section: "KINH DOANH",
  },
  {
    href: "/partner/revenue",
    label: "Doanh thu & đối soát",
    icon: ChartNoAxesCombined,
    section: "KINH DOANH",
  },
  {
    href: "/partner/hotel",
    label: "Khách sạn & cơ sở",
    icon: Building2,
    section: "VẬN HÀNH CƠ SỞ",
  },
  {
    href: "/partner/rooms",
    label: "Kho phòng",
    icon: BedDouble,
    section: "VẬN HÀNH CƠ SỞ",
  },
  {
    href: "/partner/availability",
    label: "Lịch tồn & khả dụng",
    icon: CalendarDays,
    section: "VẬN HÀNH CƠ SỞ",
  },
  {
    href: "/partner/pricing",
    label: "Luật giá & mùa vụ",
    icon: Tags,
    section: "VẬN HÀNH CƠ SỞ",
  },
  {
    href: "/partner/promotions",
    label: "Chiến dịch & giảm giá",
    icon: Percent,
    section: "TIẾP THỊ & KHÁCH HÀNG",
  },
  {
    href: "/partner/loyalty",
    label: "Khách hàng thân thiết",
    icon: UsersRound,
    section: "TIẾP THỊ & KHÁCH HÀNG",
  },
  {
    href: "/partner/ai-brand",
    label: "Giọng thương hiệu AI",
    icon: Sparkles,
    section: "TIẾP THỊ & KHÁCH HÀNG",
  },
  {
    href: "/partner/staff",
    label: "Nhân viên & phân quyền",
    icon: UsersRound,
    section: "TỔ CHỨC & HỒ SƠ",
  },
  {
    href: "/partner/verification",
    label: "Hồ sơ & xác minh",
    icon: ShieldCheck,
    badge: 1,
    section: "TỔ CHỨC & HỒ SƠ",
  },
];

export function PartnerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const items = navigation.map((item) => ({
    ...item,
    isActive: pathname === item.href,
  }));

  return (
    <SidebarProvider>
      <Sidebar
        items={items}
        roleLabel="Partner Portal"
        contextName="An Nhiên Riverside Hotel"
      />
      <SidebarInset className="min-w-0 bg-background">
        <Navbar
          context={{
            name: "An Nhiên Riverside Hotel",
            meta: "4-Star · Đà Nẵng",
            status: "Đã xác minh",
          }}
          user={{ name: "Nguyễn Minh Anh", role: "Chủ cơ sở" }}
          notificationCount={3}
          searchPlaceholder="Tìm booking, khách lưu trú hoặc phòng..."
          showSidebarTrigger
          profileHref="/partner/profile"
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
