import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { formatVnd, hotels, type Hotel } from '@/lib/mock-data';

const quickFilters: { label: string; icon: IconName }[] = [
  { label: 'Giá tốt', icon: 'verified' },
  { label: 'Gần biển', icon: 'beach_access' },
  { label: 'Bao gồm bữa sáng', icon: 'free_breakfast' },
  { label: 'Hủy miễn phí', icon: 'event_available' },
];

const filterGroups: { title: string; options: { label: string; icon?: IconName }[] }[] = [
  { title: 'Hạng sao & Phong cách', options: [{ label: '3 sao' }, { label: '4 sao' }, { label: '5 sao' }, { label: 'Villa' }] },
  {
    title: 'Gu trải nghiệm lưu trú',
    options: [
      { label: 'Yên tĩnh & Chữa lành', icon: 'self_improvement' },
      { label: 'Sát biển ngắm bình minh', icon: 'waves' },
      { label: 'Kiến trúc bản địa', icon: 'palette' },
      { label: 'Khuôn viên cà phê boutique', icon: 'local_cafe' },
    ],
  },
  {
    title: 'Tiện ích ưu tiên',
    options: [
      { label: 'Bao gồm bữa sáng địa phương', icon: 'free_breakfast' },
      { label: 'Hồ bơi riêng hoặc ngoài trời', icon: 'pool' },
      { label: 'Đưa đón sân bay Đà Nẵng', icon: 'airport_shuttle' },
    ],
  },
];

