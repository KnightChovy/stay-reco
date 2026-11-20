'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Clock, Coins, Gift, HelpCircle, Percent, Sparkles, Ticket } from 'lucide-react';
import type { LoyaltyAccount, Voucher } from '@stayreco/shared';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import Pagination from '@/components/common/pagination/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDateTime, formatMoney } from '@/features/stays/lib/format';
import { AccountPageHeader, accountContainer } from '@/features/account/AccountShell';
import { SegmentedFilter } from '@/features/account/SegmentedFilter';
import { VoucherCodeCopy } from '@/features/account/rewards/VoucherCodeCopy';
import { useMyLoyalty, useMyLoyaltyEntries, useMyVouchers } from '@/features/account/api/rewards-queries';
import {
  LOYALTY_ENTRY_LABELS,
  TIER_LABELS,
  TIER_THRESHOLDS,
  describeVoucherDiscount,
  formatPoints,
} from '@/features/account/lib/rewards-labels';

const PAGE_SIZE = 8;
const DAY_MS = 86_400_000;

/** StayMiles balance, tier and how far the next tier is (`GET /me/loyalty`). */
function PointsBanner({ account }: { account: LoyaltyAccount }) {
  const next = account.nextTier;
  // The next mark comes from the API; only the start of the current tier is a local constant, capped by what was earned.
  const from = Math.min(TIER_THRESHOLDS[account.tier], account.lifetimePoints);
  const to = next ? account.lifetimePoints + next.pointsNeeded : from;
  const progress = next ? Math.min(100, Math.round(((account.lifetimePoints - from) / Math.max(1, to - from)) * 100)) : 100;

  return (
    <section
      aria-label="Điểm StayMiles"
      className="relative flex w-full flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-linear-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-md sm:p-8 md:flex-row md:items-center"
    >
      <div className="z-10 w-full space-y-3 md:max-w-md">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xs font-semibold">
          <Sparkles className="size-3.5 text-amber-300" aria-hidden /> Hạng {TIER_LABELS[account.tier]} · {account.programName}
        </span>
        <p className="text-3xl font-bold tracking-tight sm:text-4xl">{formatPoints(account.pointsBalance)}</p>
        <p className="text-sm text-white/90">
          Trị giá <strong className="text-white">{formatMoney(account.balanceValue)}</strong> khi dùng cho kỳ nghỉ tiếp theo
          (1 điểm = {formatMoney(account.pointValue)}).
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
          <p className="text-xs text-white/90">
            {next
              ? `Tích thêm ${formatPoints(next.pointsNeeded)} để lên hạng ${TIER_LABELS[next.tier]}.`
              : 'Bạn đang ở hạng cao nhất.'}
          </p>
        </div>
      </div>

      <div className="z-10 w-full shrink-0 rounded-xl border border-white/20 bg-black/20 p-4 text-center md:w-56">
        <span className="block text-xs text-white/85">Tổng điểm đã tích luỹ</span>
        <span className="block text-lg font-bold">{formatPoints(account.lifetimePoints)}</span>
        <span className="mt-0.5 block text-xs text-white/85">Dùng điểm không làm giảm hạng</span>
      </div>
    </section>
  );
}

