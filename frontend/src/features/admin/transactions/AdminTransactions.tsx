"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowLeftRight, Clock, Eye, FileSpreadsheet, RotateCcw, Search } from "lucide-react";
import { type PaymentMethod, type PaymentStatus, type AdminTransaction, type UnmatchedTransfer } from "@stayreco/shared";
import type { CommonTableColumn } from "@/components/common/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorPanel, FormAlert, LoadingPanel, StatusBadge } from "@/features/partner/components";
import { saveFile } from "@/features/partner/dashboard/ExportExcelButton";
import { bookingStatusLabels } from "@/features/partner/lib/labels";
import { todayInVietnam } from "@/features/partner/lib/dates";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { exportAdminTransactions, type AdminTransactionParams } from "@/services/admin.service";
import { Initials, PageTitle, StatCard, Tile } from "../admin-primitives";
import {
  useAdminMutation,
  useAdminOverview,
  useAdminTransaction,
  useAdminTransactions,
  useUnmatchedTransfers,
} from "../api/admin-queries";
import { ListPanel, PeriodFilter, SelectFilter, Timeline } from "../components";
import {
  formatDateTime,
  formatMoney,
  oneOf,
  paymentMethodLabels,
  paymentStatusLabels,
  periodParams,
  walletLabels,
  walletTxnTypeLabels,
} from "../lib/labels";

const PAGE_SIZE = 10;

