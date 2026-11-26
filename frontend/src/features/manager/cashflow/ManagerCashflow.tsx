"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, CircleCheck } from "lucide-react";
import type { PlatformCashflow } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCashflow } from "../api/manager-queries";
import { ErrorPanel, ExportReportButton, ManagerPanel, ManagerTitle } from "../components";
import { formatShortDate, periodPresetLabels, presetRange, type PeriodPreset } from "../lib/dates";
import { formatDateTime, formatMoney } from "../lib/labels";

const countFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

const splitParts = [
  { key: "hotelSettled", label: "Đã quyết toán cho khách sạn", hint: "Một phần có thể đã được rút", color: "bg-chart-1" },
  { key: "hotelPending", label: "Đang giữ cho khách sạn", hint: "Kỳ nghỉ chưa xong hoặc đang trong thời gian giữ", color: "bg-chart-2" },
  { key: "commission", label: "Hoa hồng đã thu", hint: "Thu khi trả phòng hoặc không đến", color: "bg-chart-3" },
  { key: "refunded", label: "Đã hoàn cho khách", hint: "Vào ví khách hàng", color: "bg-chart-4" },
] as const;

export default function ManagerCashflow() {
  const [preset, setPreset] = useState<PeriodPreset>("30d");
  const range = presetRange(preset);
  const query = useCashflow(range);
  const data = query.data;

  return (
    <div className="space-y-6">
      <ManagerTitle
        title="Dòng tiền & đối soát"
        description="Tiền khách chuyển qua SePay trong kỳ đang nằm ở đâu, và số dư ngân hàng có khớp tổng các ví trên nền tảng hay không."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Chọn kỳ thống kê" className="flex flex-wrap gap-1.5">
              {(Object.keys(periodPresetLabels) as PeriodPreset[]).map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={preset === value ? "default" : "outline"}
                  aria-pressed={preset === value}
                  onClick={() => setPreset(value)}
                >
                  {periodPresetLabels[value]}
                </Button>
              ))}
            </div>
            <ExportReportButton report="cashflow" range={range} />
          </div>
        }
      />

      {query.error ? (
        <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
      ) : !data ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <CashflowBody data={data} />
      )}
    </div>
  );
}

function CashflowBody({ data }: { data: PlatformCashflow }) {
  const { received, split, unmatched, payoutsPaid, reconciliation } = data;
  const reconciled = reconciliation.difference === 0;

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Kỳ {formatShortDate(data.period.from)} – {formatShortDate(data.period.to)} · Cập nhật lúc{" "}
        {formatDateTime(data.generatedAt)}
      </p>

      <ManagerPanel
        className={cn("flex flex-col gap-4 p-5 sm:flex-row sm:items-center", reconciled ? "ring-1 ring-success/30" : "ring-1 ring-danger/40")}
      >
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl",
            reconciled ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
          )}
        >
          {reconciled ? <CircleCheck size={22} aria-hidden /> : <CircleAlert size={22} aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className={cn("font-bold", reconciled ? "text-success" : "text-danger")}>
            {reconciled ? "Số dư ngân hàng khớp tổng các ví" : `Lệch ${formatMoney(reconciliation.difference)}: cần kiểm tra`}
          </h2>
          <p className="text-xs text-muted-foreground">Đối soát toàn thời gian, tính đến lúc cập nhật.</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:text-right">
          <dt className="text-muted-foreground">Ngân hàng dự kiến</dt>
          <dd className="font-semibold tabular-nums">{formatMoney(reconciliation.bankExpected)}</dd>
          <dt className="text-muted-foreground">Tổng các ví</dt>
          <dd className="font-semibold tabular-nums">{formatMoney(reconciliation.walletTotal)}</dd>
        </dl>
      </ManagerPanel>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat
          label="Nhận qua SePay"
          value={formatMoney(received.sepay)}
          hint={`${countFormat.format(received.transfers)} lượt chuyển khoản`}
          strong
        />
        <Stat label="Thanh toán bằng ví khách" value={formatMoney(received.wallet)} hint="Tiền đã có sẵn, không phải tiền mới" />
        <Stat
          label="Rút tiền đã chuyển"
          value={formatMoney(payoutsPaid.amount)}
          hint={`${countFormat.format(payoutsPaid.count)} yêu cầu trong kỳ`}
          action={{ href: "/manager/payouts", label: "Hàng chờ rút tiền" }}
        />
      </div>

      <ManagerPanel className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold text-primary">Tiền SePay của kỳ đang ở đâu</h2>
          <span className="text-sm text-muted-foreground">Tổng {formatMoney(received.sepay)}</span>
        </div>
        {received.sepay > 0 && (
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
            {splitParts.map((part) => (
              <div
                key={part.key}
                className={part.color}
                style={{ width: `${Math.max(0, (split[part.key] / received.sepay) * 100)}%` }}
              />
            ))}
          </div>
        )}
        <ul className="mt-4 divide-y">
          {splitParts.map((part) => (
            <li key={part.key} className="flex items-center gap-3 py-2.5 text-sm">
              <span className={cn("size-3 shrink-0 rounded-sm", part.color)} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">{part.label}</span>
                <span className="text-xs text-muted-foreground">{part.hint}</span>
              </span>
              <span className="text-right tabular-nums">
                <strong className="block">{formatMoney(split[part.key])}</strong>
                {received.sepay > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {percentFormat.format((split[part.key] / received.sepay) * 100)}%
                  </span>
                )}
              </span>
            </li>
          ))}
          <li
            className={cn(
              "flex items-center justify-between gap-3 py-2.5 text-sm",
              split.difference !== 0 && "font-semibold text-danger",
            )}
          >
            <span>Chênh lệch chưa giải thích được</span>
            <span className="tabular-nums">{formatMoney(split.difference)}</span>
          </li>
        </ul>
      </ManagerPanel>

      <ManagerPanel className={cn("flex flex-col gap-2 p-5 sm:flex-row sm:items-center", unmatched.count > 0 && "ring-1 ring-warning/40")}>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-primary">Chuyển khoản chưa khớp</h2>
          <p className="text-xs text-muted-foreground">
            Tiền SePay không xác nhận được booking nào hoặc đến muộn sau khi giữ chỗ hết hạn; cần hoàn tay cho khách.
          </p>
        </div>
        <p className={cn("text-right tabular-nums", unmatched.count > 0 ? "text-warning" : "text-muted-foreground")}>
          <strong className="block text-lg">{formatMoney(unmatched.amount)}</strong>
          <span className="text-xs">{countFormat.format(unmatched.count)} giao dịch</span>
        </p>
      </ManagerPanel>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  strong,
  action,
}: {
  label: string;
  value: string;
  hint: string;
  strong?: boolean;
  action?: { href: string; label: string };
}) {
  return (
    <ManagerPanel className="p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate font-bold tabular-nums", strong ? "text-2xl text-primary" : "text-xl text-foreground")}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      {action && (
        <Link href={action.href} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          {action.label}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </ManagerPanel>
  );
}
