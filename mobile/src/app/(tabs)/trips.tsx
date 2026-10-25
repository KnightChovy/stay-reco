import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MY_BOOKING_TABS, type BookingSummary } from '@stayreco/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { images } from '@/lib/mock-data';
import { bookingStatusLabel, formatDate, formatVnd } from '@/lib/stay';
import { getMyBookings } from '@/services/bookings.service';
import { useAuthStore } from '@/stores/auth.store';

type Tab = (typeof MY_BOOKING_TABS)[number];

const tabLabels: Record<Tab, string> = {
  upcoming: 'Sắp tới',
  staying: 'Đang lưu trú',
  completed: 'Đã hoàn tất',
  cancelled: 'Đã hủy',
};

/** Giữ chỗ cùng bố cục với TripCard trong lúc chờ danh sách đơn. */
function TripCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.between, styles.pad]}>
        <View style={styles.row}>
          <Skeleton width={40} height={40} radius={radius.md} />
          <View style={styles.skeletonLines}>
            <Skeleton width={110} height={10} />
            <Skeleton width={130} height={16} />
          </View>
        </View>
        <Skeleton width={90} height={26} radius={radius.full} />
      </View>
      <Skeleton height={200} radius={0} />
      <View style={[styles.pad, styles.body]}>
        <Skeleton width="70%" height={20} />
        <Skeleton width="35%" />
        <Skeleton height={44} radius={radius.md} />
        <View style={styles.between}>
          <Skeleton width={60} height={12} />
          <Skeleton width={120} height={20} />
        </View>
        <Skeleton height={52} radius={radius.md} />
      </View>
    </View>
  );
}

function TripCard({ booking }: { booking: BookingSummary }) {
  const hasVoucher = booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN';
  return (
    <View style={styles.card}>
      <View style={[styles.between, styles.pad]}>
        <View style={styles.row}>
          <View style={styles.hotelIcon}>
            <Icon name="hotel" size={22} color={colors.primaryContainer} />
          </View>
          <View>
            <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant}>
              MÃ ĐƠN ĐẶT PHÒNG
            </Text>
            <Text variant="label" weight="bold">
              {booking.code}
            </Text>
          </View>
        </View>
        <Chip
          label={bookingStatusLabel[booking.status]}
          tone={booking.status === 'PENDING' ? 'secondary' : hasVoucher ? 'tertiary' : 'neutral'}
          style={styles.shrink}
        />
      </View>

      <View>
        <Image source={booking.hotel.coverImageUrl ?? images.tripThumb} style={styles.cover} contentFit="cover" />
        <View style={styles.dateTag}>
          <Icon name="calendar_today" size={14} color={colors.white} />
          <Text variant="caption" weight="semibold" color={colors.white}>
            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)} ({booking.nights} đêm)
          </Text>
        </View>
      </View>

      <View style={[styles.pad, styles.body]}>
        <Text variant="h3">{booking.hotel.name}</Text>
        <View style={styles.row}>
          <Icon name="location_on" size={14} color={colors.onSurfaceVariant} />
          <Text variant="small" color={colors.onSurfaceVariant}>
            {booking.hotel.city}
          </Text>
        </View>
        <View style={styles.stay}>
          <View style={styles.row}>
            <Icon name="bed" size={16} color={colors.primaryContainer} />
            <Text variant="small" style={styles.shrink}>
              {booking.roomType.name} • {booking.rooms} phòng • {booking.guests} khách
            </Text>
          </View>
        </View>
        <View style={styles.between}>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Tổng tiền
          </Text>
          <Text variant="h3" weight="bold" color={colors.primary}>
            {formatVnd(booking.totalAmount)}
          </Text>
        </View>
        {booking.status === 'PENDING' && (
          <Button
            label="Tiếp tục thanh toán"
            leadingIcon="payments"
            size="lg"
            onPress={() => router.push({ pathname: '/booking/payment', params: { id: booking.id } })}
          />
        )}
        {hasVoucher && (
          <Button
            label="Voucher check-in"
            leadingIcon="qr_code_2"
            size="lg"
            onPress={() => router.push({ pathname: '/confirmation', params: { id: booking.id } })}
          />
        )}
      </View>
    </View>
  );
}

export default function TripsScreen() {
  const account = useAuthStore((s) => s.account);
  const hydrating = useAuthStore((s) => s.hydrating);
  const [tab, setTab] = useState<Tab>('upcoming');
  // shortcut: chỉ lấy 20 đơn mới nhất mỗi tab, thêm phân trang khi khách có nhiều đơn hơn.
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['bookings', 'mine', tab],
    queryFn: () => getMyBookings({ tab, page: 1, pageSize: 20 }),
    enabled: !!account,
  });

  return (
    <View style={styles.screen}>
      <AppHeader subtitle="Chuyến đi của tôi" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsWrap} contentContainerStyle={styles.tabs}>
        {MY_BOOKING_TABS.map((t) => (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: t === tab }}
            onPress={() => setTab(t)}
            style={[styles.tab, t === tab && styles.tabActive]}
          >
            <Text variant="label" weight={t === tab ? 'bold' : 'medium'} color={t === tab ? colors.primary : colors.onSurfaceVariant}>
              {tabLabels[t]}
              {t === tab && data ? ` (${data.meta.total})` : ''}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!account && hydrating ? (
          [0, 1].map((i) => <TripCardSkeleton key={i} />)
        ) : !account ? (
          <View style={styles.state}>
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Đăng nhập để xem các chuyến đi của bạn.
            </Text>
            <Button label="Đăng nhập" leadingIcon="login" onPress={() => router.push('/login')} />
          </View>
        ) : isPending ? (
          [0, 1].map((i) => <TripCardSkeleton key={i} />)
        ) : isError ? (
          <View style={styles.state}>
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Không tải được chuyến đi. Vui lòng kiểm tra kết nối.
            </Text>
            <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => refetch()} />
          </View>
        ) : data.bookings.length === 0 ? (
          <View style={styles.state}>
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Chưa có chuyến đi nào ở mục này.
            </Text>
            <Button label="Tìm chỗ nghỉ" leadingIcon="search" variant="secondary" onPress={() => router.navigate('/')} />
          </View>
        ) : (
          data.bookings.map((b) => <TripCard key={b.id} booking={b} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 120 },
  shrink: { flexShrink: 1 },
  skeletonLines: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tabsWrap: { flexGrow: 0, flexShrink: 0, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHigh },
  tabs: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  card: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  pad: { padding: 16 },
  hotelIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFixed,
  },
  cover: { width: '100%', height: 200 },
  dateTag: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  body: { gap: 12 },
  stay: { padding: 12, gap: 10, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
});
