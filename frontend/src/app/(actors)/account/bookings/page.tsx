'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Award, CalendarDays, ChevronRight, Luggage, QrCode, Search, SearchX, X } from 'lucide-react';
import type { BookingSummary, MyBookingsQuery } from '@stayreco/shared';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import Pagination from '@/components/common/pagination/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { AccountPageHeader, accountContainer } from '@/features/account/AccountShell';
import { SupportCard } from '@/features/account/SupportCard';
import { TripCard } from '@/features/account/bookings/TripCard';
import { useMyLoyalty } from '@/features/account/api/rewards-queries';
import { TIER_LABELS, formatPoints } from '@/features/account/lib/rewards-labels';
import { useMyBookings } from '@/features/booking/api/booking-queries';
import { stayRelativeLabel } from '@/features/booking/lib/booking-status';
import { formatDate } from '@/features/stays/lib/format';

type BookingTab = NonNullable<MyBookingsQuery['tab']>;

const STATUS_TABS: { id: BookingTab; label: string; empty: string; hint: string }[] = [
  {
    id: 'upcoming',
    label: 'Sắp tới',
    empty: 'Bạn chưa có chuyến đi sắp tới',
    hint: 'Tìm chỗ nghỉ và đặt phòng, chuyến đi sẽ hiện ở đây cùng voucher check-in.',
  },
  {
    id: 'staying',
    label: 'Đang lưu trú',
    empty: 'Không có chuyến nào đang lưu trú',
    hint: 'Đơn chuyển sang đây khi lễ tân check-in cho bạn.',
  },
  {
    id: 'completed',
    label: 'Đã hoàn tất',
    empty: 'Chưa có chuyến đi đã hoàn tất',
    hint: 'Sau khi trả phòng, bạn có thể đánh giá kỳ nghỉ từ đây.',
  },
  {
    id: 'cancelled',
    label: 'Đã huỷ / hết hạn',
    empty: 'Không có đơn đã huỷ hay hết hạn',
    hint: 'Đơn bạn huỷ và đơn hết hạn giữ chỗ sẽ hiện ở đây.',
  },
];

const PAGE_SIZE = 6;

function isTab(value: string | null): value is BookingTab {
  return STATUS_TABS.some((tab) => tab.id === value);
}

/** The points balance in the page header; hidden while it loads or when the programme is unavailable. */
function LoyaltyBadge() {
  const loyalty = useMyLoyalty().data;
  if (!loyalty) return null;
  return (
    <Link
      href="/account/rewards"
      className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs transition-colors hover:border-primary/30"
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Award className="size-5" aria-hidden />
      </span>
      <span className="text-sm">
        <span className="block text-xs text-muted-foreground">Điểm {loyalty.programName}</span>
        <span className="font-bold text-foreground">
          {formatPoints(loyalty.pointsBalance)} · Hạng {TIER_LABELS[loyalty.tier]}
        </span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
    </Link>
  );
}

