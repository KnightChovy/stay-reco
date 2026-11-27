'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import HotelCard from '@/components/common/card/HotelCard';
import Pagination from '@/components/common/pagination/Pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { StaySearchBar } from '@/features/stays/components/StaySearchBar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAmenities, useFilterSuggestions, useHotelSearch } from '@/features/stays/api/stays-queries';
import { STYLES } from '@/features/account/lib/preference-options';
import { Check, Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FilterSuggestion } from '@stayreco/shared';
import { formatDate, formatMoney } from '@/features/stays/lib/format';
import { buildSearchHref, nightsBetween, parseHotelSearchParams } from '@/features/stays/lib/params';
import { StyleBadges } from '@/features/stays/components/StyleBadges';
import { useMyTravelStyles } from '@/features/account/api/rewards-queries';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

const SORT_LABELS: Record<string, string> = {
  recommended: 'Phù hợp nhất',
  'price-asc': 'Giá: Thấp đến cao',
  'price-desc': 'Giá: Cao đến thấp',
  'star-desc': 'Hạng sao cao nhất',
};

function SearchContent() {
  const chosenStyles = useMyTravelStyles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = parseHotelSearchParams(new URLSearchParams(searchParams.toString()));
  const { data, isLoading, isFetching, error, refetch } = useHotelSearch(query);
  const amenities = useAmenities();
  const suggestions = useFilterSuggestions(query);

  const [priceMin, setPriceMin] = useState(query.priceMin ? String(query.priceMin) : '');
  const [priceMax, setPriceMax] = useState(query.priceMax ? String(query.priceMax) : '');
  // The chip just tapped: it spins while the results it asked for load (the old ones stay, dimmed).
  const [tapped, setTapped] = useState<string | null>(null);
  const updating = isFetching && !isLoading;

  const navigate = (changes: Record<string, string | number | boolean | string[] | number[] | undefined>) => {
    const next = {
      destination: query.destination,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      guests: query.guests,
      rooms: query.rooms,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      starRating: query.starRating,
      amenityIds: query.amenityIds,
      freeCancellation: query.freeCancellation || undefined,
      style: query.style,
      ...changes,
    };
    router.push(buildSearchHref(next));
  };

  // A suggestion is only offered, never applied by itself: tapping it sets that filter like the sidebar would.
  // The same key as the applied filter it sets (see `activeFilters`), so an applied one is shown once, on its chip.
  const suggestionKey = (s: FilterSuggestion) =>
    s.kind === 'style' ? 'style' : s.kind === 'freeCancellation' ? 'free' : `${s.kind}-${s.value}`;
  const isApplied = (s: FilterSuggestion) => {
    switch (s.kind) {
      case 'style':
        return query.style === s.value;
      case 'amenity':
        return (query.amenityIds ?? []).includes(s.value);
      case 'star':
        return (query.starRating ?? []).includes(Number(s.value));
      case 'freeCancellation':
        return query.freeCancellation === true;
    }
  };
  // A chip turns its filter on and off where it stands, like Airbnb's filter bar.
  const toggleSuggestion = (s: FilterSuggestion) => {
    const on = !isApplied(s);
    setTapped(suggestionKey(s));
    switch (s.kind) {
      case 'style':
        return navigate({ style: on ? s.value : undefined, page: 1 });
      case 'amenity':
        return toggleAmenity(s.value);
      case 'star':
        return toggleStar(Number(s.value));
      case 'freeCancellation':
        return navigate({ freeCancellation: on || undefined, page: 1 });
    }
  };

  const toggleStar = (star: number) => {
    const current = query.starRating ?? [];
    const next = current.includes(star) ? current.filter((value) => value !== star) : [...current, star];
    navigate({ starRating: next, page: 1 });
  };

  const toggleAmenity = (amenityId: string) => {
    const current = query.amenityIds ?? [];
    const next = current.includes(amenityId)
      ? current.filter((value) => value !== amenityId)
      : [...current, amenityId];
    navigate({ amenityIds: next, page: 1 });
  };

  const clearFilters = () => {
    router.push(
      buildSearchHref({
        destination: query.destination,
        checkIn: query.checkIn,
        checkOut: query.checkOut,
        guests: query.guests,
        rooms: query.rooms,
        sort: 'recommended',
        page: 1,
      }),
    );
    setPriceMin('');
    setPriceMax('');
  };

  const hotels = data?.hotels ?? [];
  const meta = data?.meta;
  const nights = nightsBetween(query.checkIn, query.checkOut);
  // Each applied filter with how to take it off alone (the destination is the search itself, shown in the title).
  const activeFilters: { key: string; label: string; remove: () => void }[] = [
    ...(query.style
      ? [{
          key: 'style',
          label: STYLES.find((item) => item.id === query.style)?.title ?? query.style,
          remove: () => navigate({ style: undefined, page: 1 }),
        }]
      : []),
    ...(query.starRating ?? []).map((star) => ({
      key: `star-${star}`,
      label: `${star} sao`,
      remove: () => toggleStar(star),
    })),
    ...(query.amenityIds ?? []).map((id) => ({
      key: `amenity-${id}`,
      label: amenities.data?.find((item) => item.id === id)?.name ?? 'Tiện nghi',
      remove: () => toggleAmenity(id),
    })),
    ...(query.freeCancellation
      ? [{ key: 'free', label: 'Miễn phí huỷ', remove: () => navigate({ freeCancellation: undefined, page: 1 }) }]
      : []),
    ...(query.priceMin
      ? [{
          key: 'priceMin',
          label: `Từ ${formatMoney(query.priceMin)}/đêm`,
          remove: () => {
            setPriceMin('');
            navigate({ priceMin: undefined, page: 1 });
          },
        }]
      : []),
    ...(query.priceMax
      ? [{
          key: 'priceMax',
          label: `Đến ${formatMoney(query.priceMax)}/đêm`,
          remove: () => {
            setPriceMax('');
            navigate({ priceMax: undefined, page: 1 });
          },
        }]
      : []),
  ];
  const suggested = suggestions.data ?? [];
  const shownOnChips = new Set(suggested.filter(isApplied).map(suggestionKey));
  const otherFilters = activeFilters.filter((filter) => !shownOnChips.has(filter.key));

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc] text-[#2D3748]">
      <Header />

      <section className="border-b border-gray-200 bg-white py-2 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StaySearchBar
            key={`${query.destination}-${query.checkIn}-${query.checkOut}-${query.guests}-${query.rooms}`}
            initialDestination={query.destination}
            initialCheckIn={query.checkIn}
            initialCheckOut={query.checkOut}
            initialGuests={query.guests}
            initialRooms={query.rooms}
            onSearch={(params) => navigate({ ...params, page: 1 })}
          />
        </div>
      </section>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AppBreadcrumb
          items={[{ label: 'Trang chủ', href: '/' }, { label: query.destination }]}
          className="mb-2"
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chỗ nghỉ tại {query.destination}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {isLoading
                  ? 'Đang tìm…'
                  : updating
                    ? 'Đang cập nhật…'
                    : `Tìm thấy ${meta?.total ?? hotels.length} chỗ nghỉ còn phòng`}
              </span>
              <span>{formatDate(query.checkIn)} – {formatDate(query.checkOut)}</span>
              <span>{nights} đêm · {query.guests} khách · {query.rooms} phòng</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="whitespace-nowrap text-xs text-gray-500">Sắp xếp theo:</span>
            <Select
              value={query.sort}
              onValueChange={(value) => {
                if (typeof value === 'string') navigate({ sort: value, page: 1 });
              }}
            >
              <SelectTrigger className="h-9 w-[190px] bg-white text-xs font-medium shadow-xs">
                <SelectValue>{(value) => SORT_LABELS[String(value)] ?? SORT_LABELS.recommended}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Phù hợp nhất</SelectItem>
                <SelectItem value="price-asc">Giá: Thấp đến cao</SelectItem>
                <SelectItem value="price-desc">Giá: Cao đến thấp</SelectItem>
                <SelectItem value="star-desc">Hạng sao cao nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/*
          One filter bar, as Airbnb's: the filters suggested for this customer first, always the same and in the same
          place for this search, each turned on and off where it stands (why it is offered, and how many stays the
          search had with it, is in the tooltip); then any other filter applied from the sidebar, with ×.
        */}
        {(activeFilters.length > 0 || suggested.length > 0) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {suggested.length > 0 && <span className="mr-0.5 text-sm text-gray-500">Gợi ý cho bạn:</span>}
            {suggested.map((suggestion) => {
              const on = isApplied(suggestion);
              return (
                <button
                  key={`${suggestion.kind}-${suggestion.value}`}
                  type="button"
                  aria-pressed={on}
                  title={`${suggestion.reason} · ${suggestion.count} chỗ nghỉ`}
                  onClick={() => toggleSuggestion(suggestion)}
                  className={cn(
                    'inline-flex h-9 items-center gap-1 rounded-full border pr-3.5 pl-3 text-sm font-medium transition-colors',
                    on
                      ? 'border-[#1b4360] bg-[#EAF2F7] text-[#1b4360] hover:bg-[#dbe8f1]'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-[#1b4360] hover:text-[#1b4360]',
                  )}
                >
                  {updating && tapped === suggestionKey(suggestion) ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : on ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : (
                    <Plus className="size-3.5" aria-hidden />
                  )}
                  {suggestion.label}
                </button>
              );
            })}
            {otherFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => {
                  setTapped(filter.key);
                  filter.remove();
                }}
                aria-label={`Bỏ bộ lọc ${filter.label}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#1b4360] bg-[#EAF2F7] pr-2.5 pl-3.5 text-sm font-medium text-[#1b4360] transition-colors hover:bg-[#dbe8f1]"
              >
                {filter.label}
                <X className="size-3.5" aria-hidden />
              </button>
            ))}
            {activeFilters.length > 1 && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-sm text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline"
              >
                Xoá tất cả bộ lọc
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="order-2 space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-xs lg:order-1 lg:col-span-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Bộ lọc tìm kiếm</h2>
              <button onClick={clearFilters} className="text-xs font-semibold text-[#df7a42] hover:underline">Đặt lại</button>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Khoảng giá (mỗi đêm)</h3>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-medium">Từ</span>
                  <Input
                    type="number"
                    min={0}
                    step={100000}
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="0"
                    className="h-9 bg-white text-xs font-semibold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-medium">Đến</span>
                  <Input
                    type="number"
                    min={0}
                    step={100000}
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="Tối đa"
                    className="h-9 bg-white text-xs font-semibold"
                  />
                </label>
              </div>
              <button
                onClick={() => navigate({ priceMin: priceMin || undefined, priceMax: priceMax || undefined, page: 1 })}
                className="mt-2 w-full rounded-lg bg-[#1b4360] px-3 py-2 text-xs font-semibold text-white hover:bg-[#15344d]"
              >
                Áp dụng giá
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Phong cách</h3>
              <div className="space-y-2.5">
                {STYLES.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <Checkbox
                      checked={query.style === item.id}
                      onCheckedChange={() =>
                        navigate({ style: query.style === item.id ? undefined : item.id, page: 1 })
                      }
                    />
                    <span>{item.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Hạng sao</h3>
              <div className="space-y-2.5">
                {[5, 4, 3, 2, 1].map((star) => (
                  <label key={star} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <Checkbox
                      checked={(query.starRating ?? []).includes(star)}
                      onCheckedChange={() => toggleStar(star)}
                    />
                    <span>{star} sao</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Chính sách</h3>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <Checkbox
                  checked={query.freeCancellation === true}
                  onCheckedChange={() => navigate({ freeCancellation: !query.freeCancellation, page: 1 })}
                />
                <span>Miễn phí huỷ phòng</span>
              </label>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Tiện nghi</h3>
              {amenities.isLoading ? (
                <p className="text-xs text-gray-400">Đang tải…</p>
              ) : (
                <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
                  {(amenities.data ?? []).map((amenity) => (
                    <label key={amenity.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                      <Checkbox
                        checked={(query.amenityIds ?? []).includes(amenity.id)}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                      />
                      <span>{amenity.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section className="order-1 space-y-4 lg:order-2 lg:col-span-9">
            {error && (
              <Alert variant="destructive" className="bg-red-50 p-4">
                <AlertTitle>Không tải được danh sách chỗ nghỉ</AlertTitle>
                <AlertDescription className="mt-1 flex flex-col items-start gap-3">
                  <span>{getApiErrorMessage(error, 'Vui lòng thử lại sau.')}</span>
                  <Button size="sm" variant="outline" onClick={() => void refetch()}>
                    Thử lại
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="space-y-4">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-[210px] w-full rounded-xl" />
                ))}
              </div>
            )}

            {!isLoading && !error && hotels.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
                <p className="text-sm font-semibold text-gray-800">Không có chỗ nghỉ phù hợp</p>
                <p className="mt-1 text-xs text-gray-500">Thử đổi ngày, số khách hoặc bỏ bớt bộ lọc.</p>
                <button onClick={clearFilters} className="mt-3 rounded-lg bg-[#1b4360] px-4 py-2 text-xs font-semibold text-white hover:bg-[#15344d]">
                  Xóa bộ lọc
                </button>
              </div>
            )}

            {/*
              The old results stay, dimmed, while the new ones load; a new list fades in (keyed by its hotels) instead
              of swapping at once.
            */}
            <div
              key={hotels.map((hotel) => hotel.id).join()}
              aria-busy={updating}
              className={cn(
                'space-y-4 transition-opacity duration-200 animate-in fade-in',
                updating && 'pointer-events-none opacity-50',
              )}
            >
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                id={hotel.id}
                name={hotel.name}
                image={hotel.coverImageUrl ?? FALLBACK_IMAGE}
                starBadge={hotel.starRating ? `${hotel.starRating} sao` : 'Chỗ nghỉ'}
                verified
                location={`${hotel.address}, ${hotel.city}`}
                rating={hotel.rating ?? 0}
                reviewCount={hotel.reviewCount}
                tags={[hotel.freeCancellation ? 'Miễn phí huỷ' : 'Không hoàn huỷ']}
                cancellationPolicy={hotel.freeCancellation ? 'Miễn phí huỷ phòng' : 'Không hoàn huỷ'}
                price={formatMoney(hotel.fromTotal)}
                totalPrice={formatMoney(hotel.fromTotal)}
                nights={hotel.nights}
                priceNote={`${hotel.nights} đêm · ${query.rooms} phòng`}
                detailsHref={`/hotels/${hotel.id}?checkIn=${query.checkIn}&checkOut=${query.checkOut}&guests=${query.guests}&rooms=${query.rooms}`}
                layout="horizontal"
                badges={<StyleBadges styles={hotel.styles} chosen={chosenStyles} />}
              />
            ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="pt-6 pb-2">
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={(page) => navigate({ page })}
                />
              </div>
            )}

            <p className="text-center text-[11px] text-gray-400">
              Giá hiển thị là tổng cho {nights} đêm; khoảng giá lọc theo giá mỗi đêm.{' '}
              <Link href="/" className="underline">Về trang chủ</Link>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
          Đang tải trang tìm kiếm…
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
