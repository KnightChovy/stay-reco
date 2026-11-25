"use client";

import { useState } from "react";
import { CircleCheck, CircleX, Copy, Landmark, PlugZap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorPanel, FormAlert, LoadingPanel, StatusBadge } from "@/features/partner/components";
import { getApiErrorMessage } from "@/lib/api-error";
import { testPaymentSettings } from "@/services/admin.service";
import { PageTitle, Panel, Tile } from "../admin-primitives";
import { useAdminMutation, useAuditLogs, usePaymentSettings } from "../api/admin-queries";
import { AuditEventList } from "../components";
import { formatDateTime, paymentCheckLabels } from "../lib/labels";

/** UC78, decision M10: read-only. The values are server environment settings. */
export default function AdminPaymentSettings() {
  const settings = usePaymentSettings();
  const test = useAdminMutation(testPaymentSettings);
  const s = settings.data;
  const logs = useAuditLogs({ action: ["SEPAY_TRANSFER_UNMATCHED", "SEPAY_TRANSFER_LATE", "BOOKING_CONFIRMED"], page: 1, pageSize: 3 });
  const [copyMessage, setCopyMessage] = useState("");

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Cổng thanh toán • SePay"
        title="Cấu hình Thanh toán & Đối soát Cổng giao dịch"
        description="Thông tin tích hợp và chính sách thanh toán đang áp dụng. Cấu hình chỉ đọc; liên hệ người vận hành để thay đổi."
        action={
          <Button disabled={test.isPending} onClick={() => test.mutate()}>
            <PlugZap aria-hidden />
            {test.isPending ? "Đang kiểm tra…" : "Kiểm tra cấu hình"}
          </Button>
        }
      />
      <FormAlert message={test.error ? getApiErrorMessage(test.error) : undefined} />
      {test.data && (
        <Panel className="gap-3 p-5">
          <h2 className="text-base font-bold text-primary">Kết quả kiểm tra</h2>
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            {test.data.checks.map((check) => (
              <li key={check.name} className={`flex items-start gap-2 rounded-[10px] px-3 py-2.5 ${check.ok ? "bg-success-soft" : "bg-danger-soft"}`}>
                {check.ok ? (
                  <CircleCheck size={18} className="mt-0.5 shrink-0 text-success" aria-hidden />
                ) : (
                  <CircleX size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />
                )}
                <span>
                  <strong>{paymentCheckLabels[check.name]}</strong>: {check.ok ? "Đạt" : "Chưa đạt"}
                  {check.message && <span className="block text-muted-foreground">{check.message}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {settings.error ? (
        <ErrorPanel error={settings.error} onRetry={() => void settings.refetch()} />
      ) : !s ? (
        <LoadingPanel />
      ) : (
        <>
        <Panel className="gap-5 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Landmark size={22} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-foreground">Cổng {s.provider} QR Banking</h2>
              <p className="text-sm text-muted-foreground">
                {s.lastWebhookAt ? `Webhook gần nhất lúc ${formatDateTime(s.lastWebhookAt)}` : "Chưa nhận webhook lần nào"}
              </p>
            </div>
            <StatusBadge tone={s.webhookKeySet ? "success" : "danger"}>
              {s.webhookKeySet ? "Đã đặt khóa webhook" : "Chưa đặt khóa webhook"}
            </StatusBadge>
          </div>
        </Panel>
        <Panel className="gap-5 p-6">
          <div className="flex items-start gap-3"><Landmark className="mt-1 shrink-0 text-primary" /><div><h2 className="text-lg font-bold">Cấu hình tích hợp SePay</h2><p className="mt-1 text-sm text-muted-foreground">Tài khoản thụ hưởng & Kết nối webhook</p></div></div>
          <dl className="grid gap-4 md:grid-cols-3">
            {(
              [
                ["Ngân hàng", `${s.bank.name} (${s.bank.code})`],
                ["Số tài khoản", s.accountNumber],
                ["Tên tài khoản", s.accountName],
                ["Webhook URL", s.webhookUrl],
              ] as const
            ).map(([label, value]) => (
              <Tile key={label} label={label} className={label === "Webhook URL" ? "md:col-span-3" : undefined}>
                <span className="flex items-center justify-between gap-3"><span className={label === "Webhook URL" ? "font-mono text-xs" : ""}>{value}</span>
                {label === "Webhook URL" && <Button variant="ghost" size="sm" aria-label="Sao chép Webhook URL" onClick={async () => {
                  try { await navigator.clipboard.writeText(s.webhookUrl); setCopyMessage("Đã sao chép Webhook URL."); }
                  catch { setCopyMessage("Không thể sao chép. Hãy chọn và sao chép URL thủ công."); }
                }}><Copy />Sao chép</Button>}</span>
              </Tile>
            ))}
          </dl>
          {copyMessage && <output className="text-sm text-primary">{copyMessage}</output>}
        </Panel>
        <Panel className="gap-5 p-6">
          <h2 className="flex items-center gap-3 text-lg font-bold"><ShieldCheck className="text-primary" />Chính sách thanh toán & Giữ tiền</h2>
          <dl className="grid gap-4 md:grid-cols-3">
            <Tile label="Giữ phòng chờ thanh toán">{s.paymentHoldMinutes} phút</Tile>
            <Tile label="Giữ tiền trong ví">{s.walletHoldDays} ngày</Tile>
            <Tile label="Hoa hồng mặc định">{s.defaultCommissionRate}%</Tile>
          </dl>
        </Panel>
        <Panel className="gap-5 p-6">
          <h2 className="text-lg font-bold">Sự kiện thanh toán & Đối soát gần đây</h2>
          {logs.error ? <ErrorPanel error={logs.error} onRetry={() => void logs.refetch()} /> : !logs.data ? <LoadingPanel /> : <AuditEventList events={logs.data.items} emptyMessage="Chưa có sự kiện thanh toán trong 7 ngày gần nhất." />}
        </Panel>
        </>
      )}
    </div>
  );
}
