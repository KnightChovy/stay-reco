import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { usePagedList } from '@/lib/paged';
import { formatDate } from '@/lib/stay';
import { ReviewImages } from '@/features/reviews/ReviewImages';
import { getMyReviews } from '@/services/reviews.service';

export default function MyReviewsScreen() {
  const list = usePagedList(['reviews', 'mine', 'list'], (page) =>
    getMyReviews({ page, pageSize: 10 }).then((r) => ({ items: r.reviews, meta: r.meta })),
  );

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Đánh Giá Của Tôi" />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" showsVerticalScrollIndicator={false}>
        {list.isError ? (
          <View className="items-center gap-3 py-6">
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Không tải được đánh giá. Vui lòng kiểm tra kết nối.
            </Text>
            <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={list.refetch} />
          </View>
        ) : !list.items ? (
          <Text variant="small" color={colors.onSurfaceVariant} center>
            Đang tải...
          </Text>
        ) : list.items.length === 0 ? (
          <Text variant="small" color={colors.onSurfaceVariant} center>
            Bạn chưa viết đánh giá nào. Sau khi trả phòng, vào Chuyến đi để đánh giá.
          </Text>
        ) : (
          list.items.map((r) => (
            <View key={r.id} className="gap-2 rounded-lg bg-surface-container-lowest p-4 shadow-card">
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-1">
                  <Icon name="star" size={16} color={colors.secondaryContainer} />
                  <Text variant="label" weight="bold">
                    {r.overallRating.toFixed(1).replace('.', ',')}
                  </Text>
                </View>
                {!r.isVisible && <Chip label="Khách sạn đã ẩn" tone="neutral" />}
              </View>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Trả phòng {formatDate(r.stayedAt)}
              </Text>
              {!!r.title && (
                <Text variant="small" weight="semibold">
                  {r.title}
                </Text>
              )}
              <Text variant="small" color={colors.onSurfaceVariant} numberOfLines={4}>
                {r.content}
              </Text>
              <ReviewImages images={r.images} />
              <Button
                label="Sửa đánh giá"
                leadingIcon="edit"
                variant="ghost"
                size="sm"
                onPress={() => router.push({ pathname: '/booking/review', params: { id: r.bookingId, reviewId: r.id } })}
              />
            </View>
          ))
        )}
        {list.hasMore && (
          <Button label={list.loadingMore ? 'Đang tải...' : 'Xem thêm'} variant="secondary" disabled={list.loadingMore} onPress={list.loadMore} />
        )}
      </ScrollView>
    </View>
  );
}
