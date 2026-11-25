"use client";

import { useState } from "react";
import type { Payout } from "@stayreco/shared";
import { TablePagination } from "@/components/common/table/TablePagination";
import { Button } from "@/components/ui/button";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation, usePayouts } from "../api/partner-queries";
import { ConfirmDialog, ErrorPanel, PartnerPanel, StatusBadge } from "../components";
import { formatDateTime, formatMoney, payoutStatusLabels } from "../lib/labels";

const PAGE_SIZE = 10;

function payoutNote(payout: Payout) {
  switch (payout.status) {
    case "PENDING":
      return `Hạn xử lý ${formatDateTime(payout.dueBy)}`;
    case "PAID":
      return `Chuyển lúc ${formatDateTime(payout.decidedAt)}${payout.bankReference ? ` · Mã GD ${payout.bankReference}` : ""}`;
    case "REJECTED":
      return payout.reason ? `Lý do: ${payout.reason}` : `Từ chối lúc ${formatDateTime(payout.decidedAt)}`;
    case "CANCELLED":
      return `Huỷ lúc ${formatDateTime(payout.decidedAt)}`;
  }
}

export function PayoutList({ hotelId }: { hotelId: string }) {
  const [page, setPage] = useState(1);
  const [toCancel, setToCancel] = useState<Payout>();
  const query = usePayouts(hotelId, { page, pageSize: PAGE_SIZE });

  const cancelMutation = usePartnerMutation((payout: Payout) => partnerService.cancelPayout(hotelId, payout.id), {
    invalidate: () => [partnerKeys.walletOf(hotelId), partnerKeys.statsOf(hotelId)],
    successMessage: (data) => `Đã huỷ yêu cầu rút ${formatMoney(data.amount)}; tiền đã về số dư khả dụng.`,
    onSuccess: () => setToCancel(undefined),
  });

  const payouts = query.data?.payouts ?? [];
  const meta = query.data?.meta;

  return (
    <PartnerPanel className="overflow-hidden p-0">
      <h2 className="px-5 pt-5 font-bold text-primary">Yêu cầu rút tiền</h2>
      {query.error ? (
        <div className="p-5">
          <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : query.isLoading ? (
        <p className="p-5 text-sm text-muted-foreground">Đang tải…</p>
      ) : payouts.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">Chưa có yêu cầu rút tiền nào.</p>
      ) : (
        <>
          <ul className="mt-3 divide-y border-t">
            {payouts.map((payout) => {
              const status = payoutStatusLabels[payout.status];
              return (
                <li key={payout.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="tabular-nums text-foreground">{formatMoney(payout.amount)}</strong>
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                      {payout.overdue && <StatusBadge tone="danger">Quá hạn</StatusBadge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Yêu cầu {formatDateTime(payout.requestedAt)} · {payout.beneficiary.bankName}{" "}
                      {payout.beneficiary.accountNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">{payoutNote(payout)}</p>
                  </div>
                  {payout.status === "PENDING" && (
                    <Button variant="outline" size="sm" className="shrink-0" onClick={() => setToCancel(payout)}>
                      Huỷ yêu cầu
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
          {meta && meta.total > meta.pageSize && (
            <TablePagination page={page} pageSize={meta.pageSize} total={meta.total} onPageChange={setPage} />
          )}
        </>
      )}

      <ConfirmDialog
        open={!!toCancel}
        onOpenChange={(open) => !open && setToCancel(undefined)}
        title="Huỷ yêu cầu rút tiền?"
        description={`${formatMoney(toCancel?.amount)} sẽ quay lại số dư khả dụng. Nếu nền tảng vừa chuyển tiền, yêu cầu không huỷ được nữa.`}
        confirmLabel="Huỷ yêu cầu"
        destructive
        pending={cancelMutation.isPending}
        onConfirm={() => toCancel && cancelMutation.mutate(toCancel)}
      />
    </PartnerPanel>
  );
}
