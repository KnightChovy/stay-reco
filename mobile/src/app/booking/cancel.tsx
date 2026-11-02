import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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
import { colors, fonts, radius, shadow } from '@/constants/theme';
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
      <View style={styles.screen}>
        <ScreenHeader title="Hủy Đặt Phòng" />
        <View style={styles.state}>
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
    <View style={styles.screen}>
      <ScreenHeader title="Hủy Đặt Phòng" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, styles.row, { backgroundColor: free ? colors.tertiaryFixed : colors.surfaceContainerHigh }]}>
          <Icon name={free ? 'check_circle' : 'info'} size={22} color={free ? colors.tertiaryContainer : colors.secondary} />
          <Text variant="small" style={styles.flex}>
            {free
              ? q.freeUntil
                ? `Bạn đang trong thời gian hủy miễn phí (đến ${new Date(q.freeUntil).toLocaleString('vi-VN')}).`
                : 'Hủy đơn này không mất phí.'
              : `Đã quá thời gian hủy miễn phí, phí hủy là ${q.feePercent}% số tiền đã thanh toán.`}
          </Text>
        </View>

        <View style={styles.card}>
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

        <View style={styles.card}>
          <Text variant="h3">Chi tiết hoàn tiền</Text>
          <PriceLine label="Đã thanh toán" value={formatVnd(q.paid)} />
          <PriceLine label={`Phí hủy${free ? '' : ` (${q.feePercent}%)`}`} value={free ? 'Miễn phí' : `-${formatVnd(q.fee)}`} />
          <View style={styles.divider} />
          <View style={styles.between}>
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

        <View style={styles.card}>
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
            style={styles.textarea}
          />
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Lý do sẽ được gửi tới khách sạn.
          </Text>
        </View>

        <View style={[styles.row, styles.terms]}>
          <Checkbox checked={agreed} onChange={setAgreed} />
          <Text variant="caption" color={colors.onSurfaceVariant} style={styles.flex}>
            Tôi hiểu rằng thao tác hủy phòng không thể hoàn tác.
          </Text>
        </View>
        {!!error && (
          <Text variant="small" color={colors.error}>
            {error}
          </Text>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Button label="Giữ đơn" variant="secondary" size="sm" style={styles.flex} onPress={() => router.back()} />
        <Button
          label={submitting ? 'Đang hủy...' : q.needsApproval ? 'Gửi yêu cầu hủy' : 'Xác nhận hủy'}
          leadingIcon="cancel"
          size="sm"
          style={styles.flex}
          disabled={!agreed || submitting}
          onPress={() => void submit()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  banner: { padding: 16, borderRadius: radius.lg, alignItems: 'flex-start' },
  card: { padding: 16, gap: 8, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHigh },
  textarea: {
    minHeight: 80,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.onSurface,
    textAlignVertical: 'top',
  },
  terms: { alignItems: 'flex-start' },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surfaceContainerLowest,
    ...shadow.card,
  },
});
