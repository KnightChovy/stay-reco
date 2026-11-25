"use client";

import { useState } from "react";
import Link from "next/link";
import { Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBeneficiary, useStatsOverview } from "../api/partner-queries";
import {
  ErrorPanel,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  StatusBadge,
  SuspendedBanner,
  usePartnerHotel,
} from "../components";
import { formatDateTime, formatMoney } from "../lib/labels";
import { PayoutDialog } from "./PayoutDialog";
import { PayoutList } from "./PayoutList";
import { WalletTransactions } from "./WalletTransactions";

export default function PartnerRevenue() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended, canEdit } = usePartnerHotel();

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Doanh thu & đối soát"
        description="Số dư ví khách sạn, tài khoản nhận tiền, yêu cầu rút tiền và từng giao dịch tiền vào ra."
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <RevenueContent key={hotel.id} hotelId={hotel.id} canRequest={canEdit} />
      )}
    </div>
  );
}

function RevenueContent({ hotelId, canRequest }: { hotelId: string; canRequest: boolean }) {
  const overview = useStatsOverview(hotelId, {});
  const beneficiary = useBeneficiary(hotelId);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const wallet = overview.data?.wallet;
  const account = beneficiary.data?.account;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <PartnerPanel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-bold text-primary">Ví khách sạn</h2>
            {canRequest && (
              <Button onClick={() => setPayoutOpen(true)} disabled={!wallet || wallet.available <= 0}>
                <Banknote />
                Rút tiền
              </Button>
            )}
          </div>
          {overview.error ? (
            <div className="mt-3">
              <ErrorPanel error={overview.error} onRetry={() => void overview.refetch()} />
            </div>
          ) : overview.isLoading ? (
            <Skeleton className="mt-3 h-20 w-full" />
          ) : !wallet ? (
            <p className="mt-3 text-sm text-muted-foreground">Khách sạn chưa có ví.</p>
          ) : (
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <Balance label="Khả dụng" value={wallet.available} hint="Rút được ngay" strong />
              <Balance label="Đang chờ" value={wallet.pending} hint="Chuyển sang khả dụng sau thời gian giữ" />
              <Balance label="Tạm giữ" value={wallet.reserved} hint="Đang chờ chuyển cho yêu cầu rút" />
            </dl>
          )}
        </PartnerPanel>

        <PartnerPanel className="p-5">
          <h2 className="font-bold text-primary">Tài khoản nhận tiền</h2>
          {beneficiary.error ? (
            <div className="mt-3">
              <ErrorPanel error={beneficiary.error} onRetry={() => void beneficiary.refetch()} />
            </div>
          ) : beneficiary.isLoading ? (
            <Skeleton className="mt-3 h-20 w-full" />
          ) : account ? (
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-semibold text-foreground">{account.bankName}</p>
              <p className="tabular-nums text-muted-foreground">
                {account.accountNumber} · {account.accountHolder}
              </p>
              {beneficiary.data?.verifiedAt && (
                <p className="text-xs text-muted-foreground">Xác minh lúc {formatDateTime(beneficiary.data.verifiedAt)}</p>
              )}
              {beneficiary.data?.updatePending && (
                <StatusBadge tone="warning" className="mt-1">
                  Tài khoản mới đang chờ duyệt
                </StatusBadge>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Chưa có tài khoản đã xác minh.{" "}
              <Link href="/partner/verification" className="font-semibold text-primary underline">
                Gửi hồ sơ xác minh
              </Link>{" "}
              để nhận tiền.
            </p>
          )}
        </PartnerPanel>
      </div>

      <PayoutList hotelId={hotelId} />
      <WalletTransactions hotelId={hotelId} />

      <PayoutDialog
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
        hotelId={hotelId}
        available={wallet?.available}
        beneficiary={beneficiary.data}
      />
    </div>
  );
}

function Balance({ label, value, hint, strong }: { label: string; value: number; hint: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className={strong ? "text-xl font-bold tabular-nums text-primary" : "text-lg font-semibold tabular-nums text-foreground"}>
        {formatMoney(value)}
      </dd>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
