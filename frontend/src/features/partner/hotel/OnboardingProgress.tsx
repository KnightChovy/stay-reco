"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Hotel } from "@stayreco/shared";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRoomTypes } from "../api/partner-queries";
import { PartnerPanel } from "../components";

export type OnboardingStep = {
  label: string;
  /** Lower-case form for "Thiếu: tiện ích, chính sách". */
  short: string;
  done: boolean;
  href: string;
};

/**
 * The one count of the listing onboarding (docs/api/partner.md): six setup items, then the verification request.
 * Every screen that shows progress reads it here, so they all say the same "x/7".
 */
export function useOnboardingSteps(hotel: Hotel): OnboardingStep[] {
  const roomTypes = useRoomTypes(hotel.id);
  const roomCount = (roomTypes.data ?? []).reduce((sum, type) => sum + type.roomCount, 0);
  return [
    { label: "Thông tin cơ bản", short: "thông tin cơ bản", done: true, href: "/partner/hotel?tab=info" },
    { label: "Tiện ích", short: "tiện ích", done: hotel.amenities.length > 0, href: "/partner/hotel?tab=amenities" },
    {
      label: "Chính sách",
      short: "chính sách",
      done: Object.keys(hotel.policies).length > 0,
      href: "/partner/hotel?tab=policies",
    },
    { label: "Hình ảnh", short: "hình ảnh", done: hotel.images.length > 0, href: "/partner/hotel?tab=images" },
    {
      label: "Cấu hình phòng",
      short: "cấu hình phòng",
      done: !!hotel.roomConfig,
      href: "/partner/hotel?tab=room-config",
    },
    { label: "Loại phòng & phòng", short: "loại phòng & phòng", done: roomCount > 0, href: "/partner/rooms" },
    {
      label: "Gửi hồ sơ xác minh",
      short: "hồ sơ xác minh",
      done: hotel.status !== "DRAFT",
      href: "/partner/verification",
    },
  ];
}

/**
 * A slim progress line for screens other than "Hồ sơ & xác minh" (which shows the full journey): the count, what is
 * missing and one button to the first unfinished item.
 */
export function OnboardingStrip({ hotel, className }: { hotel: Hotel; className?: string }) {
  const steps = useOnboardingSteps(hotel);
  const done = steps.filter((step) => step.done).length;
  const missing = steps.filter((step) => !step.done);
  const next = missing[0];
  if (!next) return null;
  const setupMissing = missing.filter((step) => step.href !== "/partner/verification");

  return (
    <PartnerPanel className={cn("flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5", className)}>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm">
          <strong className="text-primary">
            Hồ sơ hoàn tất {done}/{steps.length}
          </strong>
          <span className="text-muted-foreground">
            {" · "}
            {setupMissing.length > 0
              ? `Thiếu: ${setupMissing.map((step) => step.short).join(", ")}`
              : "Thông tin đã đủ, gửi hồ sơ xác minh để mở bán"}
          </span>
        </p>
        <div
          className="h-1.5 rounded-full bg-muted"
          role="progressbar"
          aria-label="Tiến độ hồ sơ"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={done}
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
      </div>
      <Link href={next.href} scroll={false} className={cn(buttonVariants(), "h-9 shrink-0")}>
        {setupMissing.length > 0 ? (
          <>
            Tiếp tục: {next.label.toLowerCase()}
            <ArrowRight />
          </>
        ) : (
          <>
            <ShieldCheck />
            Gửi hồ sơ xác minh
          </>
        )}
      </Link>
    </PartnerPanel>
  );
}
