"use client";

import Link from "next/link";
import { ArrowRight, FileCheck2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiBudget } from "@/features/staff/api/marketing-queries";
import { cn } from "@/lib/utils";
import {
  ErrorPanel,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  SuspendedBanner,
  usePartnerHotel,
} from "../components";
import { usePendingContentCount } from "../content-approvals/approval-queries";
import { BrandVoicePanel } from "./BrandVoicePanel";
import { SocialAccountsPanel } from "./SocialAccountsPanel";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function PartnerAiBrand() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended } = usePartnerHotel();

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Giọng thương hiệu AI"
        description="Dạy AI viết đúng giọng khách sạn và kết nối trang mạng xã hội để đăng bài đã duyệt."
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <div key={hotel.id} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <BrandVoicePanel hotelId={hotel.id} />
          <aside className="space-y-6">
            <PendingApprovalsCard hotelId={hotel.id} />
            <AiBudgetCard hotelId={hotel.id} />
            <SocialAccountsPanel hotelId={hotel.id} />
          </aside>
        </div>
      )}
    </div>
  );
}

function PendingApprovalsCard({ hotelId }: { hotelId: string }) {
  const pending = usePendingContentCount(hotelId);
  return (
    <PartnerPanel className="flex items-center gap-3 p-4">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          pending > 0 ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground",
        )}
      >
        <FileCheck2 className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {pending > 0 ? `${pending} bài chờ duyệt` : "Không có bài chờ duyệt"}
        </p>
        <p className="text-xs text-muted-foreground">Bài nhân viên soạn bằng AI</p>
      </div>
      <Link
        href="/partner/content-approvals"
        aria-label="Mở trang duyệt bài"
        className={buttonVariants({ variant: pending > 0 ? "default" : "outline", size: "sm" })}
      >
        Duyệt
        <ArrowRight />
      </Link>
    </PartnerPanel>
  );
}

function AiBudgetCard({ hotelId }: { hotelId: string }) {
  const budget = useAiBudget(hotelId);
  const data = budget.data;
  const used = data && data.limitUsd > 0 ? Math.min(100, (data.spentUsd / data.limitUsd) * 100) : 0;

  return (
    <PartnerPanel className="p-4">
      <h2 className="text-sm font-bold text-primary">Ngân sách AI tháng này</h2>
      {budget.isLoading ? (
        <Skeleton className="mt-3 h-10 w-full" />
      ) : !data ? (
        <p className="mt-2 text-xs text-muted-foreground">Không tải được ngân sách.</p>
      ) : (
        <div className="mt-2 space-y-2">
          <p className="text-sm tabular-nums text-foreground">
            <strong>{usd.format(data.spentUsd)}</strong>
            <span className="text-muted-foreground"> / {usd.format(data.limitUsd)}</span>
          </p>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Ngân sách AI đã dùng"
            aria-valuenow={Math.round(used)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn("h-full rounded-full", used >= 90 ? "bg-danger" : "bg-primary")}
              style={{ width: `${used}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Còn {usd.format(data.remainingUsd)}. Hết ngân sách thì AI tạm ngừng viết đến tháng sau.
          </p>
        </div>
      )}
    </PartnerPanel>
  );
}
