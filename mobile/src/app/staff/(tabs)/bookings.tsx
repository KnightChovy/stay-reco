import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { BookingStatus } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { Card, FilterChips, StaffTabScreen, accent, s, useStaffHotel } from '@/features/staff/ui';
import { bookingStatusLabel, dateInput, formatDate, formatVnd } from '@/lib/stay';
import { getHotelBookings } from '@/services/staff.service';

// `CHANGES`: đơn có yêu cầu đổi thông tin chờ khách sạn duyệt.
type Filter = 'all' | 'CHANGES' | BookingStatus;
const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'CONFIRMED', label: 'Sắp đến' },
  { key: 'CHECKED_IN', label: 'Đang ở' },
  { key: 'CHANGES', label: 'Chờ duyệt đổi' },
  { key: 'PENDING', label: 'Chờ thanh toán' },
  { key: 'COMPLETED', label: 'Hoàn tất' },
  { key: 'CANCELLED', label: 'Đã hủy' },
];

export default function StaffBookingsScreen() {
  const { hotelId } = useStaffHotel();
  // Mục "Cần xử lý ngay" trên dashboard mở thẳng vào bộ lọc tương ứng (`?filter=CHANGES`).
  const { filter: initial } = useLocalSearchParams<{ filter?: Filter }>();
  const [filter, setFilter] = useState<Filter>(initial ?? 'all');
  // Tab vẫn mounted khi quay lại, nên đổi bộ lọc theo param mỗi lần được mở bằng link mới.
  useEffect(() => {
    if (initial && filters.some((f) => f.key === initial)) setFilter(initial);
  }, [initial]);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  // Chờ người dùng ngừng gõ rồi mới gọi API.
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  // Đơn sắp đến / đang ở: gần nhất trước; tất cả, hoàn tất, đã hủy: mới nhất trước.
  const upcoming = filter === 'CONFIRMED' || filter === 'CHECKED_IN' || filter === 'PENDING' || filter === 'CHANGES';
  const params = {
    status: filter === 'all' || filter === 'CHANGES' ? undefined : [filter],
    changeRequest: filter === 'CHANGES' ? ('PENDING' as const) : undefined,
    search: search || undefined,
    sort: upcoming ? ('check-in-asc' as const) : ('check-in-desc' as const),
    pageSize: 50,
  };
  // shortcut: chỉ tải 50 đơn đầu, đủ cho ca trực; thêm phân trang khi khách sạn có nhiều đơn hơn.
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['staff', 'bookings', hotelId, params],
    queryFn: () => getHotelBookings(hotelId!, params),
    enabled: !!hotelId,
  });

  return (
    <StaffTabScreen>
      <Text variant="h1">Đặt phòng</Text>
      <Input icon="search" placeholder="Tìm mã đơn hoặc tên khách…" value={query} onChangeText={setQuery} accessibilityLabel="Tìm đặt phòng" />
      <FilterChips items={filters} value={filter} onChange={setFilter} />

      {isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : isError ? (
        <Card>
          <Text variant="small" color={colors.error}>
            Không tải được danh sách đặt phòng.
          </Text>
          <Button label="Thử lại" leadingIcon="refresh" variant="secondary" onPress={() => void refetch()} />
        </Card>
      ) : data.bookings.length === 0 ? (
        <Text variant="small" color={colors.onSurfaceVariant} center>
          Không có đơn nào khớp bộ lọc.
        </Text>
      ) : (
        <>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            {data.meta.total} đơn
          </Text>
          {data.bookings.map((b) => (
            <Card key={b.id}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Đơn ${b.code}`}
                onPress={() => router.push({ pathname: '/staff/bookings/[id]', params: { id: b.id } })}
                className="gap-2"
              >
                <View className={s.between}>
                  <Text variant="label" weight="bold">
                    #{b.code}
                  </Text>
                  <View className={s.row}>
                    <Chip label={bookingStatusLabel[b.status]} tone={b.status === 'CHECKED_IN' ? 'tertiary' : b.status === 'CONFIRMED' ? 'primary' : 'neutral'} />
                    <Icon name="chevron_right" size={18} color={colors.outline} />
                  </View>
                </View>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {b.roomType.name} · {b.rooms} phòng · {b.guests} khách
                </Text>
                <View className="flex-row gap-2 rounded-md bg-surface-container-low p-2.5">
                  <Text variant="caption" weight="semibold" className={s.flex}>
                    {formatDate(b.checkIn)} → {formatDate(b.checkOut)} ({b.nights} đêm)
                  </Text>
                  <Text variant="caption" weight="bold">
                    {formatVnd(b.totalAmount)}
                  </Text>
                </View>
              </Pressable>
              {b.status === 'CONFIRMED' && b.paymentStatus === 'PAID' && b.checkIn <= dateInput() && (
                <Button label="Check-in" size="sm" style={{ backgroundColor: accent }} onPress={() => router.push({ pathname: '/staff/check-in', params: { code: b.code } })} />
              )}
              {b.status === 'CHECKED_IN' && (
                <Button label="Check-out" size="sm" style={{ backgroundColor: accent }} onPress={() => router.push({ pathname: '/staff/check-out', params: { code: b.code } })} />
              )}
            </Card>
          ))}
        </>
      )}
    </StaffTabScreen>
  );
}
