'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  Loader2,
  ReceiptText,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import type { WalletTxnType } from '@stayreco/shared';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import Pagination from '@/components/common/pagination/Pagination';
import AccountSubNav from '@/features/account/AccountSubNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime, formatMoney } from '@/features/stays/lib/format';
import { useMyWallet, useMyWalletTransactions } from '@/features/account/api/rewards-queries';
import { WALLET_TXN_LABELS } from '@/features/account/lib/rewards-labels';

const PAGE_SIZE = 10;

const FILTERS: Array<{ id: string; label: string; types?: WalletTxnType[] }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'refund', label: 'Tiền hoàn', types: ['REFUND'] },
  { id: 'payment', label: 'Thanh toán', types: ['BOOKING_PAYMENT'] },
];

function TransactionsCard() {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const types = FILTERS.find((item) => item.id === filter)?.types;
  const query = useMyWalletTransactions({ page, pageSize: PAGE_SIZE, type: types });
  const transactions = query.data?.transactions ?? [];
  const meta = query.data?.meta;

  return (
    <Card className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <ReceiptText className="size-5 text-primary" /> Lịch sử giao dịch ví
          {query.isFetching && !query.isLoading && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Đang cập nhật" />
          )}
        </h2>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Lọc giao dịch">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => {
                setFilter(item.id);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                filter === item.id ? 'bg-white text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {query.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Đang tải giao dịch…
        </div>
      ) : query.error ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle className="size-6 text-amber-500" />
          <p className="text-xs text-muted-foreground">{getApiErrorMessage(query.error)}</p>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()} className="gap-1.5">
            <RotateCcw className="size-3.5" /> Thử lại
          </Button>
        </div>
      ) : transactions.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          Chưa có giao dịch nào. Tiền hoàn từ các đơn huỷ sẽ xuất hiện tại đây.
        </p>
      ) : (
        <ul className="space-y-3">
          {transactions.map((tx) => {
            const credit = tx.amount >= 0;
            return (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-slate-50 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full',
                      credit ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700',
                    )}
                  >
                    {credit ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground sm:text-sm">
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
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {formatDateTime(tx.createdAt)}
                      {tx.description && ` · ${tx.description}`}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={cn('block text-sm font-bold sm:text-base', credit ? 'text-emerald-600' : 'text-foreground')}>
                    {credit ? '+' : '−'}
                    {formatMoney(Math.abs(tx.amount))}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Số dư sau: {formatMoney(tx.balanceAfter)}</span>
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

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
      <Header />

      <main className="w-full flex-1 bg-[#f7f9ff]">
        <AccountSubNav activeTab="wallet" />

        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Ví & Hoàn tiền', active: true },
            ]}
          />

          <div className="flex w-full flex-col items-start justify-between gap-6 rounded-2xl bg-linear-to-r from-[#124b6d] via-[#193b56] to-[#ae583c] p-6 text-white shadow-md sm:p-8 md:flex-row md:items-center">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <Wallet className="size-3.5" /> Ví StayReco
              </span>
              {wallet.isLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-white/80">
                  <Loader2 className="size-5 animate-spin" /> Đang tải số dư…
                </div>
              ) : wallet.error || !wallet.data ? (
                <div className="space-y-2">
                  <p className="text-sm text-white/90">{getApiErrorMessage(wallet.error)}</p>
                  <Button
                    size="sm"
                    onClick={() => void wallet.refetch()}
                    className="gap-1.5 bg-white text-primary hover:bg-slate-100"
                  >
                    <RotateCcw className="size-3.5" /> Thử lại
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {formatMoney(wallet.data.balanceAvailable)}
                  </h1>
                  <p className="text-xs text-white/80 sm:text-sm">
                    Số dư khả dụng từ tiền hoàn của các đơn đã huỷ
                    {wallet.data.updatedAt && ` · cập nhật ${formatDateTime(wallet.data.updatedAt)}`}.
                  </p>
                </>
              )}
            </div>

            <Link href="/search" className="w-full shrink-0 md:w-auto">
              <Button className="h-11 w-full border-0 bg-[#ae583c] px-5 text-xs font-bold text-white shadow-xs hover:bg-[#934a33] sm:text-sm">
                Dùng thanh toán đơn mới
              </Button>
            </Link>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#ebd8cc] bg-[#F5EBE5] p-4 text-xs text-[#783520] sm:text-sm">
            <Info className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-1">
              <p>
                <strong>Thanh toán bằng ví:</strong> số dư phải đủ trả <strong>toàn bộ</strong> đơn đặt phòng; chọn
                &ldquo;Thanh toán bằng ví&rdquo; ở trang thanh toán. Nếu không đủ, vui lòng chuyển khoản như thường lệ.
              </p>
              <p>Hiện chưa hỗ trợ rút số dư ví về tài khoản ngân hàng. Tính năng này sẽ có trong bản cập nhật tới.</p>
            </div>
          </div>

          <TransactionsCard />
        </div>
      </main>

      <Footer />
    </div>
  );
}
