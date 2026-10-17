import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { formatVnd, type Hotel } from '@/lib/mock-data';

export type HotelCardProps = { hotel: Hotel };

export function HotelCard({ hotel }: HotelCardProps) {
  const open = () => router.push(`/hotels/${hotel.id}`);
  return (
    <Pressable onPress={open} style={styles.card}>
      <View>
        <Image source={hotel.image} style={styles.image} contentFit="cover" transition={200} />
        <View style={styles.tag}>
          <Icon name={hotel.tagIcon} size={14} color={colors.onPrimary} />
          <Text variant="caption" weight="semibold" color={colors.onPrimary}>
            {hotel.tag}
          </Text>
        </View>
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
              {hotel.location}
            </Text>
          </View>
          <View style={styles.rating}>
            <Icon name="star" size={14} color={colors.secondary} />
            <Text variant="caption" weight="bold">
              {hotel.rating}
            </Text>
            <Text variant="caption" color={colors.outline}>
              ({hotel.reviews})
            </Text>
          </View>
        </View>
        <View style={styles.chips}>
          <Chip label={hotel.chips[0].label} tone="primary" />
          <Chip label={hotel.chips[1].label} tone="tertiary" />
        </View>
        <View style={styles.footer}>
          <View>
            <Text variant="price" color={colors.primary}>
              {formatVnd(hotel.price)}
              <Text variant="small" color={colors.onSurfaceVariant}>
                {' '}/ đêm
              </Text>
            </Text>
            <Text variant="caption" color={colors.outline}>
              Đã gồm thuế & phí
            </Text>
          </View>
          <Button label="Xem phòng" icon="arrow_forward" size="sm" onPress={open} />
        </View>
      </View>
    </Pressable>
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
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
});
