"use client";

import { useState } from "react";
import { Pencil, Percent, Plus, Power, Ticket } from "lucide-react";
import type { Promotion } from "@stayreco/shared";
import { ActionMenu } from "@/components/common/ActionBar";
import { TablePagination } from "@/components/common/table/TablePagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation, usePromotions } from "../api/partner-queries";
import {
  ConfirmDialog,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  StatusBadge,
  SuspendedBanner,
  usePartnerHotel,
} from "../components";
import { formatDate, formatMoney, type StatusTone } from "../lib/labels";
import { PromotionDialog } from "./PromotionDialog";

const PAGE_SIZE = 20;

const tabs = [
  { id: "active", label: "Đang áp dụng", active: true },
  { id: "all", label: "Tất cả", active: undefined },
] as const;
type Tab = (typeof tabs)[number]["id"];

type DialogState = { open: false } | { open: true; promotion?: Promotion };

function discountLabel(promotion: Promotion) {
  return promotion.discountType === "PERCENTAGE"
    ? `Giảm ${promotion.discountValue}%`
    : `Giảm ${formatMoney(promotion.discountValue)}`;
}

function periodLabel(promotion: Promotion) {
  const { validFrom, validTo } = promotion;
  if (validFrom && validTo) return `${formatDate(validFrom)} – ${formatDate(validTo)}`;
  if (validFrom) return `Từ ${formatDate(validFrom)}`;
  if (validTo) return `Đến hết ${formatDate(validTo)}`;
  return "Không giới hạn ngày";
}

function statusOf(promotion: Promotion): { label: string; tone: StatusTone } {
  if (promotion.usable) return { label: "Đang áp dụng", tone: "success" };
  if (!promotion.isActive) return { label: "Đã tắt", tone: "muted" };
  if (promotion.maxUses !== null && promotion.currentUses >= promotion.maxUses) return { label: "Hết lượt", tone: "warning" };
  return { label: "Ngoài thời gian", tone: "muted" };
}

