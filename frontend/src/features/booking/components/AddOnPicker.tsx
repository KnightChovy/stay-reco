"use client";

import { Minus, Plus } from "lucide-react";
import { ADD_ON_LIMITS, type AddOnLineInput, type HotelAddOn } from "@stayreco/shared";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/features/stays/lib/format";
import { addOnTimingLabels } from "../lib/booking-labels";

/** Chosen quantities by add-on id; 0 or missing means not booked. */
export type AddOnQuantities = Record<string, number>;

/** The `addOns` of the quote and of `POST /bookings`: only what has a quantity, in catalogue order. */
export function toAddOnLines(addOns: HotelAddOn[], quantities: AddOnQuantities): AddOnLineInput[] {
  return addOns
    .filter((addOn) => (quantities[addOn.id] ?? 0) > 0)
    .map((addOn) => ({ addOnId: addOn.id, quantity: quantities[addOn.id] }));
}

/**
 * Services the customer books with the stay (docs/api/add-ons.md): paid in the same transfer, never discounted, and
 * refunded in full if the booking is cancelled. Only active, `prebookable` add-ons of the hotel are offered.
 */
export function AddOnPicker({
  addOns,
  quantities,
  onChange,
  disabled,
}: {
  addOns: HotelAddOn[];
  quantities: AddOnQuantities;
  onChange: (quantities: AddOnQuantities) => void;
  disabled?: boolean;
}) {
  const chosenCount = addOns.filter((addOn) => (quantities[addOn.id] ?? 0) > 0).length;
  const atLineLimit = chosenCount >= ADD_ON_LIMITS.maxLines;

  const set = (addOnId: string, quantity: number) =>
    onChange({ ...quantities, [addOnId]: Math.max(0, Math.min(ADD_ON_LIMITS.maxQuantity, quantity)) });

  return (
    <div className="space-y-2">
      {addOns.map((addOn) => {
        const quantity = quantities[addOn.id] ?? 0;
        const selected = quantity > 0;
        return (
          <div
            key={addOn.id}
            className={cn(
              "flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
              selected ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <div className="min-w-0 text-xs">
              <p className="text-sm font-semibold text-foreground">{addOn.name}</p>
              {addOn.description && <p className="mt-0.5 text-muted-foreground">{addOn.description}</p>}
              <p className="mt-1 text-muted-foreground">
                <span className="font-semibold text-primary">{formatMoney(addOn.price)}</span> / lần ·{" "}
                {addOnTimingLabels[addOn.timing].label}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => set(addOn.id, quantity - 1)}
                disabled={disabled || quantity === 0}
                className="flex size-10 items-center justify-center rounded-lg border border-input text-muted-foreground disabled:opacity-40"
                aria-label={`Bớt ${addOn.name}`}
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-bold text-foreground" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => set(addOn.id, quantity + 1)}
                disabled={
                  disabled || quantity >= ADD_ON_LIMITS.maxQuantity || (!selected && atLineLimit)
                }
                className="flex size-10 items-center justify-center rounded-lg border border-primary text-primary disabled:opacity-40"
                aria-label={`Thêm ${addOn.name}`}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Dịch vụ được trả cùng tiền phòng, không áp dụng voucher hay điểm, và được hoàn đủ nếu bạn huỷ đơn. Các dịch vụ
        khác có thể gọi trực tiếp tại khách sạn và thanh toán khi trả phòng.
      </p>
    </div>
  );
}
