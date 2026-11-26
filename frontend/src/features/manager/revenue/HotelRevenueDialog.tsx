"use client";

import { useState } from "react";
import type { HotelRevenueDetail, Metric, RateMetric } from "@stayreco/shared";
import { TablePagination } from "@/components/common/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useHotelRevenue, useHotelWalletTransactions } from "../api/manager-queries";
import { ErrorPanel, MetricDelta, StatusBadge } from "../components";
import { formatShortDate } from "../lib/dates";
import {
  formatDateTime,
  formatMoney,
  hotelStatusLabels,
  partnerStatusLabels,
  regionLabels,
  walletTxnTypeLabels,
} from "../lib/labels";

const LEDGER_PAGE_SIZE = 10;
const countFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

export function HotelRevenueDialog({
  hotelId,
  range,
  onOpenChange,
}: {
  hotelId: string | undefined;
  range: { from: string; to: string };
  onOpenChange: (open: boolean) => void;
}) {
  const query = useHotelRevenue(hotelId, range);
  const detail = query.data;

  return (
    <Dialog open={!!hotelId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{detail?.hotel.name ?? "Doanh thu khách sạn"}</DialogTitle>
          <DialogDescription>
            {detail
              ? `${detail.hotel.city} · ${regionLabels[detail.hotel.region]} · kỳ ${formatShortDate(detail.period.from)} – ${formatShortDate(detail.period.to)}`
              : "Đang tải..."}
          </DialogDescription>
        </DialogHeader>
        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : query.error || !detail ? (
          <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          <HotelRevenueBody key={detail.hotel.id} detail={detail} range={range} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function HotelRevenueBody({ detail, range }: { detail: HotelRevenueDetail; range: { from: string; to: string } }) {
  const status = hotelStatusLabels[detail.hotel.status];
  const partnerStatus = partnerStatusLabels[detail.partner.status];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        <span className="text-muted-foreground">·</span>
        <span>{detail.partner.name}</span>
        {detail.partner.status !== "APPROVED" && (
          <StatusBadge tone={partnerStatus.tone}>{partnerStatus.label}</StatusBadge>
        )}
        <span className="text-muted-foreground">· Hoa hồng {percentFormat.format(detail.partner.commissionRate)}%</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Figure label="Booking" metric={detail.bookings} format={(v) => (v == null ? "—" : countFormat.format(v))} />
        <Figure label="GMV" metric={detail.gmv} format={formatMoney} />
        <Figure label="Hoa hồng" metric={detail.commission} format={formatMoney} />
        <Figure label="Hoàn tiền" metric={detail.refunds} format={formatMoney} good="down" />
        <Figure
          label="Tỉ lệ huỷ"
          metric={detail.cancellationRate}
          format={(v) => (v == null ? "—" : `${percentFormat.format(v)}%`)}
          good="down"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-xl border p-4">
          <h3 className="text-sm font-bold text-primary">Ví khách sạn hiện tại</h3>
          {detail.wallet ? (
            <dl className="mt-2 space-y-1.5 text-sm">
              <Line label="Khả dụng" value={formatMoney(detail.wallet.available)} strong />
              <Line label="Đang chờ" value={formatMoney(detail.wallet.pending)} />
              <Line label="Tạm giữ" value={formatMoney(detail.wallet.reserved)} />
            </dl>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Khách sạn chưa có ví.</p>
          )}
        </section>
        <section className="rounded-xl border p-4">
          <h3 className="text-sm font-bold text-primary">Rút tiền</h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            <Line
              label={`Đã chuyển trong kỳ (${detail.payouts.paidCount})`}
              value={formatMoney(detail.payouts.paidAmount)}
            />
            <Line
              label={`Đang chờ (${detail.payouts.pendingCount})`}
              value={formatMoney(detail.payouts.pendingAmount)}
              strong={detail.payouts.pendingCount > 0}
            />
          </dl>
        </section>
      </div>

      <WalletLedger hotelId={detail.hotel.id} range={range} />
    </div>
  );
}

function Figure({
  label,
  metric,
  format,
  good,
}: {
  label: string;
  metric: Metric | RateMetric;
  format: (value: number | null) => string;
  good?: "up" | "down";
}) {
  const isRate = "deltaPoints" in metric;
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-bold tabular-nums text-primary" title={format(metric.value)}>
        {format(metric.value)}
      </p>
      <MetricDelta
        value={isRate ? metric.deltaPoints : metric.deltaPercent}
        unit={isRate ? " điểm" : "%"}
        good={good}
      />
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", strong && "font-bold text-primary")}>{value}</dd>
    </div>
  );
}

function WalletLedger({ hotelId, range }: { hotelId: string; range: { from: string; to: string } }) {
  const [page, setPage] = useState(1);
  const query = useHotelWalletTransactions(hotelId, { ...range, page, pageSize: LEDGER_PAGE_SIZE });
  const transactions = query.data?.transactions ?? [];
  const meta = query.data?.meta;

  return (
    <section className="overflow-hidden rounded-xl border">
      <h3 className="px-4 pt-4 text-sm font-bold text-primary">Sổ giao dịch ví trong kỳ</h3>
      {query.error ? (
        <div className="p-4">
          <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : query.isLoading ? (
        <Skeleton className="m-4 h-24" />
      ) : transactions.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Không có giao dịch nào trong kỳ.</p>
      ) : (
        <>
          <div className={cn("mt-2 overflow-x-auto", query.isFetching && "opacity-60 transition-opacity")}>
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-y text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-2 font-semibold">Thời gian</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Loại</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Booking</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Số tiền</th>
                  <th scope="col" className="px-4 py-2 text-right font-semibold">Số dư sau</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{formatDateTime(txn.createdAt)}</td>
                    <td className="px-3 py-2">{walletTxnTypeLabels[txn.type]}</td>
                    <td className="px-3 py-2 font-mono text-xs">{txn.booking?.code ?? "—"}</td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-3 py-2 text-right font-semibold",
                        txn.amount > 0 ? "text-success" : txn.amount < 0 ? "text-danger" : "",
                      )}
                    >
                      {txn.amount > 0 ? "+" : ""}
                      {formatMoney(txn.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">{formatMoney(txn.balanceAfter)}</td>
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
    </section>
  );
}
