import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { ReviewListQuery } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { usePagedList } from '@/lib/paged';
import { formatDate } from '@/lib/stay';
import { getHotelReviews, getRatingSummary } from '@/services/reviews.service';
import { ReportReview } from './ReportReview';
import { ReviewImages } from './ReviewImages';

const score = (n: number) => n.toFixed(1).replace('.', ',');

type Filter = { label: string; sort: ReviewListQuery['sort']; minRating?: number };
const filters: Filter[] = [
  { label: 'Mới nhất', sort: 'newest' },
  { label: 'Điểm cao', sort: 'rating-desc' },
  { label: 'Điểm thấp', sort: 'rating-asc' },
  { label: 'Từ 4 sao', sort: 'newest', minRating: 4 },
];

function Bar({ ratio }: { ratio: number }) {
  return (
    <View className="h-1.5 flex-1 rounded-full bg-surface-container-high">
      <View className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.round(ratio * 100)}%` }} />
    </View>
  );
}

/** Điểm trung bình, phân bố sao, điểm theo tiêu chí và danh sách đánh giá của khách sạn (chỉ đánh giá đang hiện). */
export function HotelReviews({ hotelId }: { hotelId: string }) {
  const summary = useQuery({ queryKey: ['reviews', hotelId, 'summary'], queryFn: () => getRatingSummary(hotelId) });
  const [filter, setFilter] = useState(filters[0]);
  const list = usePagedList(['reviews', hotelId, 'list', filter.label], (page) =>
    getHotelReviews(hotelId, {
      page,
      pageSize: 5,
      sort: filter.sort,
      ...(filter.minRating ? { minRating: filter.minRating } : {}),
    }).then((r) => ({ items: r.reviews, meta: r.meta })),
  );

  const s = summary.data;
  // Lỗi tải hoặc chưa có đánh giá: ẩn hẳn mục, trang khách sạn vẫn đặt phòng được.
  if (!s || s.count === 0) return null;

  return (
    <View className="mx-4 mt-5 gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
      <View className="flex-row items-center gap-3">
        <View className="h-14 w-14 items-center justify-center rounded-md bg-primary-container">
          <Text variant="h2" color={colors.white}>
            {score(s.average)}
          </Text>
        </View>
        <View className="flex-1">
          <Text variant="h3">Đánh giá của khách</Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            {s.count} đánh giá đã xác thực lưu trú
          </Text>
        </View>
      </View>

      {[...s.distribution]
        .sort((a, b) => b.star - a.star)
        .map((d) => (
          <View key={d.star} className="flex-row items-center gap-2">
            <Text variant="caption" color={colors.onSurfaceVariant} style={{ width: 36 }}>
              {d.star} sao
            </Text>
            <Bar ratio={d.count / s.count} />
            <Text variant="caption" color={colors.onSurfaceVariant} style={{ width: 32, textAlign: 'right' }}>
              {d.count}
            </Text>
          </View>
        ))}

      {s.criteria.map((c) => (
        <View key={c.criterionId} className="gap-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text variant="caption" color={colors.onSurfaceVariant} className="flex-1">
              {c.name}
            </Text>
            <Text variant="caption" weight="bold">
              {score(c.average)}
            </Text>
          </View>
          <Bar ratio={c.average / 5} />
        </View>
      ))}

      <View className="flex-row flex-wrap gap-2">
        {filters.map((f) => (
          <Chip key={f.label} label={f.label} tone={f === filter ? 'selected' : 'outline'} onPress={() => setFilter(f)} />
        ))}
      </View>

      {list.items?.length === 0 && (
        <Text variant="small" color={colors.onSurfaceVariant}>
          Không có đánh giá nào khớp bộ lọc.
        </Text>
      )}
      {list.items?.map((r) => (
        <View key={r.id} className="gap-1 border-t border-surface-container-high pt-3">
          <View className="flex-row items-center justify-between gap-2">
            <Text variant="small" weight="bold" className="flex-1">
              {r.authorName}
            </Text>
            <View className="flex-row items-center gap-1">
              <Icon name="star" size={14} color={colors.secondaryContainer} />
              <Text variant="caption" weight="bold">
                {score(r.overallRating)}
              </Text>
            </View>
          </View>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Trả phòng {formatDate(r.stayedAt)}
          </Text>
          {!!r.title && (
            <Text variant="small" weight="semibold">
              {r.title}
            </Text>
          )}
          <Text variant="small" color={colors.onSurfaceVariant}>
            {r.content}
          </Text>
          <ReviewImages images={r.images} />
          <ReportReview reviewId={r.id} />
        </View>
      ))}
      {list.hasMore && (
        <Button
          label={list.loadingMore ? 'Đang tải...' : 'Xem thêm đánh giá'}
          variant="ghost"
          size="sm"
          disabled={list.loadingMore}
          onPress={list.loadMore}
        />
      )}
    </View>
  );
}
