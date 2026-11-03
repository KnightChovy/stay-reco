"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  BookOpenCheck,
  Briefcase,
  Building,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  FolderKanban,
  LayoutDashboard,
  Megaphone,
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
import { useAuthStore } from "@/lib/auth-store";
import { useRefundQueueCount } from "../api/partner-queries";
import { usePartnerHotel } from "../components";
import { hotelStatusLabels } from "../lib/labels";

/** Sidebar dropdowns, in display order; "Tổng quan" has no section, so it stays on top as a plain link. */
const sections = {
  "Kinh doanh": Briefcase,
  "Vận hành cơ sở": Building,
  "Tiếp thị & khách hàng": Megaphone,
  "Tổ chức & hồ sơ": FolderKanban,
};

const navigation: Omit<SidebarItem, "isActive">[] = [
  {
    href: "/partner/dashboard",
    label: "Tổng quan",
    icon: LayoutDashboard,
  },
  {
    href: "/partner/bookings",
    label: "Đặt phòng",
    icon: BookOpenCheck,
    section: "Kinh doanh",
  },
  {
    href: "/partner/revenue",
    label: "Doanh thu & đối soát",
    icon: ChartNoAxesCombined,
    section: "Kinh doanh",
  },
  {
    href: "/partner/hotel",
    label: "Khách sạn & cơ sở",
    icon: Building2,
    section: "Vận hành cơ sở",
  },
  {
    href: "/partner/rooms",
    label: "Kho phòng",
    icon: BedDouble,
    section: "Vận hành cơ sở",
  },
  {
    href: "/partner/availability",
    label: "Lịch tồn & khả dụng",
    icon: CalendarDays,
    section: "Vận hành cơ sở",
  },
  {
    href: "/partner/pricing",
    label: "Luật giá & mùa vụ",
    icon: Tags,
    section: "Vận hành cơ sở",
  },
  {
    href: "/partner/promotions",
    label: "Chiến dịch & giảm giá",
    icon: Percent,
    section: "Tiếp thị & khách hàng",
  },
  {
    href: "/partner/loyalty",
    label: "Khách hàng thân thiết",
    icon: UsersRound,
    section: "Tiếp thị & khách hàng",
  },
  {
    href: "/partner/ai-brand",
    label: "Giọng thương hiệu AI",
    icon: Sparkles,
    section: "Tiếp thị & khách hàng",
  },
  {
    href: "/partner/staff",
    label: "Nhân viên & phân quyền",
    icon: UsersRound,
    section: "Tổ chức & hồ sơ",
  },
  {
    href: "/partner/verification",
    label: "Hồ sơ & xác minh",
    icon: ShieldCheck,
    section: "Tổ chức & hồ sơ",
  },
];

export function PartnerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { hotel, hotels, selectHotel } = usePartnerHotel();
  // Refund requests wait for the partner's decision, so they are the bookings badge.
  const { count: refundQueue } = useRefundQueueCount(hotel?.id);
  const items = navigation.map((item) => ({
    ...item,
    isActive: pathname === item.href,
    badge: item.href === "/partner/bookings" && refundQueue > 0 ? refundQueue : item.badge,
  }));
  const hotelMeta = hotel
    ? [hotel.starRating ? `${hotel.starRating}-Star` : null, hotel.city].filter(Boolean).join(" · ")
    : undefined;

  return (
    <SidebarProvider>
      {/* The hotel is shown and picked in the header, so the sidebar has no context block. */}
      <Sidebar items={items} collapsibleSections={sections} collapsibleToIcon />
      <SidebarInset className="min-w-0 bg-background">
        <Navbar
          // Stays on top while the page scrolls: the hotel picker and the notifications remain at hand.
          className="sticky top-0 z-30"
          context={
            hotel
              ? {
                  name: hotel.name,
                  meta: hotelMeta,
                  status: hotelStatusLabels[hotel.status].label,
                  // The one hotel picker of the portal: every hotel-scoped screen follows the selection.
                  options: hotels.map((item) => ({
                    id: item.id,
                    name: item.name,
                    meta: `${item.city} · ${hotelStatusLabels[item.status].label}`,
                  })),
                  selectedId: hotel.id,
                  onSelect: selectHotel,
                }
              : undefined
          }
          user={{ name: user?.name ?? "Đối tác", role: "Chủ cơ sở", avatarUrl: user?.avatarUrl }}
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
