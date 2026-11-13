import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { BookingProgress } from '@/features/booking/BookingProgress';
import { PriceLine } from '@/features/booking/PriceLine';
import { images } from '@/lib/mock-data';
import { bookingStatusLabel, formatDate, formatVnd } from '@/lib/stay';
import { apiErrorMessage } from '@/services/ApiService';
import { getBooking, simulatePayment } from '@/services/bookings.service';
import { getMyWallet, payWithWallet } from '@/services/rewards.service';

/** Giây còn lại tới `expiresAt`, cập nhật mỗi giây. */
function useSecondsLeft(expiresAt: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());
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

  const wallet = useQuery({ queryKey: ['wallet'], queryFn: getMyWallet });
  const [payingWallet, setPayingWallet] = useState(false);
  const [walletError, setWalletError] = useState('');
  const payFromWallet = () => {
    setPayingWallet(true);
    setWalletError('');
    void payWithWallet(id)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['wallet'] });
        return refetch();
      })
      .catch((err: unknown) => {
        setWalletError(apiErrorMessage(err, 'Không thanh toán được bằng ví. Vui lòng thử lại.'));
        void wallet.refetch();
        void refetch();
      })
      .finally(() => setPayingWallet(false));
  };

  useEffect(() => {
    if (booking?.status === 'CONFIRMED') {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      router.dismissTo({ pathname: '/confirmation', params: { id } });
    }
  }, [booking?.status, id, queryClient]);

  if (!booking) {
    return (
      <View className="flex-1 bg-surface">
        <ScreenHeader title="Thanh Toán" />
        <View className="flex-1 items-center justify-center gap-3 p-6">
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
      <View className="flex-1 bg-surface">
        <ScreenHeader title="Thanh Toán" />
        <View className="flex-1 items-center justify-center gap-3 p-6">
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

  const subtotal = booking.items.reduce((sum, i) => sum + i.subtotal, 0);
  // W1: ví chỉ trả được cả đơn, không trả một phần.
  const walletCovers = (wallet.data?.balanceAvailable ?? 0) >= payment.amount;
  const mm = `${Math.floor(secondsLeft / 60)}`.padStart(2, '0');
  const ss = `${secondsLeft % 60}`.padStart(2, '0');

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Thanh Toán" />
      <BookingProgress current={2} />

      <ScrollView contentContainerClassName="gap-4 p-4 pb-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-3 rounded-lg bg-secondary-fixed p-3.5">
          <Icon name="timer" size={24} color={colors.secondary} />
          <View className="flex-1">
            <Text variant="small" color={colors.onSecondaryContainer}>
              Phòng đang được giữ cho bạn
            </Text>
            <Text variant="small" weight="bold" color={colors.secondary}>
              Còn {mm}:{ss} để chuyển khoản
            </Text>
          </View>
        </View>

        <View className="rounded-lg bg-surface-container-lowest p-4 shadow-card gap-3">
          <View className="flex-row items-center gap-2">
            <Image source={booking.hotel.coverImageUrl ?? images.paymentThumb} className="h-[84px] w-[84px] rounded-md" contentFit="cover" />
            <View className="flex-1 gap-1">
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
          <View className="gap-2 rounded-md bg-surface-container-low p-3">
            <PriceLine label={`Tiền phòng (${booking.nights} đêm)`} value={formatVnd(subtotal)} />
            {subtotal > booking.totalAmount && (
              <PriceLine
                label="Ưu đãi & điểm StayMiles"
                icon="sell"
                tone={colors.tertiary}
                value={`-${formatVnd(subtotal - booking.totalAmount)}`}
              />
            )}
            <PriceLine label="Thuế VAT & Phí dịch vụ" value="Đã bao gồm" />
            <View className="h-px bg-surface-container-high" />
            <View className="flex-row items-center justify-between gap-2">
              <Text variant="label" weight="bold">
                Tổng tiền thanh toán
              </Text>
              <Text variant="price" color={colors.primary}>
                {formatVnd(payment.amount)}
              </Text>
            </View>
          </View>
        </View>

        {walletCovers && (
          <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
            <View className="flex-row items-center gap-2">
              <Icon name="account_balance_wallet" size={20} color={colors.primaryContainer} />
              <Text variant="label" weight="bold" style={{ fontSize: 16, flexShrink: 1 }}>
                Thanh toán bằng ví StayReco
              </Text>
            </View>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Số dư {formatVnd(wallet.data!.balanceAvailable)} đủ trả cả đơn. Đơn được xác nhận ngay, không cần chuyển khoản.
            </Text>
            <Button
              label={payingWallet ? 'Đang thanh toán...' : `Trả ${formatVnd(payment.amount)} bằng ví`}
              leadingIcon="account_balance_wallet"
              variant="secondary"
              disabled={payingWallet}
              onPress={payFromWallet}
            />
          </View>
        )}
        {!!walletError && (
          <Text variant="small" color={colors.error}>
            {walletError}
          </Text>
        )}

        <View className="rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <View className="flex-row items-center justify-between gap-2">
            <Text variant="label" weight="bold" style={{ fontSize: 16, flexShrink: 1 }}>
              Chuyển khoản qua VietQR
            </Text>
            <Chip label="SePay" tone="neutral" />
          </View>
          <View className="mt-3.5 gap-3 rounded-md border border-surface-container-high p-3.5">
            <Image source={payment.qrImageUrl} className="h-60 w-60 self-center rounded-lg bg-surface-container-lowest p-3 shadow-card" contentFit="contain" accessibilityLabel="Mã VietQR" />
            <PriceLine label="Ngân hàng" value={payment.bankName} />
            <PriceLine label="Số tài khoản" value={payment.accountNumber} />
            <PriceLine label="Chủ tài khoản" value={payment.accountName} />
            <View className="rounded-md bg-surface-container-low p-3">
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

      <View className="gap-2.5 border-t border-surface-container-high bg-surface-container-lowest px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
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
