'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Info, Loader2, ReceiptText, Wallet } from 'lucide-react';
import type { WalletTxnType } from '@stayreco/shared';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import Pagination from '@/components/common/pagination/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDateTime, formatMoney } from '@/features/stays/lib/format';
import { AccountPageHeader, accountContainer } from '@/features/account/AccountShell';
import { SegmentedFilter } from '@/features/account/SegmentedFilter';
import { PayWithWalletHint, PendingRefundsCard } from '@/features/account/wallet/WalletBookingsPanel';
import { useMyWallet, useMyWalletTransactions } from '@/features/account/api/rewards-queries';
import { WALLET_TXN_LABELS } from '@/features/account/lib/rewards-labels';
import { useMyBookings } from '@/features/booking/api/booking-queries';

const PAGE_SIZE = 10;

type FilterId = 'all' | 'refund' | 'payment';

const FILTERS: Array<{ id: FilterId; label: string; types?: WalletTxnType[] }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'refund', label: 'Tiền hoàn', types: ['REFUND'] },
  { id: 'payment', label: 'Thanh toán', types: ['BOOKING_PAYMENT'] },
];

function TransactionsCard() {
  const [filter, setFilter] = useState<FilterId>('all');
  const [page, setPage] = useState(1);
  const types = FILTERS.find((item) => item.id === filter)?.types;
  const query = useMyWalletTransactions({ page, pageSize: PAGE_SIZE, type: types });
  const transactions = query.data?.transactions ?? [];
  const meta = query.data?.meta;

  return (
    <Card className="space-y-5 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <ReceiptText className="size-5 text-primary" aria-hidden /> Lịch sử giao dịch ví
          {query.isFetching && !query.isLoading && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Đang cập nhật" role="status" />
          )}
        </h2>
        <SegmentedFilter
          label="Lọc giao dịch"
          options={FILTERS.map((item) => ({ value: item.id, label: item.label }))}
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
        />
      </div>

      {query.isLoading ? (
        <LoadingState rows={3} label="Đang tải giao dịch…" />
      ) : query.error ? (
        <ErrorState title="Không tải được giao dịch" error={query.error} onRetry={() => void query.refetch()} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={filter === 'all' ? 'Chưa có giao dịch nào' : 'Không có giao dịch loại này'}
          description="Tiền hoàn từ các đơn huỷ và các lần thanh toán bằng ví sẽ xuất hiện tại đây."
        />
      ) : (
        <ul className="space-y-3">
          {transactions.map((tx) => {
            const credit = tx.amount >= 0;
            return (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full',
                      credit ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-foreground',
                    )}
                    aria-hidden
                  >
                    {credit ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {WALLET_TXN_LABELS[tx.type]}
                      {tx.booking && (
                        <>
                          {' · '}
                          <Link href={`/account/bookings/${tx.booking.id}`} className="text-primary hover:underline">
                            #{tx.booking.code}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatDateTime(tx.createdAt)}
                      {tx.description && ` · ${tx.description}`}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={cn('block text-sm font-bold sm:text-base', credit ? 'text-emerald-700' : 'text-foreground')}>
                    {credit ? '+' : '−'}
                    {formatMoney(Math.abs(tx.amount))}
                  </span>
                  <span className="text-xs text-muted-foreground">Số dư sau: {formatMoney(tx.balanceAfter)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </Card>
  );
}

export default function WalletPage() {
  const wallet = useMyWallet();
  // Refunds waiting and bookings waiting for payment are both upcoming (PENDING or CONFIRMED); the first 100 are enough.
  const upcoming = useMyBookings({ tab: 'upcoming', pageSize: 100 });
  const upcomingBookings = upcoming.data?.bookings ?? [];
  const waitingRefunds = upcomingBookings.filter((booking) => booking.paymentStatus === 'REFUND_PENDING');
  const balance = wallet.data?.balanceAvailable ?? 0;
  const payable = upcomingBookings.find(
    (booking) => booking.status === 'PENDING' && balance > 0 && booking.totalAmount <= balance,
  );

  return (
    <div className={cn(accountContainer.narrow, 'space-y-6')}>
      <AppBreadcrumb
        items={[
          { label: 'Tài khoản', href: '/account/profile' },
          { label: 'Ví & Hoàn tiền', active: true },
        ]}
      />

      <AccountPageHeader
        title="Ví & Hoàn tiền"
        description="Tiền hoàn từ các đơn huỷ được cộng vào ví và dùng để trả đơn đặt phòng tiếp theo."
      />

      {wallet.isLoading ? (
        <LoadingState rows={1} label="Đang tải số dư…" />
      ) : wallet.error || !wallet.data ? (
        <ErrorState title="Không tải được số dư ví" error={wallet.error} onRetry={() => void wallet.refetch()} />
      ) : (
        <section
          aria-label="Số dư ví"
          className="flex w-full flex-col items-start justify-between gap-5 rounded-2xl bg-linear-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-md sm:p-8 md:flex-row md:items-center"
        >
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              <Wallet className="size-3.5" aria-hidden /> Số dư khả dụng
            </span>
            <p className="text-3xl font-bold tracking-tight sm:text-4xl">{formatMoney(wallet.data.balanceAvailable)}</p>
            <p className="text-sm text-white/85">
              Từ tiền hoàn của các đơn đã huỷ
              {wallet.data.updatedAt && ` · cập nhật ${formatDateTime(wallet.data.updatedAt)}`}.
            </p>
          </div>
          {balance > 0 && !payable && (
            <Link
              href="/search"
              className={cn(
                buttonVariants({ variant: 'secondary' }),
                'h-10 w-full shrink-0 px-5 md:w-auto',
              )}
            >
              Đặt phòng và trả bằng ví
            </Link>
          )}
        </section>
      )}

      {payable && <PayWithWalletHint booking={payable} />}
      <PendingRefundsCard bookings={waitingRefunds} />

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="space-y-1">
          <p>
            <strong className="text-foreground">Thanh toán bằng ví:</strong> số dư phải đủ trả{' '}
            <strong className="text-foreground">toàn bộ</strong> đơn; chọn &ldquo;Thanh toán bằng ví&rdquo; ở trang thanh
            toán. Nếu không đủ, bạn chuyển khoản như thường lệ.
          </p>
          <p>Hiện chưa hỗ trợ rút số dư về tài khoản ngân hàng.</p>
        </div>
      </div>

      <TransactionsCard />
    </div>
  );
}
