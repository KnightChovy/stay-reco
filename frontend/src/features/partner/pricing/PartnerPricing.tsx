"use client";

import { useState } from "react";
import { Calculator, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import type { PricingRule, RoomType } from "@stayreco/shared";
import { TableCommon, type CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import * as partnerService from "@/services/partner.service";
import {
  partnerKeys,
  usePartnerMutation,
  usePricePreview,
  usePricingRules,
  useRoomTypes,
} from "../api/partner-queries";
import {
  ConfirmDialog,
  EmptyPanel,
  ErrorPanel,
  FormField,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  StatusBadge,
  SuspendedBanner,
  usePartnerHotel,
} from "../components";
import { todayInVietnam } from "../lib/dates";
import {
  dayOfWeekLabels,
  formatDate,
  formatMoney,
  pricingRuleTypeLabels,
} from "../lib/labels";
import { PricingRuleDialog } from "./PricingRuleDialog";

export default function PartnerPricing() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended } = usePartnerHotel();

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Luật giá & mùa vụ"
        description="Điều chỉnh giá cơ bản của loại phòng theo mùa, theo ngày trong tuần, khi khách đặt sớm hoặc đặt phút chót. Mỗi đêm chỉ áp dụng một luật."
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <PricingWorkspace key={hotel.id} hotelId={hotel.id} />
      )}
    </div>
  );
}

function describeAdjustment(rule: PricingRule) {
  const value = rule.adjustmentValue;
  if (rule.adjustmentType === "SET_PRICE") return `Giá ${formatMoney(value)}`;
  const sign = value > 0 ? "+" : "−";
  const magnitude = Math.abs(value);
  return rule.adjustmentType === "PERCENT" ? `${sign}${magnitude}%` : `${sign}${formatMoney(magnitude)}`;
}

function describeCondition(rule: PricingRule) {
  const parts: string[] = [];
  if (rule.validFrom && rule.validTo) parts.push(`${formatDate(rule.validFrom)} – ${formatDate(rule.validTo)}`);
  if (rule.dayOfWeek) parts.push(dayOfWeekLabels[rule.dayOfWeek]);
  if (rule.minDaysBefore != null) parts.push(`đặt trước ≥ ${rule.minDaysBefore} ngày`);
  if (rule.maxDaysBefore != null) parts.push(`đặt trước ≤ ${rule.maxDaysBefore} ngày`);
  return parts.join(" · ") || "Mọi đêm";
}

