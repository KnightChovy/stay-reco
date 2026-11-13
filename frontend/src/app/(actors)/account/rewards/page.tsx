'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Gift,
  Loader2,
  Percent,
  RotateCcw,
  Sparkles,
  Ticket,
} from 'lucide-react';
import type { LoyaltyAccount, Voucher } from '@stayreco/shared';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import Pagination from '@/components/common/pagination/Pagination';
import AccountSubNav from '@/features/account/AccountSubNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime, formatMoney } from '@/features/stays/lib/format';
import { useMyLoyalty, useMyLoyaltyEntries, useMyVouchers } from '@/features/account/api/rewards-queries';
import {
  LOYALTY_ENTRY_LABELS,
  TIER_LABELS,
  TIER_THRESHOLDS,
  describeVoucherDiscount,
  formatPoints,
} from '@/features/account/lib/rewards-labels';

const PAGE_SIZE = 8;

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}

function ErrorRow({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <AlertTriangle className="size-6 text-amber-500" />
      <p className="text-xs text-muted-foreground">{getApiErrorMessage(error)}</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
        <RotateCcw className="size-3.5" /> Thử lại
      </Button>
    </div>
  );
}

/** StayMiles balance, tier and how far the next tier is (`GET /me/loyalty`). */
function PointsBanner({ account }: { account: LoyaltyAccount }) {
  const next = account.nextTier;
  // The next mark comes from the API; only the start of the current tier is a local constant, capped by what was earned.
  const from = Math.min(TIER_THRESHOLDS[account.tier], account.lifetimePoints);
  const to = next ? account.lifetimePoints + next.pointsNeeded : from;
  const progress = next ? Math.min(100, Math.round(((account.lifetimePoints - from) / Math.max(1, to - from)) * 100)) : 100;

  return (
    <div className="relative flex w-full flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-linear-to-r from-[#124b6d] via-[#934a33] to-[#ae583c] p-6 text-white shadow-md sm:p-8 md:flex-row md:items-center">
      <div className="z-10 w-full space-y-3 md:max-w-md">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-semibold">
          <Sparkles className="size-3.5 text-amber-300" /> Hạng {TIER_LABELS[account.tier]} · {account.programName}
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {formatPoints(account.pointsBalance)}
        </h1>
        <p className="text-xs text-white/90 sm:text-sm">
          Trị giá <strong className="text-white">{formatMoney(account.balanceValue)}</strong> khi dùng cho kỳ nghỉ tiếp
          theo (1 điểm = {formatMoney(account.pointValue)}).
        </p>
        <div className="space-y-1.5">
          <div
            role="progressbar"
            aria-label="Tiến độ lên hạng"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-2 w-full overflow-hidden rounded-full bg-white/25"
          >
            <div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-white/85">
            {next
              ? `Tích thêm ${formatPoints(next.pointsNeeded)} để lên hạng ${TIER_LABELS[next.tier]}.`
              : 'Bạn đang ở hạng cao nhất.'}
          </p>
        </div>
      </div>

      <div className="z-10 w-full shrink-0 rounded-xl border border-white/20 bg-black/25 p-4 text-center shadow-inner md:w-56">
        <span className="block text-xs text-white/80">Tổng điểm đã tích lũy</span>
        <span className="block text-lg font-bold text-white">{formatPoints(account.lifetimePoints)}</span>
        <span className="mt-0.5 block text-[10px] text-emerald-300">Dùng điểm không làm giảm hạng của bạn</span>
      </div>
    </div>
  );
}

