import { useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AxiosError } from 'axios';
import { BOOKING_LIMITS, cancelBookingSchema } from '@stayreco/shared';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { PriceLine } from '@/features/booking/PriceLine';
import { formatDate, formatVnd } from '@/lib/stay';
import { cancelBooking, getBooking, getCancellationQuote } from '@/services/bookings.service';

type ApiError = AxiosError<{ code?: string; message?: string }>;

export default function CancelBookingScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const booking = useQuery({ queryKey: ['bookings', id], queryFn: () => getBooking(id), enabled: !!id });
  // Phí phụ thuộc thời điểm hủy nên không giữ cache cũ.
  const quote = useQuery({
    queryKey: ['bookings', id, 'cancellation-quote'],
    queryFn: () => getCancellationQuote(id),
    enabled: !!id,
    gcTime: 0,
  });
  const [reason, setReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const input = cancelBookingSchema.safeParse({ reason });
    if (!input.success) {
      setError('Vui lòng nhập lý do hủy phòng.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await cancelBooking(id, input.data);
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert(
        result.status === 'CANCELLED' ? 'Đã hủy đặt phòng' : 'Đã gửi yêu cầu hoàn tiền',
        result.status === 'CANCELLED'
          ? `Đơn ${result.code} đã được hủy.`
          : `Khách sạn sẽ xem xét và hoàn ${formatVnd(result.refund?.amount ?? 0)} cho bạn. Đơn vẫn giữ phòng cho đến khi khách sạn quyết định.`,
        [{ text: 'Về chuyến đi của tôi', onPress: () => router.navigate('/trips') }],
      );
    } catch (err) {
      const body = (err as ApiError).response?.data;
      setError(
        body?.code === 'CANCELLATION_NOT_ALLOWED'
          ? 'Không thể hủy đơn sau khi đã nhận phòng.'
          : body?.code === 'BOOKING_STATUS_CONFLICT'
            ? 'Đơn này không còn hủy được hoặc đang chờ khách sạn duyệt hoàn tiền.'
            : body?.message || 'Không hủy được đơn. Vui lòng kiểm tra kết nối và thử lại.',
      );
      void queryClient.invalidateQueries({ queryKey: ['bookings', id] });
    } finally {
      setSubmitting(false);
    }
  };

  const b = booking.data;
  const q = quote.data;

  if (!b || !q) {
    const failed = booking.isError || quote.isError || !id;
    return (
      <View className="flex-1 bg-surface">
        <ScreenHeader title="Hủy Đặt Phòng" />
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text variant="small" color={colors.onSurfaceVariant} center>
            {failed ? 'Đơn này hiện không thể hủy hoặc không tải được thông tin.' : 'Đang tải...'}
          </Text>
          {failed && (
            <Button label="Về chuyến đi của tôi" variant="secondary" onPress={() => router.navigate('/trips')} />
          )}
        </View>
      </View>
    );
  }

  const free = q.fee === 0;

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Hủy Đặt Phòng" />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" showsVerticalScrollIndicator={false}>
        <View className="rounded-lg p-4 flex-row items-center gap-2" style={{ backgroundColor: free ? colors.tertiaryFixed : colors.surfaceContainerHigh }}>
          <Icon name={free ? 'check_circle' : 'info'} size={22} color={free ? colors.tertiaryContainer : colors.secondary} />
          <Text variant="small" className="flex-1">
            {free
              ? q.freeUntil
                ? `Bạn đang trong thời gian hủy miễn phí (đến ${new Date(q.freeUntil).toLocaleString('vi-VN')}).`
                : 'Hủy đơn này không mất phí.'
              : `Đã quá thời gian hủy miễn phí, phí hủy là ${q.feePercent}% số tiền đã thanh toán.`}
          </Text>
        </View>

        <View className="gap-2 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant}>
            MÃ ĐƠN: {b.code}
          </Text>
          <Text variant="h3">{b.hotel.name}</Text>
          <Text variant="small" color={colors.onSurfaceVariant}>
            {b.roomType.name} • {b.rooms} phòng • {b.guests} khách
          </Text>
          <Text variant="small" color={colors.onSurfaceVariant}>
            {formatDate(b.checkIn)} - {formatDate(b.checkOut)} ({b.nights} đêm)
          </Text>
        </View>

        <View className="gap-2 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <Text variant="h3">Chi tiết hoàn tiền</Text>
          <PriceLine label="Đã thanh toán" value={formatVnd(q.paid)} />
          <PriceLine label={`Phí hủy${free ? '' : ` (${q.feePercent}%)`}`} value={free ? 'Miễn phí' : `-${formatVnd(q.fee)}`} />
          <View className="h-px bg-surface-container-high" />
          <View className="flex-row items-center justify-between gap-2">
            <Text variant="label" weight="bold">
              Số tiền hoàn lại
            </Text>
            <Text variant="price" color={colors.primary}>
              {formatVnd(q.refund)}
            </Text>
          </View>
          {q.needsApproval && (
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Khách sạn cần duyệt yêu cầu hoàn tiền; đơn vẫn giữ phòng cho đến khi khách sạn quyết định.
            </Text>
          )}
        </View>

        <View className="gap-2 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <Text variant="label" weight="bold">
            Lý do hủy phòng
          </Text>
          <TextInput
            multiline
            maxLength={BOOKING_LIMITS.cancelReasonMax}
            accessibilityLabel="Lý do hủy phòng"
            placeholder="Ví dụ: Thay đổi lịch trình, tìm được chỗ nghỉ khác..."
            placeholderTextColor={colors.outline}
            value={reason}
            onChangeText={setReason}
            className="min-h-20 rounded-md bg-surface-container-low p-3 font-be-regular text-sm text-on-surface"
          />
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Lý do sẽ được gửi tới khách sạn.
          </Text>
        </View>

        <View className="flex-row items-center gap-2" style={{ alignItems: 'flex-start' }}>
          <Checkbox checked={agreed} onChange={setAgreed} />
          <Text variant="caption" color={colors.onSurfaceVariant} className="flex-1">
            Tôi hiểu rằng thao tác hủy phòng không thể hoàn tác.
          </Text>
        </View>
        {!!error && (
          <Text variant="small" color={colors.error}>
            {error}
          </Text>
        )}
      </ScrollView>

      <View className="flex-row gap-3 bg-surface-container-lowest px-4 pt-3 shadow-card" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button label="Giữ đơn" variant="secondary" size="sm" className="flex-1" onPress={() => router.back()} />
        <Button
          label={submitting ? 'Đang hủy...' : q.needsApproval ? 'Gửi yêu cầu hủy' : 'Xác nhận hủy'}
          leadingIcon="cancel"
          size="sm"
          className="flex-1"
          disabled={!agreed || submitting}
          onPress={() => void submit()}
        />
      </View>
    </View>
  );
}
