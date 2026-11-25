"use client";

import { useState } from "react";
import { WalletTxnType } from "@stayreco/shared";
import { TablePagination } from "@/components/common/table/TablePagination";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { useWalletTransactions } from "../api/partner-queries";
import { DateInput, ErrorPanel, PartnerPanel } from "../components";
import { formatDateTime, formatMoney, walletTxnTypeLabels } from "../lib/labels";

const PAGE_SIZE = 20;

const hotelTxnTypes = [
  WalletTxnType.BOOKING_PAYMENT,
  WalletTxnType.COMMISSION,
  WalletTxnType.REFUND,
  WalletTxnType.SETTLEMENT,
  WalletTxnType.PAYOUT,
  WalletTxnType.ADJUSTMENT,
];

export function WalletTransactions({ hotelId }: { hotelId: string }) {
  const [type, setType] = useState<WalletTxnType | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const rangeError = from && to && to < from ? "Ngày kết thúc phải sau ngày bắt đầu." : undefined;

  const query = useWalletTransactions(hotelId, {
    type: type ? [type] : undefined,
    from: rangeError ? undefined : from || undefined,
    to: rangeError ? undefined : to || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  function update<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const transactions = query.data?.transactions ?? [];
  const meta = query.data?.meta;

  return (
    <PartnerPanel className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-bold text-primary">Lịch sử giao dịch ví</h2>
          <p className="text-xs text-muted-foreground">Mới nhất trước. Số dư sau là khả dụng + đang chờ.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5 text-xs font-semibold">
            Loại giao dịch
            <NativeSelect
              value={type}
              onChange={(event) => update(setType)(event.target.value as WalletTxnType | "")}
              className="min-w-44"
            >
              <NativeSelectOption value="">Tất cả</NativeSelectOption>
              {hotelTxnTypes.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {walletTxnTypeLabels[value]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold">
            Từ ngày
            <DateInput value={from} onChange={update(setFrom)} clearable className="min-w-40" />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold">
            Đến ngày
            <DateInput value={to} onChange={update(setTo)} min={from || undefined} clearable className="min-w-40" />
          </label>
        </div>
      </div>
      {rangeError && (
        <p role="alert" className="px-5 pb-3 text-xs text-danger">
          {rangeError}
        </p>
      )}

      {query.error ? (
        <div className="p-5">
          <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : query.isLoading ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">Đang tải…</p>
      ) : transactions.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">Không có giao dịch nào.</p>
      ) : (
        <>
          <div className={cn("overflow-x-auto border-t", query.isFetching && "opacity-60 transition-opacity")}>
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-2 font-semibold">Thời gian</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Loại</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Booking</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Mô tả</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Số tiền</th>
                  <th scope="col" className="px-5 py-2 text-right font-semibold">Số dư sau</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-5 py-2 text-muted-foreground">{formatDateTime(txn.createdAt)}</td>
                    <td className="px-3 py-2 text-foreground">{walletTxnTypeLabels[txn.type]}</td>
                    <td className="px-3 py-2 font-mono text-xs">{txn.booking?.code ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{txn.description ?? "—"}</td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-3 py-2 text-right font-semibold",
                        txn.amount > 0 ? "text-success" : txn.amount < 0 ? "text-danger" : "text-foreground",
                      )}
                    >
                      {txn.amount > 0 ? "+" : ""}
                      {formatMoney(txn.amount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2 text-right">{formatMoney(txn.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && meta.total > meta.pageSize && (
            <TablePagination page={page} pageSize={meta.pageSize} total={meta.total} onPageChange={setPage} />
          )}
        </>
      )}
    </PartnerPanel>
  );
}
