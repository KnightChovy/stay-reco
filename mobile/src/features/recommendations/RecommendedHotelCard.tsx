import { View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { RecommendedHotel } from '@stayreco/shared';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { images } from '@/lib/mock-data';
import { defaultStay, formatVnd } from '@/lib/stay';

/** Một khách sạn mô hình gợi ý: lý do chọn, nhãn "Mới" (chưa có đánh giá), giá cơ bản mỗi đêm. */
export function RecommendedHotelCard({ hotel }: { hotel: RecommendedHotel }) {
  const open = () => router.push({ pathname: '/hotels/[id]', params: { ...defaultStay(), destination: hotel.city, id: hotel.id } });
  return (
    <PressableScale onPress={open} scaleTo={0.98} accessibilityLabel={`Xem ${hotel.name}`} className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-card">
      <View className="h-40 bg-surface-container">
        <Image source={hotel.coverImageUrl ?? images.anNhien} className="absolute inset-0" contentFit="cover" transition={200} />
        <View className="absolute left-3 top-3 flex-row gap-1.5">
          {hotel.isNew && <Chip label="Mới" tone="tertiary" />}
          {hotel.starRating != null && <Chip label={`${hotel.starRating} sao`} tone="neutral" />}
        </View>
      </View>
      <View className="gap-1.5 p-3.5">
        <View className="flex-row items-start gap-2">
          <View className="flex-1">
            <Text variant="label" weight="bold" numberOfLines={2}>
              {hotel.name}
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant} numberOfLines={1}>
              {hotel.address}, {hotel.city}
            </Text>
          </View>
          {hotel.rating != null && (
            <View className="flex-row items-center gap-[3px] rounded-full bg-surface-container-low px-2 py-1">
              <Icon name="star" size={14} color={colors.secondary} />
              <Text variant="caption" weight="bold">
                {hotel.rating.toFixed(1)} ({hotel.reviewCount})
              </Text>
            </View>
          )}
        </View>
        {!!hotel.reason && (
          <View className="flex-row gap-1.5">
            <Icon name="auto_awesome" size={14} color={colors.secondary} />
            <Text variant="caption" color={colors.secondary} className="flex-1">
              {hotel.reason}
            </Text>
          </View>
        )}
        <Text variant="label" weight="bold" color={colors.primary}>
          {hotel.pricePerNightFrom != null ? `Từ ${formatVnd(hotel.pricePerNightFrom)} / đêm` : 'Xem giá theo ngày'}
        </Text>
      </View>
    </PressableScale>
  );
}
