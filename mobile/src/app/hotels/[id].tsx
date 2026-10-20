import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { formatVnd, hotels, images } from '@/lib/mock-data';

const gallery = [images.detail1, images.detail2, images.detail3];

const reasons: { title: string; desc: string; icon: IconName }[] = [
  { title: 'Kính cách âm 2 lớp chống ồn 95%', desc: 'Ngủ sâu bên phố đi bộ Bạch Đằng sôi động', icon: 'volume_off' },
  { title: 'Ban công trực diện ngắm Cầu Rồng', desc: 'Thưởng ngoạn màn phun lửa & nước cuối tuần', icon: 'balcony' },
  { title: 'Bữa sáng hữu cơ Farm-to-Table', desc: 'Nông sản sạch từ nông trại sinh thái Hội An', icon: 'eco' },
];

const amenities: { label: string; icon: IconName }[] = [
  { label: 'Wifi tốc độ cao', icon: 'wifi' },
  { label: 'Hồ bơi vô cực', icon: 'pool' },
  { label: 'Trà chiều', icon: 'local_cafe' },
  { label: 'Xe đạp miễn phí', icon: 'pedal_bike' },
];

const scores = [
  { label: 'Vị trí', value: '4.9 / 5' },
  { label: 'Yên tĩnh', value: '4.8 / 5' },
  { label: 'Sạch sẽ', value: '4.9 / 5' },
];

function Meta({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Icon name={icon} size={16} color={colors.onSurfaceVariant} />
      <Text variant="small" color={colors.onSurfaceVariant}>
        {label}
      </Text>
    </View>
  );
}