/** "Còn 3 ngày": amber within a week, red within two days; null when there is no deadline worth flagging. */
function expiryChip(voucher: Voucher, now: number) {
  if (!voucher.usable || !voucher.expiresAt) return null;
  const days = Math.ceil((Date.parse(voucher.expiresAt) - now) / DAY_MS);
  if (days > 7) return null;
  const label = days <= 0 ? 'Hết hạn hôm nay' : days === 1 ? 'Còn 1 ngày' : `Còn ${days} ngày`;
  return { label, tone: days <= 2 ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-amber-50 text-amber-900 ring-amber-200' };
}

function VoucherRow({ voucher, now }: { voucher: Voucher; now: number }) {
  const state = voucher.usedAt ? 'Đã dùng' : voucher.usable ? null : 'Hết hiệu lực';
  const chip = expiryChip(voucher, now);
  const useHref = voucher.hotelId ? `/hotels/${voucher.hotelId}` : '/search';

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800',
            !voucher.usable && 'opacity-50 grayscale',
          )}
          aria-hidden
        >
          <Percent className="size-6" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">{voucher.promotionName}</h3>
            {state && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{state}</span>
            )}
            {chip && (
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', chip.tone)}>
                {chip.label}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {describeVoucherDiscount(voucher)}
            {voucher.minBookingAmount != null && ` · Đơn từ ${formatMoney(voucher.minBookingAmount)}`}
            {voucher.hotelId ? ' · Chỉ dùng tại khách sạn phát mã' : ' · Dùng ở mọi khách sạn'}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" aria-hidden />
            {voucher.usedAt
              ? `Đã dùng lúc ${formatDateTime(voucher.usedAt)}`
              : voucher.expiresAt
                ? `Hạn dùng: ${formatDateTime(voucher.expiresAt)}`
                : 'Không giới hạn thời gian'}
          </p>
          <VoucherCodeCopy code={voucher.code} />
        </div>
      </div>

      {voucher.usable && (
        <Link
          href={useHref}
          className={cn(buttonVariants(), 'h-10 w-full shrink-0 gap-1 px-5 sm:w-auto')}
        >
          {voucher.hotelId ? 'Đặt tại khách sạn này' : 'Dùng ngay'} <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function VouchersCard({ now }: { now: number }) {
  const [filter, setFilter] = useState<'usable' | 'all'>('usable');
  const [page, setPage] = useState(1);
  const onlyUsable = filter === 'usable';
  const query = useMyVouchers({ page, pageSize: PAGE_SIZE, active: onlyUsable || undefined });
  const meta = query.data?.meta;
  // Soonest to expire first within the page, so the codes about to be lost are seen first.
  const vouchers = useMemo(
    () =>
      [...(query.data?.vouchers ?? [])].sort((a, b) => {
        if (a.usable !== b.usable) return a.usable ? -1 : 1;
        const ax = a.expiresAt ? Date.parse(a.expiresAt) : Number.POSITIVE_INFINITY;
        const bx = b.expiresAt ? Date.parse(b.expiresAt) : Number.POSITIVE_INFINITY;
        return ax - bx;
      }),
    [query.data],
  );

  return (
    <Card className="space-y-5 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Ticket className="size-5 text-amber-600" aria-hidden /> Voucher của tôi{meta ? ` (${meta.total})` : ''}
        </h2>
        <SegmentedFilter
          label="Lọc voucher"
          options={[
            { value: 'usable', label: 'Còn dùng được' },
            { value: 'all', label: 'Tất cả (gồm đã dùng, hết hạn)' },
          ]}
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Mã giảm giá cá nhân do khách sạn gửi tặng. Ở bước đặt phòng, hệ thống tự chọn ưu đãi có lợi nhất cho bạn.
      </p>

      {query.isLoading ? (
        <LoadingState rows={2} label="Đang tải voucher…" />
      ) : query.error ? (
        <ErrorState title="Không tải được voucher" error={query.error} onRetry={() => void query.refetch()} />
      ) : vouchers.length === 0 ? (
        <EmptyState
          icon={Gift}
          title={onlyUsable ? 'Bạn chưa có voucher nào còn dùng được' : 'Bạn chưa nhận voucher nào'}
          description="Các khách sạn thường gửi mã ưu đãi cho khách quen. Khuyến mãi chung của khách sạn được tự áp dụng khi đặt phòng."
          action={
            <Link href="/search" className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-4')}>
              Tìm chỗ nghỉ
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {vouchers.map((voucher) => (
            <VoucherRow key={voucher.id} voucher={voucher} now={now} />
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
    <Card className="space-y-5 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
      <h2 className="flex items-center gap-2 border-b border-border pb-4 text-lg font-bold text-foreground">
        <Coins className="size-5 text-primary" aria-hidden /> Lịch sử điểm StayMiles
      </h2>

      {query.isLoading ? (
        <LoadingState rows={2} label="Đang tải lịch sử điểm…" />
      ) : query.error ? (
        <ErrorState title="Không tải được lịch sử điểm" error={query.error} onRetry={() => void query.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState icon={Coins} title="Chưa có biến động điểm" description="Điểm được cộng sau khi bạn trả phòng." />
      ) : (
        <ul className="space-y-3">
          {entries.map((entry, index) => {
            const positive = entry.points >= 0;
            return (
              <li
                key={`${entry.at}-${index}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full',
                      positive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-foreground',
                    )}
                    aria-hidden
                  >
                    {positive ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{LOYALTY_ENTRY_LABELS[entry.kind]}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(entry.at)}
                      {entry.hotelName && ` · ${entry.hotelName}`}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={cn('block text-sm font-bold', positive ? 'text-emerald-700' : 'text-foreground')}>
                    {positive ? '+' : ''}
                    {new Intl.NumberFormat('vi-VN').format(entry.points)}
                  </span>
                  {entry.bookingId && (
                    <Link
                      href={`/account/bookings/${entry.bookingId}`}
                      className="inline-flex min-h-8 items-center text-xs font-semibold text-primary hover:underline"
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

/** Opens by itself for a customer with no points yet, who is the one who needs it; folded for everyone else. */
function HowItWorks({ pointValue, open }: { pointValue?: number; open: boolean }) {
  const items = [
    { title: 'Tích điểm', body: 'Mỗi 1.000 ₫ bạn thực trả được 1 điểm, cộng khi trả phòng.' },
    {
      title: 'Dùng điểm',
      body: `Nhập số điểm ở bước đặt phòng; ${pointValue ? `mỗi điểm trừ ${formatMoney(pointValue)}` : 'điểm trừ thẳng vào tiền phòng'}, cộng dồn với khuyến mãi.`,
    },
    { title: 'Hoàn điểm', body: 'Đơn hết hạn giữ chỗ hoặc bị huỷ có hoàn tiền: điểm đã dùng được trả lại.' },
  ];
  return (
    <details open={open} className="group rounded-2xl border border-border bg-card shadow-xs">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-base font-bold text-foreground sm:px-6">
        <span className="flex items-center gap-2">
          <HelpCircle className="size-5 text-primary" aria-hidden /> StayMiles hoạt động thế nào?
        </span>
        <span className="text-sm font-semibold text-primary group-open:hidden">Xem</span>
        <span className="hidden text-sm font-semibold text-primary group-open:inline">Thu gọn</span>
      </summary>
      <div className="grid grid-cols-1 gap-3 px-4 pb-5 sm:grid-cols-3 sm:px-6">
        {items.map((item) => (
          <div key={item.title} className="space-y-1.5 rounded-xl border border-border bg-muted/40 p-4">
            <Badge className="bg-primary/10 font-bold text-primary">{item.title}</Badge>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function RewardsPage() {
  const loyalty = useMyLoyalty();
  // Read once when the page opens: the expiry chips do not need to tick.
  const [now] = useState(() => Date.now());

  return (
    <div className={cn(accountContainer.narrow, 'space-y-6')}>
      <AppBreadcrumb
        items={[
          { label: 'Tài khoản', href: '/account/profile' },
          { label: 'Voucher & Điểm thưởng', active: true },
        ]}
      />

      <AccountPageHeader
        title="Voucher & Điểm thưởng"
        description="Điểm StayMiles tích từ các kỳ nghỉ và mã giảm giá khách sạn gửi riêng cho bạn."
      />

      {loyalty.isLoading ? (
        <LoadingState rows={1} label="Đang tải điểm StayMiles…" />
      ) : loyalty.error || !loyalty.data ? (
        <ErrorState title="Không tải được điểm StayMiles" error={loyalty.error} onRetry={() => void loyalty.refetch()} />
      ) : (
        <PointsBanner account={loyalty.data} />
      )}

      <VouchersCard now={now} />
      <PointsHistoryCard />
      <HowItWorks pointValue={loyalty.data?.pointValue} open={loyalty.data?.lifetimePoints === 0} />
    </div>
  );
}