export function AdminTransactionDetail({ invoiceId }: { invoiceId: string }) {
  const query = useAdminTransaction(invoiceId);
  const t = query.data;
  return (
    <div className="space-y-6">
        <Link className={buttonVariants({ variant: "ghost" })} href="/admin/transactions"><ArrowLeft />Quay lại nhật ký giao dịch</Link>
        <PageTitle eyebrow="Chi tiết & Xác minh giao dịch" title={t ? `Giao dịch ${t.booking.code}` : "Chi tiết giao dịch"} description={t ? `${t.hotel.name} • ${t.customer.fullName} (${t.customer.email})` : "Đang tải chi tiết giao dịch."} />
        {query.error ? (
          <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
        ) : !t ? (
          <LoadingPanel />
        ) : (
          <div className="space-y-6 text-sm">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={paymentStatusLabels[t.status].tone}>{paymentStatusLabels[t.status].label}</StatusBadge>
              <StatusBadge tone={bookingStatusLabels[t.booking.status].tone}>{bookingStatusLabels[t.booking.status].label}</StatusBadge>
              {t.mismatch && <StatusBadge tone="danger">Lệch số tiền</StatusBadge>}
            </div>
            <dl className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["Số tiền phải thu", formatMoney(t.expectedAmount), "text-primary"],
                  ["Cổng báo về", formatMoney(t.confirmedAmount), t.mismatch ? "text-danger" : "text-success"],
                  ["Đã hoàn về ví khách", formatMoney(t.refunded), "text-foreground"],
                ] as const
              ).map(([label, value, tone]) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(32,43,54,0.05)]">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className={`mt-1 text-xl font-bold tabular-nums ${tone}`}>{value}</dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl bg-card p-6 shadow-sm">
                <Initials name={t.customer.fullName} className="size-11 text-sm" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Khách hàng</p>
                  <strong className="block font-semibold text-foreground">{t.customer.fullName}</strong>
                  <span className="block text-xs text-muted-foreground [overflow-wrap:anywhere]">{t.customer.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-card p-6 shadow-sm">
                <Initials name={t.hotel.name} className="size-11 rounded-xl text-sm" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Khách sạn</p>
                  <strong className="block font-semibold text-foreground">{t.hotel.name}</strong>
                  <span className="block text-xs text-muted-foreground">Đơn {t.booking.code}</span>
                </div>
              </div>
            </div>
            <dl className="grid gap-3 sm:grid-cols-3">
              <Tile label="Phương thức">{paymentMethodLabels[t.method]}</Tile>
              <Tile label="Mã giao dịch SePay">
                <span className="font-mono text-xs">{t.gatewayTransactionId ?? "—"}</span>
              </Tile>
              <Tile label="Thanh toán lúc">{formatDateTime(t.paidAt)}</Tile>
            </dl>
            <p className="text-xs text-muted-foreground">
              Không có bước kiểm tra trạng thái với SePay: số liệu là những gì webhook đã báo về.
            </p>

            <div className="grid items-start gap-6 xl:grid-cols-2">
            <section className="space-y-3 rounded-2xl bg-card p-6 shadow-sm">
              <h2 className="font-bold text-primary">Biến động ví</h2>
              {t.walletMovements.length === 0 ? (
                <p className="text-muted-foreground">Chưa có biến động ví nào.</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {t.walletMovements.map((m, i) => (
                    <li key={i} className="flex items-center justify-between gap-4 px-3 py-2.5">
                      <div className="min-w-0">
                        <strong className="font-semibold">{walletTxnTypeLabels[m.type] ?? m.type}</strong>
                        <span className="ml-2 text-muted-foreground">{walletLabels[m.wallet]}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDateTime(m.createdAt)}
                          {m.description ? ` • ${m.description}` : ""}
                        </span>
                      </div>
                      <span className={`whitespace-nowrap font-bold tabular-nums ${m.amount < 0 ? "text-danger" : "text-success"}`}>
                        {m.amount > 0 ? "+" : ""}
                        {formatMoney(m.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-3 rounded-2xl bg-card p-6 shadow-sm">
              <h2 className="font-bold text-primary">Lịch sử đơn đặt phòng</h2>
              <Timeline
                emptyMessage="Chưa có sự kiện nào được ghi."
                events={t.events.map((event, i) => ({ key: String(i), action: event.action, at: event.at, details: event.details }))}
              />
            </section>
            </div>
          </div>
        )}
    </div>
  );
}

function TransactionList() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  // `?status=REFUND_PENDING` comes from the dashboard figure.
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [method, setMethod] = useState("");
  const [mismatch, setMismatch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());

  const filters: AdminTransactionParams = {
    ...periodParams(from, to),
    search: debouncedSearch || undefined,
    status: oneOf<PaymentStatus>(status),
    method: oneOf<PaymentMethod>(method),
    mismatch: mismatch === "true" ? "true" : undefined,
  };
  const transactions = useAdminTransactions({ ...filters, page, pageSize: PAGE_SIZE });
  const exportFile = useAdminMutation(exportAdminTransactions);

  const update = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const columns: CommonTableColumn<AdminTransaction>[] = [
    {
      id: "booking",
      header: "Đơn đặt phòng",
      cell: (t) => (
        <div>
          <strong className="font-mono text-primary">{t.booking.code}</strong>
          <span className="block text-xs text-muted-foreground">{t.hotel.name}</span>
        </div>
      ),
    },
    { id: "method", header: "Phương thức", cell: (t) => paymentMethodLabels[t.method] },
    {
      id: "status",
      header: "Trạng thái",
      cell: (t) => (
        <div className="flex flex-wrap gap-1">
          <StatusBadge tone={paymentStatusLabels[t.status].tone}>{paymentStatusLabels[t.status].label}</StatusBadge>
          {t.mismatch && <StatusBadge tone="danger">Lệch số tiền</StatusBadge>}
        </div>
      ),
    },
    {
      id: "amount",
      header: "Số tiền",
      align: "right",
      cell: (t) => (
        <div>
          <strong className="font-semibold text-foreground">{formatMoney(t.expectedAmount)}</strong>
          {t.refunded > 0 && <span className="block text-xs text-muted-foreground">Đã hoàn {formatMoney(t.refunded)}</span>}
        </div>
      ),
    },
    {
      id: "created",
      header: "Tạo lúc",
      cell: (t) => (
        <div>
          {formatDateTime(t.createdAt)}
          <span className="block text-xs text-muted-foreground">
            {t.paidAt ? `Thanh toán ${formatDateTime(t.paidAt)}` : "Chưa thanh toán"}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (t) => (
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/admin/transactions/${t.invoiceId}`}>
          <Eye />
          Xem
        </Link>
      ),
    },
  ];

  return (
    <>
      <ListPanel
        filters={
          <>
            <label className="relative block min-w-56 flex-1">
              <span className="sr-only">Tìm theo mã đơn hoặc mã giao dịch SePay</span>
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => update(setSearch)(event.target.value)}
                placeholder="Mã đơn hoặc mã giao dịch SePay"
                className="h-10 pl-9"
                maxLength={100}
              />
            </label>
            <SelectFilter
              label="Trạng thái"
              value={status}
              onChange={update(setStatus)}
              options={Object.entries(paymentStatusLabels).map(([value, { label }]) => [value, label])}
            />
            <SelectFilter label="Phương thức" value={method} onChange={update(setMethod)} options={Object.entries(paymentMethodLabels)} />
            <SelectFilter label="Đối soát" value={mismatch} onChange={update(setMismatch)} options={[["true", "Chỉ giao dịch lệch tiền"]]} />
            <PeriodFilter
              from={from}
              to={to}
              onChange={(nextFrom, nextTo) => {
                setFrom(nextFrom);
                setTo(nextTo);
                setPage(1);
              }}
            />
            <Button
              variant="outline"
              className="h-10"
              disabled={exportFile.isPending}
              onClick={() =>
                exportFile.mutate(filters, {
                  // The API does not expose Content-Disposition cross-origin, so the name follows the backend's pattern.
                  onSuccess: (file) =>
                    saveFile(file, `StayReco_giao-dich_${from && to ? `${from}_${to}` : todayInVietnam()}.xlsx`),
                })
              }
            >
              <FileSpreadsheet aria-hidden />
              {exportFile.isPending ? "Đang xuất…" : "Xuất Excel"}
            </Button>
            {exportFile.error && (
              <div className="basis-full">
                <FormAlert message={getApiErrorMessage(exportFile.error)} />
              </div>
            )}
          </>
        }
        query={transactions}
        columns={columns}
        getRowId={(t) => t.invoiceId}
        emptyMessage="Không có giao dịch nào trong khoảng thời gian và bộ lọc này."
        onPageChange={setPage}
      />
    </>
  );
}

const unmatchedColumns: CommonTableColumn<UnmatchedTransfer>[] = [
  { id: "at", header: "Thời điểm", cell: (t) => formatDateTime(t.at) },
  {
    id: "kind",
    header: "Loại",
    cell: (t) => <StatusBadge tone={t.kind === "LATE" ? "warning" : "danger"}>{t.kind === "LATE" ? "Đến muộn" : "Không khớp"}</StatusBadge>,
  },
  { id: "amount", header: "Số tiền", align: "right", cell: (t) => formatMoney(t.amount) },
  { id: "content", header: "Nội dung chuyển khoản", className: "max-w-xs whitespace-normal", cell: (t) => t.content ?? "—" },
  { id: "code", header: "Mã đơn tìm thấy", cell: (t) => t.code ?? "—" },
  { id: "sepay", header: "Mã SePay", cell: (t) => t.sepayId ?? "—" },
  { id: "reason", header: "Lý do", className: "max-w-xs whitespace-normal", cell: (t) => t.reason ?? "—" },
];

function UnmatchedList() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const transfers = useUnmatchedTransfers({ ...periodParams(from, to), page, pageSize: PAGE_SIZE });
  return (
    <ListPanel
      filters={
        <PeriodFilter
          from={from}
          to={to}
          onChange={(nextFrom, nextTo) => {
            setFrom(nextFrom);
            setTo(nextTo);
            setPage(1);
          }}
        />
      }
      query={transfers}
      columns={unmatchedColumns}
      getRowId={(t) => t.id}
      emptyMessage="Không có chuyển khoản nào cần xử lý tay trong khoảng thời gian này."
      onPageChange={setPage}
    />
  );
}

type TransactionsTab = "transactions" | "unmatched";

/** UC79: one row per invoice with its detail and Excel export, and the SePay transfers to refund by hand. */
export default function AdminTransactions() {
  const [tab, setTab] = useState<TransactionsTab>(
    useSearchParams().get("tab") === "unmatched" ? "unmatched" : "transactions",
  );
  const payments = useAdminOverview().data?.payments;
  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Đối soát tài chính • SePay & Ví StayReco"
        title="Nhật ký & Đối soát Cổng giao dịch"
        description="Thanh toán và hoàn tiền của mọi đơn đặt phòng. Không chọn khoảng thời gian thì hiển thị 30 ngày gần nhất."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Chuyển khoản chưa khớp" value={payments?.unmatchedTransfers} hint="Cần hoàn tay cho người chuyển" icon={ArrowLeftRight} tone="danger" />
        <StatCard label="Chuyển khoản đến muộn" value={payments?.lateTransfers} hint="Tiền về sau khi đơn hết hạn giữ phòng" icon={Clock} tone="warning" />
        <StatCard label="Hóa đơn chờ hoàn tiền" value={payments?.refundsPending} hint="Đang chờ hoàn về ví khách" icon={RotateCcw} />
      </div>
      <Tabs value={tab} onValueChange={(value) => setTab(value as TransactionsTab)}>
        <TabsList variant="line">
          <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
          <TabsTrigger value="unmatched">Chuyển khoản chưa khớp</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "transactions" ? <TransactionList /> : <UnmatchedList />}
    </div>
  );
}
