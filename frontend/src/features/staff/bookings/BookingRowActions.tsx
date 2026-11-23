"use client";

import Link from "next/link";
import { BedDouble, Copy, ExternalLink, LogOut, Receipt } from "lucide-react";
import type { BookingSummary } from "@stayreco/shared";
import { ActionMenu, type ActionMenuItem } from "@/components/common/ActionBar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The one thing the front desk most likely does next with a booking (a calendar date `today`, "YYYY-MM-DD"). */
export function primaryStaffAction(booking: BookingSummary, today: string) {
  if (booking.status === "CONFIRMED" && booking.paymentStatus === "PAID" && booking.checkIn <= today && booking.checkOut > today) {
    return { label: "Nhận phòng", href: `/staff/check-in?code=${encodeURIComponent(booking.code)}`, icon: BedDouble };
  }
  if (booking.status === "CHECKED_IN") {
    return { label: "Trả phòng", href: `/staff/check-out?code=${encodeURIComponent(booking.code)}`, icon: LogOut };
  }
  if (booking.paymentStatus === "REFUND_PENDING") {
    return { label: "Xử lý hoàn tiền", href: "/staff/refunds", icon: Receipt };
  }
  return { label: "Chi tiết", href: `/staff/bookings/${booking.id}`, icon: ExternalLink };
}

/** One primary link and a "⋯" menu with the rest. */
export function BookingRowActions({
  booking,
  today,
  onCopy,
  className,
}: {
  booking: BookingSummary;
  today: string;
  onCopy: (code: string) => void;
  className?: string;
}) {
  const primary = primaryStaffAction(booking, today);
  const detailHref = `/staff/bookings/${booking.id}`;
  const items: ActionMenuItem[] = [
    ...(primary.href !== detailHref ? [{ label: "Xem chi tiết", icon: ExternalLink, href: detailHref }] : []),
    { label: "Sao chép mã đơn", icon: Copy, onSelect: () => onCopy(booking.code) },
  ];
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Link
        href={primary.href}
        className={cn(
          buttonVariants({ variant: primary.label === "Chi tiết" ? "outline" : "default" }),
          "h-10 gap-1.5 whitespace-nowrap px-3 text-xs font-semibold",
        )}
      >
        <primary.icon className="size-4" aria-hidden /> {primary.label}
      </Link>
      <ActionMenu variant="icon" label={`Thêm thao tác cho đơn ${booking.code}`} items={items} />
    </div>
  );
}
