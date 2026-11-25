import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FadeInDown } from 'react-native-reanimated';
import type { HotelSearchResult } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import { images } from '@/lib/mock-data';
import { formatVnd, type Stay } from '@/lib/stay';

export type HotelCardProps = {
  hotel: HotelSearchResult;
  stay: Stay;
  /** Vị trí trong danh sách, dùng để xuất hiện lần lượt. */
  index?: number;
};

export function HotelCard({ hotel, stay, index = 0 }: HotelCardProps) {
  const open = () => router.push({ pathname: '/hotels/[id]', params: { ...stay, id: hotel.id } });
  return (
    <PressableScale
      onPress={open}
      scaleTo={0.98}
      entering={FadeInDown.delay(index * 90).springify().damping(18)}
      className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-card"
    >
      <View>
        <Image source={hotel.coverImageUrl ?? images.anNhien} className="w-full aspect-[40/34]" contentFit="cover" transition={200} />
        {hotel.starRating != null && (
          <View className="absolute left-3 top-3 flex-row items-center gap-1 rounded-full bg-[rgba(1,55,88,0.85)] px-2.5 py-1">
            <Icon name="hotel_class" size={14} color={colors.onPrimary} />
            <Text variant="caption" weight="semibold" color={colors.onPrimary}>
              {hotel.starRating} sao
            </Text>
          </View>
        )}
        <Pressable accessibilityLabel="Yêu thích" className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-white/90">
          <Icon name="favorite" size={20} color={colors.primary} />
        </Pressable>
      </View>
      <View className="gap-3 p-4">
        <View className="flex-row gap-2">
          <View className="flex-1 gap-0.5">
            <Text variant="h3" weight="bold">
              {hotel.name}
            </Text>
            <Text variant="small" color={colors.onSurfaceVariant}>
              {hotel.address}, {hotel.city}
            </Text>
          </View>
          {hotel.rating != null && (
            <View className="flex-row items-center self-start gap-[3px] rounded-full bg-surface-container-low px-2 py-1">
              <Icon name="star" size={14} color={colors.secondary} />
              <Text variant="caption" weight="bold">
                {hotel.rating}
              </Text>
            </View>
          )}
        </View>
        {hotel.freeCancellation && (
          <View className="flex-row flex-wrap gap-2">
            <Chip label="Miễn phí hủy phòng" tone="tertiary" />
          </View>
        )}
        <View className="flex-row items-end justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text variant="price" color={colors.primary}>
              {formatVnd(hotel.fromTotal / hotel.nights)}
              <Text variant="small" color={colors.onSurfaceVariant}>
                {' '}/ đêm
              </Text>
            </Text>
            <Text variant="caption" color={colors.outline}>
              Tổng {hotel.nights} đêm: {formatVnd(hotel.fromTotal)} (đã gồm thuế & phí)
            </Text>
          </View>
          <Button label="Xem phòng" icon="arrow_forward" size="sm" onPress={open} />
        </View>
      </View>
    </PressableScale>
  );
}

/** Giữ chỗ cùng bố cục với HotelCard trong lúc chờ kết quả tìm kiếm. */
export function HotelCardSkeleton() {
  return (
    <View className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-card">
      <View className="w-full aspect-[40/34]">
        <Skeleton height="100%" radius={0} />
      </View>
      <View className="gap-3 p-4">
        <View className="flex-1 gap-0.5">
          <Skeleton width="70%" height={20} />
          <Skeleton width="85%" style={{ marginTop: 6 }} />
        </View>
        <View className="flex-row items-end justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Skeleton width="55%" height={22} />
            <Skeleton width="80%" height={12} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={110} height={40} radius={radius.md} />
        </View>
      </View>
    </View>
  );
}