/** The soonest confirmed trip, from the customer's upcoming bookings; nothing is invented when there is none. */
function NextTripCard() {
  const { data, isLoading } = useMyBookings({ tab: 'upcoming', page: 1, pageSize: 20 });
  const next = useMemo(() => {
    const confirmed = (data?.bookings ?? []).filter((booking) => booking.status === 'CONFIRMED');
    return confirmed.sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0] as BookingSummary | undefined;
  }, [data]);

  if (isLoading) return <LoadingState rows={1} />;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <CalendarDays className="size-4 text-primary" aria-hidden /> Chuyến đi gần nhất
      </h2>
      {next ? (
        <div className="mt-3 space-y-3">
          <div>
            <Link href={`/account/bookings/${next.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">
              {next.hotel.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {formatDate(next.checkIn)} → {formatDate(next.checkOut)} · {next.nights} đêm
            </p>
            {stayRelativeLabel(next) && (
              <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {stayRelativeLabel(next)}
              </span>
            )}
          </div>
          <Link
            href={`/booking/confirmation?id=${next.id}`}
            className={cn(buttonVariants({ variant: 'default' }), 'h-10 w-full gap-1.5')}
          >
            <QrCode className="size-4" aria-hidden /> Mở voucher check-in
          </Link>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">Bạn chưa có chuyến đi nào đã xác nhận.</p>
          <Link href="/search" className={cn(buttonVariants({ variant: 'outline' }), 'h-10 w-full')}>
            Tìm chỗ nghỉ
          </Link>
        </div>
      )}
    </section>
  );
}

function MyBookingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: BookingTab = isTab(tabParam) ? tabParam : 'upcoming';
  const urlQuery = searchParams.get('q') ?? '';

  const [searchInput, setSearchInput] = useState(urlQuery);
  const debouncedSearch = useDebounce(searchInput).trim();
  // The page belongs to one tab and one search; changing either starts again at page 1.
  const listKey = `${activeTab}|${urlQuery}`;
  const [pageState, setPageState] = useState({ key: listKey, page: 1 });
  const page = pageState.key === listKey ? pageState.page : 1;

  const updateUrl = (next: { tab?: BookingTab; q?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    const tab = next.tab ?? activeTab;
    const q = next.q ?? urlQuery;
    if (tab === 'upcoming') params.delete('tab');
    else params.set('tab', tab);
    if (q) params.set('q', q);
    else params.delete('q');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // The URL follows the typed search once typing pauses, so a reload or a shared link keeps it.
  const settled = debouncedSearch === searchInput.trim();
  useEffect(() => {
    // Only once the box has settled: a stale debounced value must not undo "Xoá tìm kiếm".
    if (!settled || debouncedSearch === urlQuery) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) params.set('q', debouncedSearch);
    else params.delete('q');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [settled, debouncedSearch, urlQuery, searchParams, pathname, router]);

  const params = useMemo(
    () => ({ tab: activeTab, search: urlQuery || undefined, page, pageSize: PAGE_SIZE }),
    [activeTab, urlQuery, page],
  );
  const { data, isLoading, isFetching, error, refetch } = useMyBookings(params);
  const bookings = data?.bookings ?? [];
  const meta = data?.meta;
  const tabInfo = STATUS_TABS.find((tab) => tab.id === activeTab) ?? STATUS_TABS[0];

  const clearSearch = () => {
    setSearchInput('');
    updateUrl({ q: '' });
  };

  return (
    <div className={accountContainer.wide}>
      <AppBreadcrumb
        items={[
          { label: 'Tài khoản', href: '/account/profile' },
          { label: 'Chuyến đi của tôi', active: true },
        ]}
      />

      <div className="mt-4 mb-6">
        <AccountPageHeader
          title="Chuyến đi của tôi"
          description="Theo dõi đặt phòng, mở voucher check-in và quản lý đơn ở một nơi."
          actions={<LoyaltyBadge />}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-5 lg:col-span-8">
          <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
            <div className="relative">
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                aria-label="Tìm đặt phòng theo mã đơn"
                placeholder="Tìm theo mã đơn, ví dụ SR-261020-0842"
                className="h-11 w-full rounded-lg border border-transparent bg-muted pr-11 pl-10 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/20 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Xoá tìm kiếm"
                  className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto" role="group" aria-label="Lọc theo trạng thái">
              {STATUS_TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateUrl({ tab: tab.id })}
                    className={cn(
                      'h-10 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors',
                      active ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {tab.label}
                    {active && meta && !isLoading && <span className="ml-1.5 opacity-80">({meta.total})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <ErrorState title="Không tải được chuyến đi" error={error} onRetry={() => void refetch()} />
          ) : isLoading ? (
            <LoadingState rows={3} label="Đang tải chuyến đi…" className="[&>*]:h-52" />
          ) : bookings.length === 0 ? (
            urlQuery ? (
              <EmptyState
                icon={SearchX}
                title={`Không tìm thấy đơn khớp “${urlQuery}”`}
                description={`Trong mục “${tabInfo.label}”. Kiểm tra lại mã đơn hoặc xem các mục khác.`}
                action={
                  <button type="button" onClick={clearSearch} className={cn(buttonVariants({ variant: 'outline' }), 'h-10')}>
                    Xoá tìm kiếm
                  </button>
                }
              />
            ) : (
              <EmptyState
                icon={Luggage}
                title={tabInfo.empty}
                description={tabInfo.hint}
                action={
                  activeTab === 'upcoming' ? (
                    <Link href="/search" className={cn(buttonVariants({ variant: 'default' }), 'h-10 px-5')}>
                      Tìm chỗ nghỉ
                    </Link>
                  ) : undefined
                }
              />
            )
          ) : (
            <div className={cn('space-y-4 transition-opacity', isFetching && 'opacity-70')} aria-busy={isFetching}>
              {bookings.map((booking) => (
                <TripCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(next) => setPageState({ key: listKey, page: next })}
            />
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-40 lg:col-span-4">
          <NextTripCard />
          <SupportCard note="Cần đổi thông tin khách hoặc hỏi về hoàn tiền? Liên hệ StayReco." />
        </aside>
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense fallback={<div className={accountContainer.wide}><LoadingState rows={3} /></div>}>
      <MyBookingsContent />
    </Suspense>
  );
}
