import { Pressable, StyleSheet, View } from 'react-native';
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
import { colors, radius, shadow } from '@/constants/theme';
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
      style={styles.card}
    >
      <View>
        <Image source={hotel.coverImageUrl ?? images.anNhien} style={styles.image} contentFit="cover" transition={200} />
        {hotel.starRating != null && (
          <View style={styles.tag}>
            <Icon name="hotel_class" size={14} color={colors.onPrimary} />
            <Text variant="caption" weight="semibold" color={colors.onPrimary}>
              {hotel.starRating} sao
            </Text>
          </View>
        )}
        <Pressable accessibilityLabel="Yêu thích" style={styles.fav}>
          <Icon name="favorite" size={20} color={colors.primary} />
        </Pressable>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text variant="h3" weight="bold">
              {hotel.name}
            </Text>
            <Text variant="small" color={colors.onSurfaceVariant}>
              {hotel.address}, {hotel.city}
            </Text>
          </View>
          {hotel.rating != null && (
            <View style={styles.rating}>
              <Icon name="star" size={14} color={colors.secondary} />
              <Text variant="caption" weight="bold">
                {hotel.rating}
              </Text>
            </View>
          )}
        </View>
        {hotel.freeCancellation && (
          <View style={styles.chips}>
            <Chip label="Miễn phí hủy phòng" tone="tertiary" />
          </View>
        )}
        <View style={styles.footer}>
          <View style={styles.flex}>
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
    <View style={styles.card}>
      <View style={styles.image}>
        <Skeleton height="100%" radius={0} />
      </View>
      <View style={styles.body}>
        <View style={styles.flex}>
          <Skeleton width="70%" height={20} />
          <Skeleton width="85%" style={styles.skeletonGap} />
        </View>
        <View style={styles.footer}>
          <View style={styles.flex}>
            <Skeleton width="55%" height={22} />
            <Skeleton width="80%" height={12} style={styles.skeletonGap} />
          </View>
          <Skeleton width={110} height={40} radius={radius.md} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    overflow: 'hidden',
    ...shadow.card,
  },
  image: { width: '100%', aspectRatio: 4 / 3.4 },
  skeletonGap: { marginTop: 6 },
  tag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(1,55,88,0.85)',
  },
  fav: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  body: { padding: 16, gap: 12 },
  titleRow: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1, gap: 2 },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
});
