"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import type { Hotel } from "@stayreco/shared";
import { useRoomTypes } from "../api/partner-queries";
import { PartnerPanel } from "../components";

/** The listing flow of docs/api/partner.md, checked against the hotel's current data. */
export function HotelSetupChecklist({ hotel }: { hotel: Hotel }) {
  const roomTypes = useRoomTypes(hotel.id);
  const roomCount = (roomTypes.data ?? []).reduce((sum, type) => sum + type.roomCount, 0);
  const steps: Array<{ label: string; done: boolean; href: string }> = [
    { label: "Thông tin cơ bản", done: true, href: "/partner/hotel?tab=info" },
    { label: "Tiện ích", done: hotel.amenities.length > 0, href: "/partner/hotel?tab=amenities" },
    { label: "Chính sách", done: Object.keys(hotel.policies).length > 0, href: "/partner/hotel?tab=policies" },
    { label: "Hình ảnh", done: hotel.images.length > 0, href: "/partner/hotel?tab=images" },
    { label: "Cấu hình phòng", done: !!hotel.roomConfig, href: "/partner/hotel?tab=room-config" },
    { label: "Loại phòng & phòng", done: roomCount > 0, href: "/partner/rooms" },
    { label: "Gửi hồ sơ xác minh", done: hotel.status !== "DRAFT", href: "/partner/verification" },
  ];
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <PartnerPanel className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-primary">Tiến độ đăng ký</h2>
        <strong className="text-primary">
          {doneCount}/{steps.length}
        </strong>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
      <ol className="mt-4 space-y-1">
        {steps.map((step) => {
          const Icon = step.done ? CheckCircle2 : Circle;
          return (
            <li key={step.label}>
              <Link
                href={step.href}
                scroll={false}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Icon size={16} className={step.done ? "text-success" : "text-muted-foreground"} />
                <span className={step.done ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </PartnerPanel>
  );
}