export default function PartnerPromotions() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended, canEdit } = usePartnerHotel();
  const [tab, setTab] = useState<Tab>("active");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [toDeactivate, setToDeactivate] = useState<Promotion>();
  const hotelId = hotel?.id;
  const active = tabs.find((item) => item.id === tab)?.active;
  const query = usePromotions(hotelId, { active, page, pageSize: PAGE_SIZE });

  const deactivateMutation = usePartnerMutation(
    (promotion: Promotion) => partnerService.deactivatePromotion(promotion.id),
    {
      invalidate: () => [partnerKeys.promotionsOf(hotelId ?? "")],
      successMessage: (data) => `Đã tắt chiến dịch ${data.name}.`,
      onSuccess: () => setToDeactivate(undefined),
    },
  );
  const activateMutation = usePartnerMutation(
    (promotion: Promotion) => partnerService.updatePromotion(promotion.id, { isActive: true }),
    {
      invalidate: () => [partnerKeys.promotionsOf(hotelId ?? "")],
      successMessage: (data) => `Đã bật lại chiến dịch ${data.name}.`,
    },
  );

  function changeTab(next: Tab) {
    setTab(next);
    setPage(1);
  }

  const promotions = query.data?.promotions ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Chiến dịch & giảm giá"
        description="Tạo ưu đãi giảm tiền phòng. Chiến dịch tự động áp dụng cho mọi khách, hoặc chỉ qua mã riêng."
        action={
          hotel &&
          canEdit && (
            <Button onClick={() => setDialog({ open: true })}>
              <Plus />
              Tạo chiến dịch
            </Button>
          )
        }
      />
      {isSuspended && <SuspendedBanner />}

      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <>
          <div className="flex gap-2" role="tablist" aria-label="Lọc chiến dịch">
            {tabs.map((item) => (
              <Button
                key={item.id}
                role="tab"
                aria-selected={tab === item.id}
                variant={tab === item.id ? "default" : "outline"}
                onClick={() => changeTab(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {query.isLoading ? (
            <LoadingPanel />
          ) : query.error ? (
            <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
          ) : promotions.length === 0 ? (
            <EmptyPanel
              icon={Percent}
              title={tab === "active" ? "Không có chiến dịch nào đang áp dụng" : "Chưa có chiến dịch nào"}
              description="Tạo chiến dịch để lấp phòng trống mùa thấp điểm; giảm giá được tính tự động khi khách đặt."
            />
          ) : (
            <PartnerPanel className="overflow-hidden p-0">
              <ul className={cn("divide-y", query.isFetching && "opacity-60 transition-opacity")}>
                {promotions.map((promotion) => (
                  <PromotionRow
                    key={promotion.id}
                    promotion={promotion}
                    canEdit={canEdit && promotion.hotelId !== null}
                    pending={activateMutation.isPending}
                    onEdit={() => setDialog({ open: true, promotion })}
                    onDeactivate={() => setToDeactivate(promotion)}
                    onActivate={() => activateMutation.mutate(promotion)}
                  />
                ))}
              </ul>
              {meta && meta.total > meta.pageSize && (
                <TablePagination page={page} pageSize={meta.pageSize} total={meta.total} onPageChange={setPage} />
              )}
            </PartnerPanel>
          )}

          <PromotionDialog
            open={dialog.open}
            onOpenChange={(open) => !open && setDialog({ open: false })}
            hotelId={hotel.id}
            promotion={dialog.open ? dialog.promotion : undefined}
          />
          <ConfirmDialog
            open={!!toDeactivate}
            onOpenChange={(open) => !open && setToDeactivate(undefined)}
            title={`Tắt chiến dịch ${toDeactivate?.name ?? ""}?`}
            description="Khách đặt mới sẽ không được giảm nữa. Các booking đã giảm và mã đã phát giữ nguyên lịch sử; bạn có thể bật lại sau."
            confirmLabel="Tắt chiến dịch"
            destructive
            pending={deactivateMutation.isPending}
            onConfirm={() => toDeactivate && deactivateMutation.mutate(toDeactivate)}
          />
        </>
      )}
    </div>
  );
}

function PromotionRow({
  promotion,
  canEdit,
  pending,
  onEdit,
  onDeactivate,
  onActivate,
}: {
  promotion: Promotion;
  canEdit: boolean;
  pending: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
}) {
  const status = statusOf(promotion);
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-primary">{discountLabel(promotion)}</span>
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          {promotion.hotelId === null && <StatusBadge tone="info">StayReco</StatusBadge>}
        </div>
        <p className="font-semibold text-foreground">{promotion.name}</p>
        {promotion.description && <p className="text-sm text-muted-foreground">{promotion.description}</p>}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-xs sm:grid-cols-4">
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
            <dd className="font-medium tabular-nums text-foreground">
              {promotion.currentUses}
              {promotion.maxUses !== null ? ` / ${promotion.maxUses} lượt` : " lượt"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Cách áp dụng</dt>
            <dd className="flex items-center gap-1 font-medium text-foreground">
              {promotion.requiresCode ? (
                <>
                  <Ticket className="size-3.5" aria-hidden /> Qua mã riêng
                </>
              ) : (
                "Tự động khi đặt"
              )}
            </dd>
          </div>
        </dl>
      </div>
      {canEdit && (
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil />
            Sửa
          </Button>
          <ActionMenu
            variant="icon"
            label={`Thao tác với ${promotion.name}`}
            items={[
              promotion.isActive
                ? {
                    label: "Tắt chiến dịch",
                    icon: Power,
                    description: "Khách đặt mới không được giảm nữa.",
                    destructive: true,
                    onSelect: onDeactivate,
                  }
                : {
                    label: "Bật lại chiến dịch",
                    icon: Power,
                    disabled: pending,
                    onSelect: onActivate,
                  },
            ]}
          />
        </div>
      )}
    </li>
  );
}
