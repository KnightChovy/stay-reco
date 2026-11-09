import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
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
import { colors, radius } from '@/constants/theme';
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
    <View className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-card">
      <View className="flex-row items-center justify-between gap-2 p-4">
        <View className="flex-row items-center gap-1.5">
          <Skeleton width={40} height={40} radius={radius.md} />
          <View className="gap-1.5">
            <Skeleton width={110} height={10} />
            <Skeleton width={130} height={16} />
          </View>
        </View>
        <Skeleton width={90} height={26} radius={radius.full} />
      </View>
      <Skeleton height={200} radius={0} />
      <View className="p-4 gap-3">
        <Skeleton width="70%" height={20} />
        <Skeleton width="35%" />
        <Skeleton height={44} radius={radius.md} />
        <View className="flex-row items-center justify-between gap-2">
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
    <View className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-card">
      <View className="flex-row items-center justify-between gap-2 p-4">
        <View className="flex-row items-center gap-1.5">
          <View className="h-10 w-10 items-center justify-center rounded-md bg-primary-fixed">
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
          className="shrink"
        />
      </View>

      <View>
        <Image source={booking.hotel.coverImageUrl ?? images.tripThumb} className="h-[200px] w-full" contentFit="cover" />
        <View className="absolute bottom-3 left-3 flex-row items-center gap-1.5 rounded-md bg-black/[0.55] px-2.5 py-1.5">
          <Icon name="calendar_today" size={14} color={colors.white} />
          <Text variant="caption" weight="semibold" color={colors.white}>
            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)} ({booking.nights} đêm)
          </Text>
        </View>
      </View>

      <View className="p-4 gap-3">
        <Text variant="h3">{booking.hotel.name}</Text>
        <View className="flex-row items-center gap-1.5">
          <Icon name="location_on" size={14} color={colors.onSurfaceVariant} />
          <Text variant="small" color={colors.onSurfaceVariant}>
            {booking.hotel.city}
          </Text>
        </View>
        <View className="gap-2.5 rounded-md bg-surface-container-low p-3">
          <View className="flex-row items-center gap-1.5">
            <Icon name="bed" size={16} color={colors.primaryContainer} />
            <Text variant="small" className="shrink">
              {booking.roomType.name} • {booking.rooms} phòng • {booking.guests} khách
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between gap-2">
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
        {booking.paymentStatus === 'REFUND_PENDING' ? (
          <Text variant="caption" color={colors.onSurfaceVariant} center>
            Đã gửi yêu cầu hủy, đang chờ khách sạn duyệt hoàn tiền.
          </Text>
        ) : (
          booking.status === 'CONFIRMED' && (
            <>
              <Button
                label="Đổi thông tin khách"
                leadingIcon="edit_note"
                variant="ghost"
                onPress={() => router.push({ pathname: '/booking/change', params: { id: booking.id } })}
              />
              <Button
                label="Hủy đặt phòng"
                leadingIcon="cancel"
                variant="ghost"
                onPress={() => router.push({ pathname: '/booking/cancel', params: { id: booking.id } })}
              />
            </>
          )
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
    <View className="flex-1 bg-surface">
      <AppHeader subtitle="Chuyến đi của tôi" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="shrink-0 grow-0 border-b border-surface-container-high" contentContainerClassName="px-2">
        {MY_BOOKING_TABS.map((t) => (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: t === tab }}
            onPress={() => setTab(t)}
            className={`border-b-2 px-3 py-3 ${t === tab ? 'border-b-primary' : 'border-b-transparent'}`}
          >
            <Text variant="label" weight={t === tab ? 'bold' : 'medium'} color={t === tab ? colors.primary : colors.onSurfaceVariant}>
              {tabLabels[t]}
              {t === tab && data ? ` (${data.meta.total})` : ''}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-[120px]" showsVerticalScrollIndicator={false}>
        {!account && hydrating ? (
          [0, 1].map((i) => <TripCardSkeleton key={i} />)
        ) : !account ? (
          <View className="items-center gap-3 py-6">
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Đăng nhập để xem các chuyến đi của bạn.
            </Text>
            <Button label="Đăng nhập" leadingIcon="login" onPress={() => router.push('/login')} />
          </View>
        ) : isPending ? (
          [0, 1].map((i) => <TripCardSkeleton key={i} />)
        ) : isError ? (
          <View className="items-center gap-3 py-6">
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Không tải được chuyến đi. Vui lòng kiểm tra kết nối.
            </Text>
            <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => refetch()} />
          </View>
        ) : data.bookings.length === 0 ? (
          <View className="items-center gap-3 py-6">
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
