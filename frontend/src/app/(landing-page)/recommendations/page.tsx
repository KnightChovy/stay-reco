'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Info, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import type { RecommendationQuery } from '@stayreco/shared';
import { STYLES } from '@/features/account/lib/preference-options';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import { EmptyState, ErrorState } from '@/components/common/StateViews';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useRecommendations } from '@/features/recommendations/api/recommendation-queries';
import {
  RecommendedHotelCard,
  RecommendedHotelSkeleton,
} from '@/features/recommendations/components/RecommendedHotelCard';
import { RecommendationProfileCard } from '@/features/recommendations/components/RecommendationProfileCard';

const LIMIT = 20;

export default function RecommendationsPage() {
  const user = useAuthStore((state) => state.user);
  const isCustomer = user?.role === 'customer';
  const [city, setCity] = useState<string | null>(null);
  const [style, setStyle] = useState<RecommendationQuery['style'] | null>(null);

  // The cities come from the whole list, so the filter keeps its choices while one city is shown.
  const all = useRecommendations({ limit: LIMIT });
  const filtered = useRecommendations({ limit: LIMIT, city: city ?? undefined, style: style ?? undefined });
  const query = city || style ? filtered : all;
  const cities = useMemo(
    () => [...new Set((all.data?.items ?? []).map((hotel) => hotel.city))],
    [all.data],
  );
  const items = query.data?.items ?? [];
  const personalized = !!query.data?.personalized;
  const fromPreferences = query.data?.source === 'PREFERENCES';
  const chosenStyles = all.data?.profile?.preferences.travelStyles ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
      <Header />

      <main className="w-full flex-1 bg-muted/30 py-6 lg:py-10">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Gợi ý cho bạn', active: true },
            ]}
          />

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" aria-hidden /> {personalized ? 'Dành riêng cho bạn' : 'Được khách yêu thích'}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {personalized ? 'Gợi ý chốn nghỉ hợp gu của bạn' : 'Chốn nghỉ được gợi ý'}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {fromPreferences
                  ? 'Chọn riêng cho bạn theo những gì bạn vừa chọn: phong cách, điểm đến, tiện nghi và ngân sách.'
                  : personalized
                  ? 'Chọn riêng cho bạn theo những chuyến đi, đánh giá và sở thích của bạn.'
                  : 'Những nơi được nhiều khách StayReco đánh giá cao.'}
              </p>
            </div>

            {isCustomer ? (
              <Link
                href="/account/preferences"
                className={cn(buttonVariants({ variant: 'outline' }), 'h-10 shrink-0 gap-2 px-4')}
              >
                <SlidersHorizontal className="size-4 text-primary" aria-hidden /> Sở thích du lịch
              </Link>
            ) : !user ? (
              <Link
                href="/login?next=/recommendations"
                className={cn(buttonVariants({ variant: 'outline' }), 'h-10 shrink-0 px-4')}
              >
                Đăng nhập để nhận gợi ý riêng
              </Link>
            ) : null}
          </div>

          {isCustomer && fromPreferences && items.length > 0 && (
            <p className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                Danh sách này dựa trên những gì bạn vừa chọn và sẽ được cập nhật thêm sau vài giây.{' '}
                <Link href="/account/preferences" className="font-semibold text-primary hover:underline">
                  Sửa sở thích
                </Link>
              </span>
            </p>
          )}

          {isCustomer && query.data && !personalized && items.length > 0 && (
            <p className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                Danh sách riêng của bạn sẽ có sau lần cập nhật gợi ý tới. Trong lúc chờ, đây là những nơi được nhiều khách
                yêu thích.{' '}
                <Link href="/account/preferences" className="font-semibold text-primary hover:underline">
                  Chọn sở thích
                </Link>{' '}
                để gợi ý hợp gu hơn.
              </span>
            </p>
          )}

          {isCustomer && all.data?.profile && (
            <RecommendationProfileCard
              profile={all.data.profile}
              source={all.data.source}
              onShowStyle={(id) => {
                setStyle(id);
                setCity(null);
              }}
            />
          )}

          {style && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Đang xem:</span>
              <button
                type="button"
                onClick={() => setStyle(null)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-4 font-semibold text-primary hover:bg-primary/15"
              >
                Chỉ phong cách {STYLES.find((s) => s.id === style)?.title ?? style}
                <X className="size-4" aria-hidden />
                <span className="sr-only">Bỏ lọc phong cách</span>
              </button>
            </div>
          )}

          {cities.length > 1 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Lọc theo điểm đến">
              {[null, ...cities].map((item) => {
                const active = city === item;
                return (
                  <button
                    key={item ?? 'all'}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCity(item)}
                    className={cn(
                      'min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {item ?? 'Tất cả điểm đến'}
                  </button>
                );
              })}
            </div>
          )}

          {query.isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <RecommendedHotelSkeleton key={item} />
              ))}
            </div>
          ) : query.error ? (
            <ErrorState title="Không tải được gợi ý" error={query.error} onRetry={() => void query.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title={city ? `Chưa có gợi ý ở ${city}` : 'Chưa có gợi ý nào'}
              description={
                city
                  ? 'Thử điểm đến khác hoặc tìm phòng theo ngày bạn đi.'
                  : 'Gợi ý sẽ sớm có. Trong lúc chờ, bạn có thể tìm phòng theo điểm đến và ngày đi.'
              }
              action={
                <Link href="/search" className={cn(buttonVariants(), 'h-10 px-5')}>
                  Tìm phòng
                </Link>
              }
            />
          ) : (
            <div
              className={cn(
                'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4',
                query.isFetching && 'opacity-60 transition-opacity',
              )}
            >
              {items.map((hotel) => (
                <RecommendedHotelCard chosenStyles={chosenStyles} key={hotel.id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
