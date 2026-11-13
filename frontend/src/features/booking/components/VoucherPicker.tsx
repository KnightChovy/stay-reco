"use client";

import { Check, Clock, Loader2, Percent, Sparkles, TicketX } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime, formatMoney } from "@/features/stays/lib/format";
import { describeVoucherDiscount } from "@/features/account/lib/rewards-labels";
import { voucherSaving, type VoucherOption } from "@/features/account/api/rewards-queries";

type Props = {
  options: VoucherOption[];
  isLoading: boolean;
  /** The code in use; undefined when the customer chose not to use one. */
  selectedCode: string | undefined;
  /** The code that saves the most, marked "Tốt nhất". */
  bestCode: string | undefined;
  onSelect: (code: string | undefined) => void;
  disabled?: boolean;
};

/**
 * The customer's usable vouchers for this stay, like a marketplace checkout: each shows what it would save (priced by
 * the backend), the best one is marked and pre-selected by the page, and "Không dùng voucher" is always available.
 */
export function VoucherPicker({ options, isLoading, selectedCode, bestCode, onSelect, disabled }: Props) {
  if (isLoading && options.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-[#f1f3f9] p-3 text-xs text-slate-500">
        <Loader2 className="size-4 animate-spin" /> Đang tìm voucher của bạn…
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <p className="rounded-lg bg-[#f1f3f9] p-3 text-xs text-slate-500">
        Bạn chưa có voucher nào dùng được cho khách sạn này.
      </p>
    );
  }

  // Sorted by saving only once every code is priced, so cards do not jump around while quotes arrive.
  const sorted = isLoading ? options : [...options].sort((a, b) => voucherSaving(b) - voucherSaving(a));

  return (
    <div className="space-y-2" role="radiogroup" aria-label="Chọn voucher">
      {sorted.map((option) => {
        const { voucher } = option;
        const saving = voucherSaving(option);
        const refused = !!option.error;
        // A code the hotel's own campaign beats would not be spent: selectable, but it saves nothing extra.
        const usable = !refused && !option.isLoading;
        const selected = selectedCode?.toUpperCase() === voucher.code.toUpperCase();
        const best = !!bestCode && bestCode === voucher.code && saving > 0;

        return (
          <button
            key={voucher.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled || !usable}
            onClick={() => onSelect(voucher.code)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
              selected
                ? "border-[#934a33] bg-[#F5EBE5]/60 shadow-xs"
                : "border-slate-200 bg-white hover:border-[#934a33]/50",
              !usable && "cursor-not-allowed opacity-60 hover:border-slate-200",
            )}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-[#934a33]">
              <Percent className="size-5" />
            </span>
            <span className="min-w-0 flex-1 space-y-0.5">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-sm font-bold text-[#202B36]">{voucher.promotionName}</span>
                {best && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-[#934a33] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    <Sparkles className="size-3" /> Tốt nhất
                  </span>
                )}
              </span>
              <span className="block text-xs text-slate-500">
                {describeVoucherDiscount(voucher)}
                {voucher.minBookingAmount != null && ` · Đơn từ ${formatMoney(voucher.minBookingAmount)}`}
              </span>
              <span className="flex flex-wrap items-center gap-x-2 text-[11px]">
                <span className="font-mono text-slate-400">{voucher.code}</span>
                {voucher.expiresAt && (
                  <span className="flex items-center gap-0.5 text-slate-400">
                    <Clock className="size-3" /> HSD {formatDateTime(voucher.expiresAt)}
                  </span>
                )}
              </span>
              {option.isLoading ? (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Loader2 className="size-3 animate-spin" /> Đang tính mức giảm…
                </span>
              ) : refused ? (
                <span className="block text-[11px] font-semibold text-red-600">
                  {getApiErrorMessage(option.error, "Không dùng được cho đơn này.")}
                </span>
              ) : saving > 0 ? (
                <span className="block text-[11px] font-semibold text-emerald-700">Giảm {formatMoney(saving)} cho đơn này</span>
              ) : (
                <span className="block text-[11px] text-slate-500">
                  Khuyến mãi của khách sạn đang có lợi hơn, mã này sẽ không bị dùng.
                </span>
              )}
            </span>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                selected ? "border-[#934a33] bg-[#934a33] text-white" : "border-slate-300",
              )}
              aria-hidden
            >
              {selected && <Check className="size-3" />}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        role="radio"
        aria-checked={!selectedCode}
        disabled={disabled}
        onClick={() => onSelect(undefined)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
          !selectedCode ? "border-[#013758] bg-[#EAF0F5]/60" : "border-slate-200 bg-white hover:border-[#013758]/40",
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <TicketX className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-[#202B36]">Không dùng voucher</span>
          <span className="block text-[11px] text-slate-500">Giữ voucher cho lần sau; khuyến mãi chung của khách sạn vẫn tự áp dụng.</span>
        </span>
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
            !selectedCode ? "border-[#013758] bg-[#013758] text-white" : "border-slate-300",
          )}
          aria-hidden
        >
          {!selectedCode && <Check className="size-3" />}
        </span>
      </button>
    </div>
  );
}
