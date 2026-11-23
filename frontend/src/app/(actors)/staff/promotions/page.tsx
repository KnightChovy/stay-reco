"use client";

import { useState } from "react";
import { BadgePercent, Globe2, Ticket } from "lucide-react";
import type { Promotion } from "@stayreco/shared";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHotelPromotions } from "@/features/staff/api/staff-queries";
import { useStaffHotel } from "@/features/staff/components/StaffHotelProvider";
import { formatCalendarDate, formatMoney } from "@/features/staff/lib/labels";

const PAGE_SIZE = 50;

const TABS = [
  { id: "active", label: "Đang áp dụng", active: true },
  { id: "all", label: "Tất cả", active: undefined },
] as const;

function discountLabel(promotion: Promotion) {
  return promotion.discountType === "PERCENTAGE"
    ? `Giảm ${promotion.discountValue}%`
    : `Giảm ${formatMoney(promotion.discountValue)}`;
}

function periodLabel(promotion: Promotion) {
  const { validFrom, validTo } = promotion;
  if (validFrom && validTo) return `${formatCalendarDate(validFrom)} – ${formatCalendarDate(validTo)}`;
  if (validFrom) return `Từ ${formatCalendarDate(validFrom)}`;
  if (validTo) return `Đến hết ${formatCalendarDate(validTo)}`;
  return "Không giới hạn ngày";
}

/** Why a campaign that is not usable today is not: what the front desk tells a guest who asks about it. */
function statusOf(promotion: Promotion) {
  if (promotion.usable) return { label: "Đang áp dụng", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" };
  if (!promotion.isActive) return { label: "Đã tắt", tone: "bg-muted text-muted-foreground ring-border" };
  if (promotion.maxUses !== null && promotion.currentUses >= promotion.maxUses)
    return { label: "Hết lượt", tone: "bg-amber-50 text-amber-800 ring-amber-200" };
  return { label: "Ngoài thời gian", tone: "bg-muted text-muted-foreground ring-border" };
}

/**
 * Read-only list of the hotel's discount campaigns (`GET /hotels/:id/promotions`), so the front desk can answer
 * "is there a discount?" on the phone. Campaigns are created and changed by the owner in the partner portal; the
 * discount itself is applied by the booking, never by staff.
 */
export default function StaffPromotionsPage() {
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("active");
  const active = TABS.find((item) => item.id === tab)?.active;
  const query = useHotelPromotions(hotelId, { active, pageSize: PAGE_SIZE });
  const promotions = query.data?.promotions ?? [];
  const total = query.data?.meta?.total ?? promotions.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <BadgePercent className="size-6 text-primary" aria-hidden /> Ưu đãi của khách sạn
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Các chương trình giảm giá khách có thể dùng khi đặt phòng. Chỉ xem; ưu đãi do chủ khách sạn tạo và giảm giá được
          tính tự động lúc khách đặt.
        </p>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Lọc ưu đãi">
        {TABS.map((item) => (
          <Button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            variant={tab === item.id ? "default" : "outline"}
            className="h-10 px-4"
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {query.error ? (
        <ErrorState title="Không tải được ưu đãi" error={query.error} onRetry={() => void query.refetch()} />
      ) : hotelLoading || query.isLoading ? (
        <LoadingState rows={3} label="Đang tải ưu đãi…" />
      ) : promotions.length === 0 ? (
        <EmptyState
          icon={BadgePercent}
          title={tab === "active" ? "Không có ưu đãi nào đang áp dụng" : "Khách sạn chưa có ưu đãi nào"}
          description="Khách đặt phòng với giá thường. Chủ khách sạn tạo ưu đãi trong cổng đối tác."
        />
      ) : (
        <>
          <ul className={cn("grid gap-3 md:grid-cols-2", query.isFetching && "opacity-60 transition-opacity")}>
            {promotions.map((promotion) => {
              const status = statusOf(promotion);
              return (
                <li key={promotion.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-primary">{discountLabel(promotion)}</p>
                      <h2 className="text-sm font-semibold text-foreground">{promotion.name}</h2>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1", status.tone)}>
                      {status.label}
                    </span>
                  </div>
                  {promotion.description && (
                    <p className="text-sm leading-relaxed text-muted-foreground">{promotion.description}</p>
                  )}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Thời gian</dt>
                      <dd className="font-medium text-foreground">{periodLabel(promotion)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Đơn tối thiểu</dt>
                      <dd className="font-medium text-foreground">
                        {promotion.minBookingAmount ? formatMoney(promotion.minBookingAmount) : "Không yêu cầu"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Đã dùng</dt>
                      <dd className="font-medium text-foreground">
                        {promotion.currentUses}
                        {promotion.maxUses !== null ? ` / ${promotion.maxUses} lượt` : " lượt"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Cách dùng</dt>
                      <dd className="flex items-center gap-1 font-medium text-foreground">
                        {promotion.requiresCode ? (
                          <>
                            <Ticket className="size-3.5" aria-hidden /> Khách nhập mã riêng
                          </>
                        ) : (
                          "Tự động khi đặt"
                        )}
                      </dd>
                    </div>
                  </dl>
                  {promotion.hotelId === null && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe2 className="size-3.5" aria-hidden /> Chương trình của StayReco cho mọi khách sạn
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          {total > promotions.length && (
            <p className="text-center text-xs text-muted-foreground">
              Đang hiện {promotions.length} / {total} ưu đãi gần nhất.
            </p>
          )}
        </>
      )}
    </div>
  );
}
