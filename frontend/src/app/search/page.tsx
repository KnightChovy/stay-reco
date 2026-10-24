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
import { useAmenities, useHotelSearch } from '@/features/stays/api/stays-queries';
import { formatDate, formatMoney } from '@/features/stays/lib/format';
import { buildSearchHref, nightsBetween, parseHotelSearchParams } from '@/features/stays/lib/params';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

const SORT_LABELS: Record<string, string> = {
  recommended: 'Phù hợp nhất',
  'price-asc': 'Giá: Thấp đến cao',
  'price-desc': 'Giá: Cao đến thấp',
  'star-desc': 'Hạng sao cao nhất',
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = parseHotelSearchParams(new URLSearchParams(searchParams.toString()));
  const { data, isLoading, isFetching, error, refetch } = useHotelSearch(query);
  const amenities = useAmenities();

  const [priceMin, setPriceMin] = useState(query.priceMin ? String(query.priceMin) : '');
  const [priceMax, setPriceMax] = useState(query.priceMax ? String(query.priceMax) : '');

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
      ...changes,
    };
    router.push(buildSearchHref(next));
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
  const activeFilters = [
    query.destination,
    ...(query.starRating ?? []).map((star) => `${star} sao`),
    ...(query.amenityIds ?? []).map((id) => amenities.data?.find((item) => item.id === id)?.name ?? 'Tiện nghi'),
    ...(query.freeCancellation ? ['Miễn phí huỷ'] : []),
    ...(query.priceMin ? [`Từ ${formatMoney(query.priceMin)}`] : []),
    ...(query.priceMax ? [`Đến ${formatMoney(query.priceMax)}`] : []),
  ];

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
                {isLoading ? 'Đang tìm…' : `Tìm thấy ${meta?.total ?? hotels.length} chỗ nghỉ còn phòng`}
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

        <div className="flex flex-wrap items-center gap-2 py-2 mb-6">
          <span className="text-xs text-gray-500 font-normal mr-1">Bộ lọc đang chọn:</span>
          {activeFilters.map((label) => (
            <span key={label} className="inline-flex items-center text-xs bg-[#EAF2F7] text-[#1b4360] font-medium px-2.5 py-1 rounded">
              {label}
            </span>
          ))}
          {activeFilters.length > 1 && (
            <button onClick={clearFilters} className="text-xs text-[#df7a42] hover:underline font-semibold ml-2">
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>

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
                reviewCount={0}
                tags={[hotel.freeCancellation ? 'Miễn phí huỷ' : 'Không hoàn huỷ']}
                cancellationPolicy={hotel.freeCancellation ? 'Miễn phí huỷ phòng' : 'Không hoàn huỷ'}
                price={formatMoney(hotel.fromTotal)}
                totalPrice={formatMoney(hotel.fromTotal)}
                priceNote={`${hotel.nights} đêm · ${query.rooms} phòng`}
                detailsHref={`/hotels/${hotel.id}?checkIn=${query.checkIn}&checkOut=${query.checkOut}&guests=${query.guests}&rooms=${query.rooms}`}
                layout="horizontal"
              />
            ))}

            {meta && meta.totalPages > 1 && (
              <div className="pt-6 pb-2">
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={(page) => navigate({ page })}
                />
              </div>
            )}

            {isFetching && !isLoading && (
              <p className="text-center text-[11px] text-gray-400">Đang cập nhật kết quả…</p>
            )}

            <p className="text-center text-[11px] text-gray-400">
              Giá hiển thị là tổng cho {nights} đêm. <Link href="/" className="underline">Về trang chủ</Link>
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