function PricingWorkspace({ hotelId }: { hotelId: string }) {
  const { canEdit } = usePartnerHotel();
  const roomTypesQuery = useRoomTypes(hotelId);
  const rulesQuery = usePricingRules(hotelId);
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [editing, setEditing] = useState<{ open: boolean; rule?: PricingRule }>({ open: false });
  const [deleting, setDeleting] = useState<PricingRule>();

  const roomTypes = roomTypesQuery.data ?? [];
  const rules = (rulesQuery.data ?? []).filter((rule) => !roomTypeFilter || rule.roomTypeId === roomTypeFilter);
  const roomTypeName = (id: string) => roomTypes.find((type) => type.id === id)?.name ?? "—";
  const invalidate = () => [partnerKeys.pricingRules(hotelId), [...partnerKeys.all, "price-preview"]];

  const toggle = usePartnerMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) => partnerService.updatePricingRule(id, { isActive }),
    { invalidate, successMessage: (rule) => (rule.isActive ? `Đã bật luật ${rule.name}.` : `Đã tắt luật ${rule.name}.`) },
  );
  const remove = usePartnerMutation((id: string) => partnerService.deletePricingRule(id), {
    invalidate,
    successMessage: "Đã xoá luật giá.",
    onSuccess: () => setDeleting(undefined),
  });

  if (roomTypesQuery.isLoading) return <LoadingPanel />;
  if (roomTypesQuery.error) return <ErrorPanel error={roomTypesQuery.error} onRetry={() => void roomTypesQuery.refetch()} />;
  if (roomTypes.length === 0) {
    return (
      <EmptyPanel
        icon={Tags}
        title="Chưa có loại phòng"
        description="Luật giá điều chỉnh giá cơ bản của từng loại phòng. Hãy tạo loại phòng ở Kho phòng trước."
      />
    );
  }

  const columns: CommonTableColumn<PricingRule>[] = [
    {
      id: "name",
      header: "Luật giá",
      cell: (rule) => (
        <div>
          <strong className="block text-primary">{rule.name}</strong>
          <span className="text-xs text-muted-foreground">{roomTypeName(rule.roomTypeId)}</span>
        </div>
      ),
    },
    {
      id: "type",
      header: "Loại",
      cell: (rule) =>
        pricingRuleTypeLabels[rule.ruleType as keyof typeof pricingRuleTypeLabels]?.label ?? rule.ruleType,
    },
    { id: "condition", header: "Áp dụng khi", className: "text-muted-foreground", cell: describeCondition },
    { id: "adjustment", header: "Điều chỉnh", cell: (rule) => <strong>{describeAdjustment(rule)}</strong> },
    { id: "priority", header: "Ưu tiên", align: "center", cell: (rule) => rule.priority },
    {
      id: "active",
      header: "Bật",
      cell: (rule) => (
        <Switch
          checked={rule.isActive}
          disabled={!canEdit || (toggle.isPending && toggle.variables?.id === rule.id)}
          onCheckedChange={(isActive) => toggle.mutate({ id: rule.id, isActive })}
          aria-label={rule.isActive ? `Tắt luật ${rule.name}` : `Bật luật ${rule.name}`}
        />
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (rule) =>
        canEdit && (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" aria-label={`Sửa ${rule.name}`} onClick={() => setEditing({ open: true, rule })}>
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-danger"
              aria-label={`Xoá ${rule.name}`}
              onClick={() => setDeleting(rule)}
            >
              <Trash2 />
            </Button>
          </div>
        ),
    },
  ];

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <PartnerPanel className="min-w-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b px-5 py-4">
          <FormField label="Loại phòng" className="w-56">
            <NativeSelect value={roomTypeFilter} onChange={(event) => setRoomTypeFilter(event.target.value)} className="w-full">
              <NativeSelectOption value="">Tất cả loại phòng</NativeSelectOption>
              {roomTypes.map((type) => (
                <NativeSelectOption key={type.id} value={type.id}>
                  {type.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
          {canEdit && (
            <Button onClick={() => setEditing({ open: true })}>
              <Plus />
              Thêm luật giá
            </Button>
          )}
        </div>
        {rulesQuery.error ? (
          <div className="p-5">
            <ErrorPanel error={rulesQuery.error} onRetry={() => void rulesQuery.refetch()} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <TableCommon
              data={rules}
              columns={columns}
              getRowId={(rule) => rule.id}
              isLoading={rulesQuery.isLoading}
              emptyMessage="Chưa có luật giá: mọi đêm đang dùng giá cơ bản của loại phòng."
              className="rounded-none border-0"
              tableClassName="min-w-[860px]"
            />
          </div>
        )}
      </PartnerPanel>

      <PricePreviewPanel roomTypes={roomTypes} />

      <PricingRuleDialog
        open={editing.open}
        onOpenChange={(open) => setEditing((prev) => ({ ...prev, open }))}
        hotelId={hotelId}
        roomTypes={roomTypes}
        rule={editing.rule}
        defaultRoomTypeId={roomTypeFilter || undefined}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title={`Xoá luật ${deleting?.name ?? ""}?`}
        description="Các booking đã đặt giữ nguyên giá; booking mới sẽ không dùng luật này nữa."
        confirmLabel="Xoá luật giá"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </section>
  );
}

/** The backend computes the price (the FE never does); this asks it for one night. */
function PricePreviewPanel({ roomTypes }: { roomTypes: RoomType[] }) {
  const today = todayInVietnam();
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [bookedOn, setBookedOn] = useState(today);
  const preview = usePricePreview(roomTypeId || undefined, date, bookedOn);

  return (
    <PartnerPanel className="h-fit space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Calculator size={18} className="text-primary" />
        <h2 className="font-bold text-primary">Xem trước giá một đêm</h2>
      </div>
      <FormField label="Loại phòng">
        <NativeSelect value={roomTypeId} onChange={(event) => setRoomTypeId(event.target.value)} className="w-full">
          {roomTypes.map((type) => (
            <NativeSelectOption key={type.id} value={type.id}>
              {type.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <FormField label="Ngày nhận phòng">
        <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </FormField>
      <FormField label="Ngày khách đặt" hint="Ảnh hưởng luật đặt sớm / phút chót.">
        <Input type="date" value={bookedOn} max={date} onChange={(event) => setBookedOn(event.target.value)} />
      </FormField>
      <div className="rounded-xl bg-muted p-4">
        {preview.isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tính...</p>
        ) : preview.error ? (
          <p className="text-sm text-danger">Không tính được giá cho ngày này.</p>
        ) : preview.data ? (
          <div className="space-y-1">
            <strong className="block text-xl text-primary">{formatMoney(preview.data.price)}</strong>
            <p className="text-xs text-muted-foreground">Giá cơ bản {formatMoney(preview.data.basePrice)}</p>
            {preview.data.rule ? (
              <StatusBadge tone="info">Áp dụng: {preview.data.rule.name}</StatusBadge>
            ) : (
              <StatusBadge tone="muted">Không có luật nào khớp</StatusBadge>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Chọn loại phòng và ngày.</p>
        )}
      </div>
    </PartnerPanel>
  );
}
