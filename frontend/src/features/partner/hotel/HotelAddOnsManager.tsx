"use client";

import { useState } from "react";
import { ConciergeBell, Pencil, Plus } from "lucide-react";
import type { HotelAddOn } from "@stayreco/shared";
import { ActionMenu } from "@/components/common/ActionBar";
import { Button } from "@/components/ui/button";
import { addOnKeys, useHotelAddOns } from "@/features/booking/api/add-on-queries";
import { addOnTimingLabels } from "@/features/booking/lib/booking-labels";
import * as addOnsService from "@/services/add-ons.service";
import { usePartnerMutation } from "../api/partner-queries";
import { EmptyPanel, ErrorPanel, LoadingPanel, StatusBadge, usePartnerHotel } from "../components";
import { formatMoney } from "../lib/labels";
import { AddOnDialog } from "./AddOnDialog";

type DialogState = { open: false } | { open: true; addOn?: HotelAddOn };

export function HotelAddOnsManager({ hotelId }: { hotelId: string }) {
  const { canEdit } = usePartnerHotel();
  const addOns = useHotelAddOns(hotelId);
  const [dialog, setDialog] = useState<DialogState>({ open: false });

  const toggleMutation = usePartnerMutation(
    (addOn: HotelAddOn) => addOnsService.updateAddOn(addOn.id, { isActive: !addOn.isActive }),
    {
      invalidate: () => [addOnKeys.hotel(hotelId)],
      successMessage: (data) => (data.isActive ? `Đã mở bán lại ${data.name}.` : `Đã ngừng bán ${data.name}.`),
    },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Dịch vụ bán kèm phòng như đón sân bay, ăn sáng, spa. Dịch vụ đặt trước được trả cùng tiền phòng; dịch vụ tại quầy
          được nhân viên thêm vào booking và thu khi trả phòng. Giảm giá và điểm thưởng không áp dụng cho dịch vụ.
        </p>
        {canEdit && (
          <Button className="shrink-0" onClick={() => setDialog({ open: true })}>
            <Plus />
            Thêm dịch vụ
          </Button>
        )}
      </div>

      {addOns.isLoading ? (
        <LoadingPanel />
      ) : addOns.error ? (
        <ErrorPanel error={addOns.error} onRetry={() => void addOns.refetch()} />
      ) : !addOns.data?.length ? (
        <EmptyPanel
          icon={ConciergeBell}
          title="Chưa có dịch vụ nào"
          description="Thêm dịch vụ để khách chọn khi đặt phòng hoặc để nhân viên ghi nhận tại quầy."
        />
      ) : (
        <ul className="divide-y rounded-xl border">
          {addOns.data.map((addOn) => (
            <li key={addOn.id} className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{addOn.name}</span>
                  <StatusBadge tone={addOn.isActive ? "success" : "muted"}>
                    {addOn.isActive ? "Đang bán" : "Ngừng bán"}
                  </StatusBadge>
                </div>
                {addOn.description && <p className="text-sm text-muted-foreground">{addOn.description}</p>}
                <p className="text-xs text-muted-foreground">
                  {addOnTimingLabels[addOn.timing].label} ·{" "}
                  {addOn.prebookable ? "Khách đặt trước được" : "Chỉ thêm tại quầy"}
                </p>
              </div>
              <strong className="shrink-0 tabular-nums text-primary">{formatMoney(addOn.price)}</strong>
              {canEdit && (
                <ActionMenu
                  variant="icon"
                  label={`Thao tác với ${addOn.name}`}
                  items={[
                    { label: "Sửa", icon: Pencil, onSelect: () => setDialog({ open: true, addOn }) },
                    {
                      label: addOn.isActive ? "Ngừng bán" : "Mở bán lại",
                      description: addOn.isActive
                        ? "Khách và nhân viên không chọn được nữa; booking đã có giữ nguyên."
                        : "Khách và nhân viên chọn được dịch vụ này trở lại.",
                      disabled: toggleMutation.isPending,
                      onSelect: () => toggleMutation.mutate(addOn),
                    },
                  ]}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <AddOnDialog
        open={dialog.open}
        onOpenChange={(open) => !open && setDialog({ open: false })}
        hotelId={hotelId}
        addOn={dialog.open ? dialog.addOn : undefined}
      />
    </div>
  );
}
