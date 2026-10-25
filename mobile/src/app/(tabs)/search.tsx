import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HOTEL_SORTS } from '@stayreco/shared';
import { HotelCard, HotelCardSkeleton } from '@/components/common/card/HotelCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { formatDate, nightsBetween, stayFromParams } from '@/lib/stay';
import { searchHotels } from '@/services/stays.service';

type Sort = (typeof HOTEL_SORTS)[number];

const sortLabels: Record<Sort, string> = {
  recommended: 'Phù hợp',
  'price-asc': 'Giá thấp đến cao',
  'price-desc': 'Giá cao đến thấp',
  'star-desc': 'Hạng sao cao nhất',
};

const STARS = [5, 4, 3];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const stay = stayFromParams(useLocalSearchParams());
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState<Sort>('recommended');
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [starRating, setStarRating] = useState<number[]>([]);

  const query = {
    ...stay,
    sort,
    page: 1,
    pageSize: 20,
    ...(freeCancellation ? { freeCancellation: true } : {}),
    ...(starRating.length ? { starRating } : {}),
  };
  // shortcut: chỉ lấy trang đầu 20 kết quả, thêm tải tiếp khi điểm đến có nhiều khách sạn hơn.
  const { data, isPending, isPlaceholderData, isError, refetch } = useQuery({
    queryKey: ['stays', 'search', query],
    queryFn: () => searchHotels(query),
    placeholderData: keepPreviousData,
  });
  // Đổi bộ lọc thì vẫn giữ số kết quả cũ ở tiêu đề, nhưng danh sách hiện skeleton tới khi có kết quả mới.
  const loading = isPending || isPlaceholderData;

  const toggleStar = (star: number) =>
    setStarRating((s) => (s.includes(star) ? s.filter((x) => x !== star) : [...s, star]));
  const nextSort = () => setSort((s) => HOTEL_SORTS[(HOTEL_SORTS.indexOf(s) + 1) % HOTEL_SORTS.length]);
  const filterCount = starRating.length + (freeCancellation ? 1 : 0);

  return (
    <View style={styles.screen}>
      <AppHeader />
      <View style={styles.summary}>
        <View style={styles.pinIcon}>
          <Icon name="location_on" size={20} color={colors.primaryContainer} />
        </View>
        <View style={styles.flex}>
          <Text variant="label" weight="bold">
            {stay.destination} · {formatDate(stay.checkIn).slice(0, 5)} - {formatDate(stay.checkOut).slice(0, 5)}
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            {nights} đêm · {stay.guests} khách · {stay.rooms} phòng
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
          {filterCount > 0 && (
            <View style={styles.badge}>
              <Text variant="caption" weight="bold" color={colors.white}>
                {filterCount}
              </Text>
            </View>
          )}
        </Pressable>
        <Chip label={`Sắp xếp: ${sortLabels[sort]}`} icon="sort" tone="outline" onPress={nextSort} />
        <Chip
          label="Hủy miễn phí"
          icon="event_available"
          tone={freeCancellation ? 'secondary' : 'outline'}
          onPress={() => setFreeCancellation((v) => !v)}
        />
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHead}>
          <Text variant="label" weight="bold">
            {data ? `${data.meta.total} chỗ nghỉ phù hợp · ` : ''}
            <Text variant="label" color={colors.onSurfaceVariant}>
              {stay.destination}
            </Text>
          </Text>
        </View>
        {loading && [0, 1, 2].map((i) => <HotelCardSkeleton key={i} />)}
        {isError && (
          <View style={styles.state}>
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Không tải được kết quả. Vui lòng kiểm tra kết nối.
            </Text>
            <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => refetch()} />
          </View>
        )}
        {!loading && data?.hotels.length === 0 && (
          <Text variant="small" color={colors.onSurfaceVariant} center>
            Chưa có chỗ nghỉ còn phòng cho lựa chọn này. Thử đổi ngày hoặc bỏ bớt bộ lọc.
          </Text>
        )}
        {!loading &&
          data?.hotels.map((h, i) => (
            <HotelCard key={h.id} hotel={h} stay={stay} index={i} />
          ))}
      </ScrollView>

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
                Hạng sao
              </Text>
              <View style={styles.chips}>
                {STARS.map((star) => (
                  <Chip
                    key={star}
                    label={`${star} sao`}
                    tone={starRating.includes(star) ? 'selected' : 'outline'}
                    onPress={() => toggleStar(star)}
                  />
                ))}
              </View>
            </View>
            <View style={styles.group}>
              <Text variant="label" weight="bold">
                Chính sách hủy
              </Text>
              <View style={styles.chips}>
                <Chip
                  label="Miễn phí hủy phòng"
                  icon="event_available"
                  tone={freeCancellation ? 'selected' : 'outline'}
                  onPress={() => setFreeCancellation((v) => !v)}
                />
              </View>
            </View>
            <View style={styles.group}>
              <Text variant="label" weight="bold">
                Sắp xếp
              </Text>
              <View style={styles.chips}>
                {HOTEL_SORTS.map((s) => (
                  <Chip key={s} label={sortLabels[s]} tone={s === sort ? 'selected' : 'outline'} onPress={() => setSort(s)} />
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.sheetActions}>
            <Button
              label="Thiết lập lại"
              variant="secondary"
              style={styles.flex}
              onPress={() => {
                setStarRating([]);
                setFreeCancellation(false);
                setSort('recommended');
              }}
            />
            <Button
              label={data ? `Xem ${data.meta.total} chỗ nghỉ` : 'Áp dụng'}
              style={styles.flex2}
              onPress={() => setFilterOpen(false)}
            />
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
  content: { paddingHorizontal: 16, paddingBottom: 120, gap: 20 },
  resultHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  state: { alignItems: 'center', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  sheetActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12 },
});