function ResultCard({ hotel }: { hotel: Hotel }) {
  const open = () => router.push(`/hotels/${hotel.id}`);
  return (
    <Pressable onPress={open} style={styles.card}>
      <View>
        <Image source={hotel.searchImage} style={styles.image} contentFit="cover" transition={200} />
        <View style={[styles.overlayPill, styles.topLeft]}>
          <Icon name="hotel_class" size={14} color={colors.secondary} />
          <Text variant="caption" weight="semibold" color={colors.secondary}>
            {hotel.category}
          </Text>
        </View>
        <Pressable accessibilityLabel="Yêu thích" style={styles.fav}>
          <Icon name="favorite" size={20} color={colors.secondary} />
        </Pressable>
        <View style={[styles.overlayPill, styles.bottomLeft, styles.darkPill]}>
          <Icon name={hotel.highlightIcon} size={14} color={colors.white} />
          <Text variant="caption" weight="medium" color={colors.white}>
            {hotel.highlight}
          </Text>
        </View>
        <View style={[styles.overlayPill, styles.bottomRight]}>
          <Text variant="caption" weight="bold" color={colors.secondary}>
            {hotel.rating}
          </Text>
          <Text variant="caption" color={colors.outline}>
            /5 ({hotel.reviews})
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <View>
          <Text variant="h3" weight="bold">
            {hotel.name}
          </Text>
          <View style={styles.row}>
            <Icon name="pin_drop" size={14} color={colors.outline} />
            <Text variant="small" color={colors.onSurfaceVariant}>
              {hotel.searchLocation}
            </Text>
          </View>
        </View>
        <View style={styles.chips}>
          <Chip label={hotel.chips[0].label} icon="spa" tone="primary" />
          <Chip label={hotel.chips[1].label} tone="neutral" />
        </View>
        <View>
          <Text variant="small">Hạng phòng: {hotel.roomType}</Text>
          <View style={styles.row}>
            <Icon name={hotel.perkIcon} size={14} color={colors.tertiaryContainer} />
            <Text variant="small" color={colors.tertiaryContainer}>
              {hotel.perk}
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <View style={styles.flex}>
            <Text variant="price" color={colors.primary}>
              {formatVnd(hotel.price)}
              <Text variant="small" color={colors.onSurfaceVariant}>
                {' '}/ đêm
              </Text>
            </Text>
            <Text variant="caption" color={colors.outline}>
              Tổng 2 đêm: {formatVnd(hotel.price * 2)} (đã gồm thuế, phí)
            </Text>
          </View>
          <Button label="Xem phòng" icon="arrow_forward" size="sm" onPress={open} />
        </View>
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const [filterOpen, setFilterOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <AppHeader />
      <View style={styles.summary}>
        <View style={styles.pinIcon}>
          <Icon name="location_on" size={20} color={colors.primaryContainer} />
        </View>
        <View style={styles.flex}>
          <Text variant="label" weight="bold">
            Đà Nẵng · 20/10 - 22/10
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            2 đêm · 2 người lớn · 1 phòng
          </Text>
        </View>
        <Button label="Sửa" leadingIcon="tune" variant="secondary" size="sm" onPress={() => router.back()} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar} style={styles.toolbarWrap}>
        <Pressable onPress={() => setFilterOpen(true)} style={styles.filterBtn}>
          <Icon name="filter_list" size={18} color={colors.onPrimary} />
          <Text variant="label" weight="semibold" color={colors.onPrimary}>
            Bộ lọc
          </Text>
          <View style={styles.badge}>
            <Text variant="caption" weight="bold" color={colors.white}>
              4
            </Text>
          </View>
        </Pressable>
        <Chip label="Sắp xếp: Phù hợp" icon="keyboard_arrow_down" tone="outline" onPress={() => {}} />
        {quickFilters.map((f, i) => (
          <Chip key={f.label} label={f.label} icon={f.icon} tone={i === 0 ? 'secondary' : 'outline'} onPress={() => {}} />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHead}>
          <Text variant="label" weight="bold">
            48 chỗ nghỉ phù hợp · <Text variant="label" color={colors.onSurfaceVariant}>Đà Nẵng</Text>
          </Text>
          <View style={styles.row}>
            <Icon name="bolt" size={14} color={colors.tertiaryContainer} />
            <Text variant="caption" color={colors.tertiaryContainer}>
              Đã xác thực
            </Text>
          </View>
        </View>
        {hotels.map((h, i) => (
          <Animated.View key={h.id} entering={FadeInDown.delay(i * 90).springify().damping(18)}>
            <ResultCard hotel={h} />
          </Animated.View>
        ))}
      </ScrollView>

      <Pressable style={[styles.mapBtn, { bottom: Math.max(insets.bottom, 12) + 84 }]}>
        <Icon name="map" size={18} color={colors.white} />
        <Text variant="label" weight="semibold" color={colors.white}>
          Xem bản đồ Đà Nẵng
        </Text>
      </Pressable>

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setFilterOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHead}>
            <View style={styles.flex}>
              <Text variant="h2">Bộ lọc tìm kiếm</Text>
              <Text variant="small" color={colors.onSurfaceVariant}>
                Tùy chỉnh theo phong cách nghỉ dưỡng của bạn
              </Text>
            </View>
            <Pressable accessibilityLabel="Đóng" onPress={() => setFilterOpen(false)} style={styles.close}>
              <Icon name="close" color={colors.onSurface} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            <View style={styles.group}>
              <Text variant="label" weight="bold">
                Khoảng giá / đêm
              </Text>
              <Text variant="h3" color={colors.primaryContainer}>
                700.000 ₫ – 3.000.000 ₫
              </Text>
              <View style={styles.track}>
                <View style={styles.trackFill} />
              </View>
              <View style={styles.between}>
                <Text variant="caption" color={colors.outline}>
                  500.000 ₫
                </Text>
                <Text variant="caption" color={colors.outline}>
                  10.000.000 ₫+
                </Text>
              </View>
            </View>
            {filterGroups.map((g) => (
              <View key={g.title} style={styles.group}>
                <Text variant="label" weight="bold">
                  {g.title}
                </Text>
                <View style={styles.chips}>
                  {g.options.map((o, i) => (
                    <Chip key={o.label} label={o.label} icon={o.icon} tone={i === 1 ? 'selected' : 'outline'} onPress={() => {}} />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.sheetActions}>
            <Button label="Thiết lập lại" variant="secondary" style={styles.flex} onPress={() => setFilterOpen(false)} />
            <Button label="Áp dụng (48 chỗ nghỉ)" style={styles.flex2} onPress={() => setFilterOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  flex2: { flex: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    ...shadow.card,
  },
  pinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFixed,
  },
  toolbarWrap: { flexGrow: 0, flexShrink: 0 },
  toolbar: { gap: 8, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center' },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  content: { paddingHorizontal: 16, paddingBottom: 170, gap: 20 },
  resultHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  image: { width: '100%', aspectRatio: 1.6 },
  overlayPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  darkPill: { backgroundColor: 'rgba(0,0,0,0.55)' },
  topLeft: { top: 12, left: 12 },
  bottomLeft: { bottom: 12, left: 12 },
  bottomRight: { bottom: 12, right: 12 },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  mapBtn: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: colors.inverseSurface,
    ...shadow.floating,
  },
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 20, paddingBottom: 8 },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { padding: 20, gap: 24 },
  group: { gap: 10 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceContainerHigh },
  trackFill: { marginLeft: '10%', width: '45%', height: 6, borderRadius: 3, backgroundColor: colors.primaryContainer },
  sheetActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12 },
});