function VoucherRow({ voucher }: { voucher: Voucher }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const state = voucher.usedAt ? 'Đã dùng' : voucher.usable ? 'Còn hiệu lực' : 'Hết hiệu lực';

  return (
    <div
      className={cn(
        'flex flex-col items-start justify-between gap-4 rounded-xl border border-border p-4 transition-all sm:flex-row sm:items-center',
        voucher.usable ? 'bg-slate-50 hover:bg-white hover:shadow-xs' : 'bg-slate-50/60 opacity-70',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 font-bold text-[#934a33]">
          <Percent className="size-6" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded border px-2 py-0.5 text-xs font-bold',
                voucher.usable
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-100 text-slate-500',
              )}
            >
              {state}
            </span>
            <h3 className="text-sm font-bold text-foreground">{voucher.promotionName}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {describeVoucherDiscount(voucher)}
            {voucher.minBookingAmount != null && ` · Đơn từ ${formatMoney(voucher.minBookingAmount)}`}
            {voucher.hotelId ? ' · Áp dụng tại khách sạn phát mã' : ' · Áp dụng mọi khách sạn'}
          </p>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3" />
            {voucher.usedAt
              ? `Đã dùng lúc ${formatDateTime(voucher.usedAt)}`
              : voucher.expiresAt
                ? `Hạn dùng: ${formatDateTime(voucher.expiresAt)}`
                : 'Không giới hạn thời gian'}
          </span>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center gap-2 border-t border-border pt-2 sm:w-auto sm:border-t-0 sm:pt-0">
        <Button
          variant="outline"
          onClick={() => void copy()}
          className="h-9 gap-1.5 border-dashed px-3 font-mono text-xs font-semibold text-foreground"
          aria-label={`Sao chép mã ${voucher.code}`}
        >
          {copied ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? 'Đã chép!' : voucher.code}
        </Button>
        {voucher.usable && (
          <Link href="/search">
            <Button className="h-9 gap-1 bg-primary px-4 text-xs font-semibold text-primary-foreground">
              Dùng ngay <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function VouchersCard() {
  const [onlyUsable, setOnlyUsable] = useState(true);
  const [page, setPage] = useState(1);
  const query = useMyVouchers({ page, pageSize: PAGE_SIZE, active: onlyUsable || undefined });
  const vouchers = query.data?.vouchers ?? [];
  const meta = query.data?.meta;

  const switchTab = (usable: boolean) => {
    setOnlyUsable(usable);
    setPage(1);
  };

  return (
    <Card className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="size-5 text-amber-500" />
          <h2 className="text-lg font-bold text-foreground">Voucher của tôi{meta ? ` (${meta.total})` : ''}</h2>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Lọc voucher">
          {[
            { usable: true, label: 'Còn dùng được' },
            { usable: false, label: 'Tất cả' },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={onlyUsable === tab.usable}
              onClick={() => switchTab(tab.usable)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                onlyUsable === tab.usable ? 'bg-white text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <p className="-mt-2 text-xs text-muted-foreground">
        Mã giảm giá cá nhân do khách sạn gửi tặng. Nhập mã ở bước đặt phòng; hệ thống tự chọn ưu đãi có lợi nhất cho bạn.
      </p>

      {query.isLoading ? (
        <LoadingRow label="Đang tải voucher…" />
      ) : query.error ? (
        <ErrorRow error={query.error} onRetry={() => void query.refetch()} />
      ) : vouchers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Gift className="size-8 text-slate-300" />
          <p className="text-sm font-semibold text-foreground">
            {onlyUsable ? 'Bạn chưa có voucher nào còn dùng được' : 'Bạn chưa nhận voucher nào'}
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Các khách sạn thường gửi mã ưu đãi cho khách quen. Khuyến mãi chung của khách sạn được tự động áp dụng khi
            đặt phòng.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {vouchers.map((voucher) => (
            <VoucherRow key={voucher.id} voucher={voucher} />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </Card>
  );
}

function PointsHistoryCard() {
  const [page, setPage] = useState(1);
  const query = useMyLoyaltyEntries({ page, pageSize: PAGE_SIZE });
  const entries = query.data?.entries ?? [];
  const meta = query.data?.meta;

  return (
    <Card className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <Coins className="size-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Lịch sử điểm StayMiles</h2>
      </div>

      {query.isLoading ? (
        <LoadingRow label="Đang tải lịch sử điểm…" />
      ) : query.error ? (
        <ErrorRow error={query.error} onRetry={() => void query.refetch()} />
      ) : entries.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          Chưa có biến động điểm. Điểm được cộng sau khi bạn trả phòng.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry, index) => {
            const positive = entry.points >= 0;
            return (
              <li
                key={`${entry.at}-${index}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-slate-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full',
                      positive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700',
                    )}
                  >
                    {positive ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground sm:text-sm">{LOYALTY_ENTRY_LABELS[entry.kind]}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDateTime(entry.at)}
                      {entry.hotelName && ` · ${entry.hotelName}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn('block text-sm font-bold', positive ? 'text-emerald-600' : 'text-foreground')}>
                    {positive ? '+' : ''}
                    {new Intl.NumberFormat('vi-VN').format(entry.points)}
                  </span>
                  {entry.bookingId && (
                    <Link
                      href={`/account/bookings/${entry.bookingId}`}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Xem đơn
                    </Link>
                  )}
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

export default function RewardsPage() {
  const loyalty = useMyLoyalty();

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
      <Header />

      <main className="w-full flex-1 bg-[#f7f9ff]">
        <AccountSubNav activeTab="rewards" />

        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Voucher & Điểm thưởng', active: true },
            ]}
          />

          {loyalty.isLoading ? (
            <Card className="rounded-2xl border border-border bg-white">
              <LoadingRow label="Đang tải điểm StayMiles…" />
            </Card>
          ) : loyalty.error || !loyalty.data ? (
            <Card className="rounded-2xl border border-border bg-white">
              <ErrorRow error={loyalty.error} onRetry={() => void loyalty.refetch()} />
            </Card>
          ) : (
            <PointsBanner account={loyalty.data} />
          )}

          <VouchersCard />
          <PointsHistoryCard />

          <Card className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-center gap-2">
              <Gift className="size-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">StayMiles hoạt động thế nào?</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  title: 'Tích điểm',
                  body: `Mỗi 1.000 ₫ bạn thực trả được 1 điểm, cộng khi trả phòng.`,
                },
                {
                  title: 'Dùng điểm',
                  body: `Nhập số điểm ở bước đặt phòng; ${loyalty.data ? `mỗi điểm trừ ${formatMoney(loyalty.data.pointValue)}` : 'điểm trừ thẳng vào tổng tiền'}, cộng dồn với khuyến mãi.`,
                },
                {
                  title: 'Hoàn điểm',
                  body: 'Đơn hết hạn giữ chỗ hoặc bị huỷ có hoàn tiền: điểm đã dùng được trả lại ví điểm.',
                },
              ].map((item) => (
                <div key={item.title} className="space-y-1 rounded-xl border border-border bg-slate-50 p-4">
                  <Badge className="bg-primary/10 font-bold text-primary">{item.title}</Badge>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