export default function HotelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const hotel = hotels.find((h) => h.id === id) ?? hotels[0];
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const book = () => router.push({ pathname: '/booking', params: { hotelId: hotel.id } });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Chi Tiết Nơi Lưu Trú"
        right={
          <>
            <Pressable accessibilityLabel="Chia sẻ" style={styles.iconBtn}>
              <Icon name="share" color={colors.onSurface} />
            </Pressable>
            <View style={styles.avatar}>
              <Icon name="person" size={20} color={colors.onPrimary} />
            </View>
          </>
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {gallery.map((uri) => (
              <Image key={uri} source={uri} style={{ width, height: 280 }} contentFit="cover" />
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {gallery.map((uri, i) => (
              <View key={uri} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.photoCount}>
            <Icon name="photo_library" size={14} color={colors.white} />
            <Text variant="caption" weight="medium" color={colors.white}>
              {page + 1}/18 ảnh
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.between}>
            <Chip label={hotel.category} icon="hotel_class" tone="secondary" />
            <Pressable accessibilityLabel="Yêu thích" style={styles.favBtn}>
              <Icon name="favorite" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
          <Text variant="h1">{hotel.name}</Text>
          <View style={styles.row}>
            <View style={styles.score}>
              <Icon name="star" size={12} color={colors.white} />
              <Text variant="caption" weight="bold" color={colors.white}>
                {hotel.rating}
              </Text>
            </View>
            <Text variant="small" weight="semibold">
              Tuyệt vời
            </Text>
            <Text variant="small" color={colors.onSurfaceVariant}>
              • {hotel.reviews} đánh giá xác thực
            </Text>
          </View>
          <View style={styles.row}>
            <Icon name="location_on" size={16} color={colors.secondary} />
            <Text variant="small" color={colors.onSurfaceVariant} style={styles.flex}>
              128 Bạch Đằng, Quận Hải Châu, Đà Nẵng{' '}
              <Text variant="small" weight="semibold" color={colors.primary} style={styles.underline}>
                Xem bản đồ
              </Text>
            </Text>
          </View>
        </View>

        <View style={[styles.section, styles.panel]}>
          <View style={styles.row}>
            <Icon name="auto_awesome" size={18} color={colors.primaryContainer} />
            <Text variant="label" weight="bold" color={colors.primaryContainer}>
              VÌ SAO KHÁCH SẠN NÀY PHÙ HỢP VỚI BẠN
            </Text>
          </View>
          {reasons.map((r) => (
            <View key={r.title} style={styles.reason}>
              <View style={styles.reasonIcon}>
                <Icon name={r.icon} size={18} color={colors.secondary} />
              </View>
              <View style={styles.flex}>
                <Text variant="small" weight="semibold">
                  {r.title}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {r.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.section, styles.panel, styles.dateRow]}>
          <Icon name="calendar_month" size={22} color={colors.primaryContainer} />
          <View style={styles.flex}>
            <Text variant="label" weight="bold">
              20/10/2026 – 22/10/2026
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              2 đêm • 2 khách
            </Text>
          </View>
          <Button label="Đổi ngày" variant="secondary" size="sm" />
        </View>

        <View style={styles.section}>
          <Text variant="h3">Tiện ích nổi bật</Text>
          <View style={styles.amenities}>
            {amenities.map((a) => (
              <View key={a.label} style={styles.amenity}>
                <Icon name={a.icon} size={22} color={colors.primary} />
                <Text variant="caption" center>
                  {a.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.between}>
            <Text variant="h3">Hạng phòng khả dụng</Text>
            <Text variant="small" color={colors.onSurfaceVariant}>
              2 lựa chọn
            </Text>
          </View>

          <View style={styles.room}>
            <Image source={images.roomDeluxe} style={styles.roomImage} contentFit="cover" />
            <View style={styles.roomBadge}>
              <Text variant="caption" weight="semibold" color={colors.white}>
                Được chọn nhiều nhất
              </Text>
            </View>
            <View style={styles.roomBody}>
              <Text variant="h3">Phòng Deluxe River View</Text>
              <View style={styles.metaWrap}>
                <Meta icon="square_foot" label="28 m²" />
                <Meta icon="king_bed" label="1 giường King" />
                <Meta icon="water" label="View sông Hàn" />
                <Meta icon="bathtub" label="Bồn tắm đá" />
              </View>
              <View style={[styles.plan, styles.planActive]}>
                <View style={styles.between}>
                  <View style={styles.flex}>
                    <Text variant="small" weight="bold">
                      Gói linh hoạt
                    </Text>
                    <Meta icon="restaurant" label="Đã bao gồm buffet sáng hữu cơ" />
                    <Text variant="caption" color={colors.onSurfaceVariant}>
                      Miễn phí hủy phòng trước 18/10
                    </Text>
                  </View>
                  <View style={styles.alignEnd}>
                    <Text variant="label" weight="bold">
                      {formatVnd(hotel.price)}
                    </Text>
                    <Text variant="caption" color={colors.onSurfaceVariant}>
                      / đêm
                    </Text>
                  </View>
                </View>
                <Button label="Chọn gói này" icon="chevron_right" onPress={book} />
              </View>
              <View style={[styles.plan, styles.between]}>
                <View style={styles.flex}>
                  <Text variant="small" weight="bold">
                    Gói tiết kiệm
                  </Text>
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    Phòng tiêu chuẩn không hoàn tiền
                  </Text>
                </View>
                <View style={styles.alignEnd}>
                  <Text variant="label" weight="bold">
                    {formatVnd(Math.round(hotel.price * 0.9))}
                  </Text>
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    / đêm
                  </Text>
                </View>
                <Button label="Chọn" variant="muted" size="sm" onPress={book} />
              </View>
            </View>
          </View>

          <View style={styles.room}>
            <Image source={images.roomSuperior} style={styles.roomImage} contentFit="cover" />
            <View style={styles.roomBody}>
              <View style={styles.between}>
                <View style={styles.flex}>
                  <Text variant="h3">Phòng Superior Garden View</Text>
                  <Text variant="small" color={colors.onSurfaceVariant}>
                    25 m² • 1 giường Queen • Cửa sổ vườn xanh
                  </Text>
                </View>
                <View style={styles.alignEnd}>
                  <Text variant="label" weight="bold">
                    980.000 ₫
                  </Text>
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    / đêm
                  </Text>
                </View>
              </View>
              <Button label="Chọn phòng này" variant="muted" onPress={book} />
            </View>
          </View>
        </View>

        <View style={[styles.section, styles.panel]}>
          <View style={styles.between}>
            <View style={styles.flex}>
              <Text variant="h3">Đánh giá thực tế</Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Điểm hài lòng dựa trên {hotel.reviews} khách lưu trú
              </Text>
            </View>
            <Text variant="h2" color={colors.primary}>
              {hotel.rating}
              <Text variant="small" color={colors.onSurfaceVariant}>
                {' '}/ 5.0
              </Text>
            </Text>
          </View>
          <View style={styles.row}>
            {scores.map((s) => (
              <View key={s.label} style={styles.scoreBox}>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {s.label}
                </Text>
                <Text variant="small" weight="bold">
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.review}>
            <View style={styles.between}>
              <Text variant="small" weight="bold">
                Hoàng Minh T.
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Tháng 09/2026
              </Text>
            </View>
            <Text variant="small" color={colors.onSurfaceVariant}>
              &quot;Phòng cách âm xuất sắc đúng như mô tả. Tối ra ban công ngắm trọn vẹn Cầu Rồng mà trong phòng vẫn cực
              kỳ tĩnh lặng. Bữa sáng tươi ngon, nhân viên chu đáo vô cùng.&quot;
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.flex}>
          <Text variant="h3" weight="bold" color={colors.primary}>
            {formatVnd(hotel.price)}
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant} numberOfLines={1}>
            / đêm · Tổng {formatVnd(hotel.price * 2)}
          </Text>
        </View>
        <Button label="Chọn phòng & Đặt ngay" icon="arrow_forward" size="sm" style={styles.cta} onPress={book} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: 32 },
  flex: { flex: 1 },
  alignEnd: { alignItems: 'flex-end' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  underline: { textDecorationLine: 'underline' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  dots: { position: 'absolute', bottom: 14, left: 16, flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotActive: { backgroundColor: colors.white, width: 8, height: 8, borderRadius: 4, marginTop: -1 },
  photoCount: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  section: { marginHorizontal: 16, marginTop: 20, gap: 10 },
  favBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryContainer,
  },
  panel: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLow },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
  },
  reasonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryFixed,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amenities: { flexDirection: 'row', gap: 8 },
  amenity: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  room: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  roomImage: { width: '100%', height: 180 },
  roomBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryContainer,
  },
  roomBody: { padding: 16, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaWrap: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6 },
  plan: { padding: 12, gap: 10, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  planActive: { borderWidth: 1, borderColor: colors.primaryFixed },
  scoreBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
  },
  review: { padding: 14, gap: 6, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLowest },
  cta: { minHeight: 48 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    ...shadow.floating,
  },
});
