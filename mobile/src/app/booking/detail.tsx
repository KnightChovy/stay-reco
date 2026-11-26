import { ActivityIndicator, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { BookingInvoice, bookingEventLabel } from '@/features/booking/BookingInvoice';
import { bookingStatusLabel, formatDate } from '@/lib/stay';
import { getBooking } from '@/services/bookings.service';

const card = 'gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card';

/** Chi tiết đơn của khách (như /account/bookings/[id] bên web): thông tin lưu trú, hoá đơn và lịch sử. */
export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: b, isPending, isError, refetch } = useQuery({ queryKey: ['bookings', id], queryFn: () => getBooking(id), enabled: !!id });

  if (!b)
    return (
      <View className="flex-1 bg-surface">
        <ScreenHeader title="Chi tiết đặt phòng" />
        <View className="flex-1 items-center justify-center gap-3 p-6">
          {isPending && !!id ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Text variant="small" color={colors.onSurfaceVariant} center>
                {isError ? 'Không tải được đơn đặt phòng.' : 'Thiếu mã đơn.'}
              </Text>
              {isError && <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => void refetch()} />}
            </>
          )}
        </View>
      </View>
    );

  const hasVoucher = b.status === 'CONFIRMED' || b.status === 'CHECKED_IN';

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title={`Đơn #${b.code}`} />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" showsVerticalScrollIndicator={false}>
        <View className={card}>
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text variant="h3">{b.hotel.name}</Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {b.hotel.city}
              </Text>
            </View>
            <Chip label={bookingStatusLabel[b.status]} tone={hasVoucher ? 'tertiary' : b.status === 'PENDING' ? 'secondary' : 'neutral'} />
          </View>
          <Text variant="small">
            {formatDate(b.checkIn)} – {formatDate(b.checkOut)} · {b.nights} đêm
          </Text>
          <Text variant="small" color={colors.onSurfaceVariant}>
            {b.roomType.name} · {b.rooms} phòng · {b.guests} khách · {b.guestName}
          </Text>
          {b.status === 'PENDING' && <Button label="Tiếp tục thanh toán" leadingIcon="payments" onPress={() => router.push({ pathname: '/booking/payment', params: { id: b.id } })} />}
          {hasVoucher && <Button label="Voucher check-in" leadingIcon="qr_code_2" variant="secondary" onPress={() => router.push({ pathname: '/confirmation', params: { id: b.id } })} />}
        </View>

        <View className={card}>
          <Text variant="h3">Hoá đơn</Text>
          <BookingInvoice booking={b} />
        </View>

        <View className={card}>
          <Text variant="h3">Lịch sử đơn</Text>
          {b.timeline.map((t, i) => (
            <View key={`${t.at}-${i}`} className="flex-row items-center gap-2.5">
              <View className="h-2 w-2 rounded bg-primary" />
              <View className="flex-1">
                <Text variant="small" weight="semibold">
                  {bookingEventLabel(t.event)}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {new Date(t.at).toLocaleString('vi-VN')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
