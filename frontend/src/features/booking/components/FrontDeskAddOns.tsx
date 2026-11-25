"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ADD_ON_LIMITS, type Booking } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/features/stays/lib/format";
import { useAddBookingAddOn, useHotelAddOns, useRemoveBookingAddOn } from "../api/add-on-queries";
import { addOnPaymentLabels, addOnTimingLabels } from "../lib/booking-labels";

/** Front desk lines can be added on a paid booking that has not checked out yet (docs/api/add-ons.md). */
export function canAddFrontDeskAddOn(booking: Booking) {
  return (booking.status === "CONFIRMED" && booking.paymentStatus === "PAID") || booking.status === "CHECKED_IN";
}

/**
 * Every service on a booking, with the front desk's controls: add any active add-on of the hotel (prebookable or
 * not) and remove the lines the desk added. Prepaid lines were paid with the rooms and stay as they are.
 */
export function FrontDeskAddOns({ booking }: { booking: Booking }) {
  const editable = canAddFrontDeskAddOn(booking);
  const catalogue = useHotelAddOns(editable ? booking.hotel.id : undefined);
  const add = useAddBookingAddOn();
  const remove = useRemoveBookingAddOn();
  const [addOnId, setAddOnId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const active = (catalogue.data ?? []).filter((addOn) => addOn.isActive);
  const chosen = active.find((addOn) => addOn.id === addOnId);
  const error = add.error ?? remove.error;

  const submit = () => {
    if (!chosen) return;
    add.mutate(
      { bookingId: booking.id, input: { addOnId: chosen.id, quantity } },
      {
        onSuccess: () => {
          setAddOnId("");
          setQuantity(1);
        },
      },
    );
  };

  return (
    <div className="space-y-3 text-xs">
      {booking.addOns.length === 0 ? (
        <p className="text-muted-foreground">Chưa có dịch vụ nào trên đơn này.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {booking.addOns.map((line) => (
            <li key={line.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {line.name} × {line.quantity}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {addOnTimingLabels[line.timing].label} · {addOnPaymentLabels[line.payment]}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono font-semibold text-foreground">{formatMoney(line.amount)}</span>
                {editable && line.payment === "FRONT_DESK" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-red-600 hover:bg-red-50"
                    aria-label={`Bỏ dịch vụ ${line.name}`}
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(`Bỏ "${line.name}" khỏi đơn ${booking.code}?`)) {
                        remove.mutate({ bookingId: booking.id, lineId: line.id });
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
          <p className="font-semibold text-foreground">Thêm dịch vụ khách dùng tại khách sạn</p>
          {catalogue.isLoading ? (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Đang tải danh mục dịch vụ…
            </p>
          ) : catalogue.error ? (
            <p className="text-red-600">{getApiErrorMessage(catalogue.error, "Không tải được danh mục dịch vụ.")}</p>
          ) : active.length === 0 ? (
            <p className="text-muted-foreground">Khách sạn chưa có dịch vụ nào đang bán.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor={`add-on-${booking.id}`}>
                  Dịch vụ
                </label>
                <NativeSelect
                  id={`add-on-${booking.id}`}
                  value={addOnId}
                  onChange={(event) => setAddOnId(event.target.value)}
                  className="min-w-0 flex-1"
                >
                  <NativeSelectOption value="">Chọn dịch vụ…</NativeSelectOption>
                  {active.map((addOn) => (
                    <NativeSelectOption key={addOn.id} value={addOn.id}>
                      {addOn.name} · {formatMoney(addOn.price)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <label className="sr-only" htmlFor={`add-on-qty-${booking.id}`}>
                  Số lượng
                </label>
                <Input
                  id={`add-on-qty-${booking.id}`}
                  type="number"
                  min={1}
                  max={ADD_ON_LIMITS.maxQuantity}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Math.min(ADD_ON_LIMITS.maxQuantity, Math.max(1, Number(event.target.value) || 1)))
                  }
                  className="h-9 w-20"
                />
                <Button type="button" onClick={submit} disabled={!chosen || add.isPending} className="h-9 gap-1.5">
                  {add.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  Thêm
                </Button>
              </div>
              {chosen && (
                <p className="text-[11px] text-muted-foreground">
                  {formatMoney(chosen.price)} × {quantity}, thu tại quầy khi khách trả phòng; không tính vào tiền khách
                  đã thanh toán.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {error && <p className="text-red-600">{getApiErrorMessage(error, "Không cập nhật được dịch vụ.")}</p>}
    </div>
  );
}
