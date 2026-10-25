import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { BookingProgress } from '@/features/booking/BookingProgress';
import { PriceLine } from '@/features/booking/PriceLine';
import { images } from '@/lib/mock-data';
import { bookingStatusLabel, formatDate, formatVnd } from '@/lib/stay';
import { getBooking, simulatePayment } from '@/services/bookings.service';

/** Giây còn lại tới `expiresAt`, cập nhật mỗi giây. */
function useSecondsLeft(expiresAt: string | null | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000)) : 0;
}

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  // Chỉ xác nhận khi SePay báo chuyển khoản khớp (không có nút "đã thanh toán"): hỏi lại trạng thái mỗi 4 giây.
  const { data: booking, refetch } = useQuery({
    queryKey: ['bookings', id],
    queryFn: () => getBooking(id),
    refetchInterval: (q) => (q.state.data?.status === 'PENDING' ? 4000 : false),
  });
  const secondsLeft = useSecondsLeft(booking?.payment?.expiresAt);
  // Chỉ khóa nút khi khách tự bấm; isFetching cũng bật theo lần hỏi tự động mỗi 4 giây làm nút nhấp nháy.
  const [checking, setChecking] = useState(false);
  const check = () => {
    setChecking(true);
    void refetch().finally(() => setChecking(false));
  };
  const [simulating, setSimulating] = useState(false);
  const simulate = () => {
    setSimulating(true);
    // Lỗi (simulator tắt) cũng hỏi lại trạng thái để màn hình phản ánh đúng đơn.
    void simulatePayment(id)
      .catch(() => {})
      .then(() => refetch())
      .finally(() => setSimulating(false));
  };

  useEffect(() => {
    if (booking?.status === 'CONFIRMED') {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      router.dismissTo({ pathname: '/confirmation', params: { id } });
    }
  }, [booking?.status, id, queryClient]);

  if (!booking) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Thanh Toán" />
        <View style={styles.state}>
          <Text variant="small" color={colors.onSurfaceVariant}>
            Đang tải đơn đặt phòng...
          </Text>
        </View>
      </View>
    );
  }

  const payment = booking.payment;
  if (booking.status !== 'PENDING' || !payment) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Thanh Toán" />
        <View style={styles.state}>
          <Icon name="info" size={36} color={colors.secondary} />
          <Text variant="h3" center>
            {booking.status === 'EXPIRED' ? 'Hết thời gian giữ phòng' : bookingStatusLabel[booking.status]}
          </Text>
          <Text variant="small" color={colors.onSurfaceVariant} center>
            {booking.status === 'EXPIRED'
              ? 'Đơn chưa được thanh toán trong 15 phút nên phòng đã được mở bán lại. Vui lòng tìm và đặt lại.'
              : `Đơn ${booking.code} không còn chờ thanh toán.`}
          </Text>
          <Button label="Tìm chỗ nghỉ khác" leadingIcon="search" onPress={() => router.dismissTo('/')} />
        </View>
      </View>
    );
  }

  const mm = `${Math.floor(secondsLeft / 60)}`.padStart(2, '0');
  const ss = `${secondsLeft % 60}`.padStart(2, '0');

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Thanh Toán" />
      <BookingProgress current={2} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.timer}>
          <Icon name="timer" size={24} color={colors.secondary} />
          <View style={styles.flex}>
            <Text variant="small" color={colors.onSecondaryContainer}>
              Phòng đang được giữ cho bạn
            </Text>
            <Text variant="small" weight="bold" color={colors.secondary}>
              Còn {mm}:{ss} để chuyển khoản
            </Text>
          </View>
        </View>

        <View style={[styles.card, styles.gap12]}>
          <View style={styles.row}>
            <Image source={booking.hotel.coverImageUrl ?? images.paymentThumb} style={styles.thumb} contentFit="cover" />
            <View style={[styles.flex, styles.gap4]}>
              <Text variant="h3">{booking.hotel.name}</Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {booking.roomType.name} • {booking.rooms} phòng • {booking.guests} khách
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {booking.nights} đêm • {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Mã đơn:{' '}
                <Text variant="caption" weight="bold">
                  {booking.code}
                </Text>
              </Text>
            </View>
          </View>
          <View style={styles.summary}>
            <PriceLine label={`Tiền phòng (${booking.nights} đêm)`} value={formatVnd(booking.totalAmount)} />
            <PriceLine label="Thuế VAT & Phí dịch vụ" value="Đã bao gồm" />
            <View style={styles.divider} />
            <View style={styles.between}>
              <Text variant="label" weight="bold">
                Tổng tiền thanh toán
              </Text>
              <Text variant="price" color={colors.primary}>
                {formatVnd(payment.amount)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.between}>
            <Text variant="label" weight="bold" style={styles.sectionTitle}>
              Chuyển khoản qua VietQR
            </Text>
            <Chip label="SePay" tone="neutral" />
          </View>
          <View style={styles.qrBox}>
            <Image source={payment.qrImageUrl} style={styles.qr} contentFit="contain" accessibilityLabel="Mã VietQR" />
            <PriceLine label="Ngân hàng" value={payment.bankName} />
            <PriceLine label="Số tài khoản" value={payment.accountNumber} />
            <PriceLine label="Chủ tài khoản" value={payment.accountName} />
            <View style={styles.transfer}>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Nội dung chuyển khoản (ghi chính xác)
              </Text>
              <Text variant="label" weight="bold" selectable>
                {payment.transferContent}
              </Text>
            </View>
            <Text variant="caption" color={colors.onSurfaceVariant} center>
              Quét mã bằng ứng dụng ngân hàng. Đơn tự xác nhận khi nhận đúng số tiền và nội dung.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label={checking ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái thanh toán'}
          leadingIcon="refresh"
          size="lg"
          disabled={checking}
          onPress={check}
        />
        {__DEV__ && (
          <Button
            label={simulating ? 'Đang giả lập...' : 'Giả lập đã chuyển khoản (dev)'}
            variant="muted"
            disabled={simulating}
            onPress={simulate}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  flex: { flex: 1 },
  sectionTitle: { fontSize: 16, flexShrink: 1 },
  gap4: { gap: 4 },
  gap12: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.secondaryFixed,
  },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  thumb: { width: 84, height: 84, borderRadius: radius.md },
  summary: { padding: 12, gap: 8, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHigh },
  qrBox: {
    marginTop: 14,
    padding: 14,
    gap: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  qr: {
    alignSelf: 'center',
    width: 240,
    height: 240,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    ...shadow.card,
  },
  transfer: { padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  bottomBar: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
});
