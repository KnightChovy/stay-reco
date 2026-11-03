import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { BookingStatus, PaymentStatus } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import type { Tone } from '@/features/staff/data';
import { Card, KV, StaffScreen, accent, s } from '@/features/staff/ui';
import { bookingStatusLabel, formatDate, formatVnd } from '@/lib/stay';
import { getBooking } from '@/services/bookings.service';

// Cùng nhãn/tone với frontend/src/features/staff/lib/labels.ts.
const statusTone: Record<BookingStatus, Tone> = {
  PENDING: 'warning',
  CONFIRMED: 'primary',
  CHECKED_IN: 'tertiary',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
  EXPIRED: 'neutral',
};
const payment: Record<PaymentStatus, { label: string; tone: Tone }> = {
  UNPAID: { label: 'Chưa thanh toán', tone: 'warning' },
  PAID: { label: 'Đã thanh toán', tone: 'tertiary' },
  REFUND_PENDING: { label: 'Chờ hoàn tiền', tone: 'primary' },
  PARTIALLY_REFUNDED: { label: 'Đã hoàn một phần', tone: 'primary' },
  REFUNDED: { label: 'Đã hoàn tiền', tone: 'neutral' },
  FAILED: { label: 'Thanh toán thất bại', tone: 'danger' },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

function Message({ title, text, retry }: { title: string; text: string; retry?: () => void }) {
  return (
    <Card style={styles.center}>
      <Icon name="verified_user" size={36} color={colors.outline} />
      <Text variant="h3" weight="bold" center>
        {title}
      </Text>
      <Text variant="small" color={colors.onSurfaceVariant} center>
        {text}
      </Text>
      {retry && <Button label="Thử lại" leadingIcon="refresh" variant="secondary" onPress={retry} />}
      <Button label="Danh sách đặt phòng" leadingIcon="arrow_back" onPress={() => router.navigate('/staff/bookings')} />
    </Card>
  );
}

export default function StaffBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // `GET /bookings/:id` chỉ nhận UUID; danh sách mẫu vẫn dẫn tới đây bằng mã đơn mẫu (giống web).
  const isRealId = UUID.test(id);
  const { data: b, isPending, isError, refetch } = useQuery({ queryKey: ['staff', 'booking', id], queryFn: () => getBooking(id), enabled: isRealId });

  if (!isRealId)
    return (
      <StaffScreen title={`Đơn ${id}`}>
        <Message
          title="Đơn mẫu chưa có trên hệ thống"
          text="Danh sách đặt phòng của staff đang dùng dữ liệu mẫu vì API danh sách (GET /hotels/:hotelId/bookings) chưa được phát hành. Màn chi tiết chỉ tải được đơn có id thật từ backend."
        />
      </StaffScreen>
    );
  if (isPending)
    return (
      <StaffScreen title="Chi tiết đặt phòng">
        <ActivityIndicator color={colors.primary} />
      </StaffScreen>
    );
  if (isError)
    return (
      <StaffScreen title="Chi tiết đặt phòng">
        <Message
          title="Không tải được đặt phòng"
          text="Đơn không tồn tại, không thuộc khách sạn của bạn, hoặc bạn thiếu quyền BOOKING/REFUND."
          retry={() => void refetch()}
        />
      </StaffScreen>
    );

  return (
    <StaffScreen
      title={`#${b.code}`}
      footer={
        b.status === 'CONFIRMED' ? (
          <Button label="Bắt đầu check-in" leadingIcon="key" style={[s.flex, { backgroundColor: accent }]} onPress={() => router.push('/staff/check-in')} />
        ) : b.status === 'CHECKED_IN' ? (
          <Button label="Check-out" leadingIcon="logout" style={[s.flex, { backgroundColor: accent }]} onPress={() => router.push('/staff/check-out')} />
        ) : undefined
      }
    >
      <View style={s.wrap}>
        <Chip label={bookingStatusLabel[b.status]} tone={statusTone[b.status]} />
        <Chip label={payment[b.paymentStatus].label} tone={payment[b.paymentStatus].tone} />
      </View>
      <Text variant="caption" color={colors.onSurfaceVariant}>
        {b.hotel.name}, {b.hotel.city} · Đặt lúc {dateTime(b.createdAt)}
      </Text>

      <Card>
        <Text variant="h3">Thông tin khách lưu trú</Text>
        <KV label="Họ và tên khách" value={b.guestName} strong />
        <KV label="Số điện thoại" value={b.contactPhone} />
        <KV label="Giờ đến dự kiến" value={b.arrivalTime ?? 'Chưa cung cấp'} />
        <View style={s.box}>
          <Text variant="small">{b.specialRequests || 'Khách không ghi yêu cầu đặc biệt.'}</Text>
        </View>
      </Card>

      <Card>
        <Text variant="h3">Thông tin kỳ nghỉ</Text>
        <KV label="Nhận phòng" value={formatDate(b.checkIn)} />
        <KV label="Trả phòng" value={formatDate(b.checkOut)} />
        <KV label="Số đêm" value={`${b.nights} đêm`} />
        <KV label="Số khách" value={`${b.guests} khách`} />
        <KV label="Số phòng đặt" value={`${b.rooms} phòng`} />
        <KV label="Hạng phòng" value={b.roomType.name} strong />
      </Card>

      <Card>
        <Text variant="h3">Quyết toán tài chính</Text>
        <Text variant="caption" color={colors.onSurfaceVariant}>
          Giá đã chốt tại thời điểm đặt phòng
        </Text>
        {b.nightlyPrices.map((n) => (
          <KV key={n.date} label={formatDate(n.date)} value={formatVnd(n.price)} />
        ))}
        <View style={s.divider} />
        <KV label="Tổng tiền" value={formatVnd(b.totalAmount)} strong />
        <KV label="Miễn phí huỷ trước" value={b.cancellation.freeUntil ? dateTime(b.cancellation.freeUntil) : 'Không áp dụng'} />
        <KV label="Phí huỷ sau hạn" value={`${b.cancellation.feePercent}%`} />
      </Card>

      <Card>
        <Text variant="h3">Yêu cầu hoàn tiền</Text>
        {b.refund ? (
          <KV label={payment[b.refund.status].label} value={formatVnd(b.refund.amount)} strong />
        ) : (
          <Text variant="small" color={colors.onSurfaceVariant}>
            Chưa có yêu cầu hoàn tiền.
          </Text>
        )}
        {b.cancelledAt && <KV label="Đã huỷ lúc" value={dateTime(b.cancelledAt)} />}
        {!!b.cancelReason && <Text variant="small">Lý do: {b.cancelReason}</Text>}
      </Card>

      <Card>
        <Text variant="h3">Lịch sử đơn</Text>
        {b.timeline.length === 0 ? (
          <Text variant="small" color={colors.onSurfaceVariant}>
            Chưa có cập nhật.
          </Text>
        ) : (
          b.timeline.map((t, i) => (
            <View key={`${t.at}-${i}`} style={s.row}>
              <View style={styles.dot} />
              <View style={s.flex}>
                <Text variant="small" weight="semibold">
                  {t.event}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {dateTime(t.at)}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
