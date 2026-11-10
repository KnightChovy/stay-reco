import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
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
import { colors } from '@/constants/theme';
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
    <View className="flex-1 bg-surface">
      <AppHeader />
      <View className="mx-4 flex-row items-center gap-2.5 rounded-lg bg-surface-container-lowest p-3 shadow-card">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-fixed">
          <Icon name="location_on" size={20} color={colors.primaryContainer} />
        </View>
        <View className="flex-1">
          <Text variant="label" weight="bold">
            {stay.destination} · {formatDate(stay.checkIn).slice(0, 5)} - {formatDate(stay.checkOut).slice(0, 5)}
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            {nights} đêm · {stay.guests} khách · {stay.rooms} phòng
          </Text>
        </View>
        <Button label="Sửa" leadingIcon="tune" variant="secondary" size="sm" onPress={() => router.back()} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="items-center gap-2 px-4 py-3.5" className="shrink-0 grow-0">
        <Pressable onPress={() => setFilterOpen(true)} className="flex-row items-center gap-1.5 rounded-full bg-primary-container px-3.5 py-2">
          <Icon name="filter_list" size={18} color={colors.onPrimary} />
          <Text variant="label" weight="semibold" color={colors.onPrimary}>
            Bộ lọc
          </Text>
          {filterCount > 0 && (
            <View className="h-5 min-w-5 items-center justify-center rounded-full bg-secondary">
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

      <ScrollView contentContainerClassName="gap-5 px-4 pb-[120px]" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between">
          <Text variant="label" weight="bold">
            {data ? `${data.meta.total} chỗ nghỉ phù hợp · ` : ''}
            <Text variant="label" color={colors.onSurfaceVariant}>
              {stay.destination}
            </Text>
          </Text>
        </View>
        {loading && [0, 1, 2].map((i) => <HotelCardSkeleton key={i} />)}
        {isError && (
          <View className="items-center gap-2.5">
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
        <Pressable className="flex-1 bg-scrim" onPress={() => setFilterOpen(false)} />
        <View className="max-h-[85%] rounded-t-xl bg-surface" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="flex-row items-start gap-3 p-5 pb-2">
            <View className="flex-1">
              <Text variant="h2">Bộ lọc tìm kiếm</Text>
              <Text variant="small" color={colors.onSurfaceVariant}>
                Tùy chỉnh theo phong cách nghỉ dưỡng của bạn
              </Text>
            </View>
            <Pressable accessibilityLabel="Đóng" onPress={() => setFilterOpen(false)} className="h-10 w-10 items-center justify-center">
              <Icon name="close" color={colors.onSurface} />
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="gap-6 p-5">
            <View className="gap-2.5">
              <Text variant="label" weight="bold">
                Hạng sao
              </Text>
              <View className="flex-row flex-wrap gap-2">
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
            <View className="gap-2.5">
              <Text variant="label" weight="bold">
                Chính sách hủy
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Chip
                  label="Miễn phí hủy phòng"
                  icon="event_available"
                  tone={freeCancellation ? 'selected' : 'outline'}
                  onPress={() => setFreeCancellation((v) => !v)}
                />
              </View>
            </View>
            <View className="gap-2.5">
              <Text variant="label" weight="bold">
                Sắp xếp
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {HOTEL_SORTS.map((s) => (
                  <Chip key={s} label={sortLabels[s]} tone={s === sort ? 'selected' : 'outline'} onPress={() => setSort(s)} />
                ))}
              </View>
            </View>
          </ScrollView>
          <View className="flex-row gap-3 px-5 pt-3">
            <Button
              label="Thiết lập lại"
              variant="secondary"
              className="flex-1"
              onPress={() => {
                setStarRating([]);
                setFreeCancellation(false);
                setSort('recommended');
              }}
            />
            <Button
              label={data ? `Xem ${data.meta.total} chỗ nghỉ` : 'Áp dụng'}
              className="flex-[2]"
              onPress={() => setFilterOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
