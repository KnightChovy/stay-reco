import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ADD_ON_LIMITS, type AddOnPayment, type Booking, type BookingStatus, type PaymentStatus } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import type { Tone } from '@/features/staff/data';
import { BookingInvoice, addOnTimingLabel, bookingEventLabel } from '@/features/booking/BookingInvoice';
import { Card, FilterChips, KV, StaffScreen, accent, s } from '@/features/staff/ui';
import { alert } from '@/lib/alert';
import { bookingStatusLabel, dateInput, formatDate, formatVnd } from '@/lib/stay';
import { apiErrorMessage } from '@/services/ApiService';
import { getBooking } from '@/services/bookings.service';
import { acceptBookingChange, addBookingAddOn, forwardRefund, getHotelAddOns, markNoShow, rejectBookingChange, removeBookingAddOn } from '@/services/staff.service';

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

const paymentLabel: Record<AddOnPayment, string> = { PREPAID: 'Đã trả cùng tiền phòng', FRONT_DESK: 'Thu tại quầy khi trả phòng' };

const dateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

function Message({ title, text, retry }: { title: string; text: string; retry?: () => void }) {
  return (
    <Card className="items-center">
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
  const queryClient = useQueryClient();
  const { data: b, isPending, isError, refetch } = useQuery({ queryKey: ['staff', 'booking', id], queryFn: () => getBooking(id) });
  const [changeReason, setChangeReason] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [addOnId, setAddOnId] = useState('');
  const [quantity, setQuantity] = useState('1');
  // Giống canAddFrontDeskAddOn bên web: đơn đã trả tiền và chưa trả phòng.
  const addOnEditable = !!b && ((b.status === 'CONFIRMED' && b.paymentStatus === 'PAID') || b.status === 'CHECKED_IN');
  const catalogue = useQuery({ queryKey: ['staff', 'add-ons', b?.hotel.id], queryFn: () => getHotelAddOns(b!.hotel.id), enabled: addOnEditable });
  // Mỗi thao tác trả về booking mới: ghi thẳng vào cache, rồi làm mới danh sách và dashboard.
  const action = useMutation({
    mutationFn: (run: () => Promise<Booking>) => run(),
    onSuccess: (booking) => {
      queryClient.setQueryData(['staff', 'booking', id], booking);
      void queryClient.invalidateQueries({ queryKey: ['staff'], predicate: (q) => q.queryKey[1] !== 'booking' });
    },
  });
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
        b.status === 'CONFIRMED' && b.paymentStatus === 'PAID' && b.checkIn <= dateInput() ? (
          <Button label="Bắt đầu check-in" leadingIcon="key" className={s.flex} style={{ backgroundColor: accent }} onPress={() => router.push({ pathname: '/staff/check-in', params: { code: b.code } })} />
        ) : b.status === 'CHECKED_IN' ? (
          <Button label="Check-out" leadingIcon="logout" className={s.flex} style={{ backgroundColor: accent }} onPress={() => router.push({ pathname: '/staff/check-out', params: { code: b.code } })} />
        ) : undefined
      }
    >
      <View className={s.wrap}>
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
        <View className={s.box}>
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
        <Text variant="h3">Hoá đơn</Text>
        <BookingInvoice booking={b} />
        <KV label="Miễn phí huỷ trước" value={b.cancellation.freeUntil ? dateTime(b.cancellation.freeUntil) : 'Không áp dụng'} />
        <KV label="Phí huỷ sau hạn" value={`${b.cancellation.feePercent}%`} />
      </Card>

      <Card>
        <Text variant="h3">Dịch vụ đi kèm</Text>
        {b.addOns.length === 0 ? (
          <Text variant="small" color={colors.onSurfaceVariant}>
            Chưa có dịch vụ nào trên đơn này.
          </Text>
        ) : (
          b.addOns.map((line) => (
            <View key={line.id} className={s.between}>
              <View className={s.flex}>
                <Text variant="small" weight="semibold">
                  {line.name} × {line.quantity}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {addOnTimingLabel[line.timing]} · {paymentLabel[line.payment]}
                </Text>
              </View>
              <Text variant="small" weight="bold">
                {formatVnd(line.amount)}
              </Text>
              {addOnEditable && line.payment === 'FRONT_DESK' && (
                <Button
                  label="Bỏ"
                  variant="ghost"
                  size="sm"
                  disabled={action.isPending}
                  onPress={() =>
                    alert('Bỏ dịch vụ', `Bỏ "${line.name}" khỏi đơn ${b.code}?`, [
                      { text: 'Huỷ', style: 'cancel' },
                      { text: 'Bỏ', style: 'destructive', onPress: () => action.mutate(() => removeBookingAddOn(b.id, line.id)) },
                    ])
                  }
                />
              )}
            </View>
          ))
        )}
        {addOnEditable && (
          <View className={`gap-2 ${s.box}`}>
            <Text variant="small" weight="semibold">
              Thêm dịch vụ khách dùng tại khách sạn
            </Text>
            {catalogue.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : catalogue.isError ? (
              <Text variant="caption" color={colors.error}>
                {apiErrorMessage(catalogue.error, 'Không tải được danh mục dịch vụ.')}
              </Text>
            ) : !catalogue.data.some((a) => a.isActive) ? (
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Khách sạn chưa có dịch vụ nào đang bán.
              </Text>
            ) : (
              <>
                <FilterChips items={catalogue.data.filter((a) => a.isActive).map((a) => ({ key: a.id, label: `${a.name} · ${formatVnd(a.price)}` }))} value={addOnId} onChange={setAddOnId} />
                <View className={s.row}>
                  <Input label="Số lượng" keyboardType="number-pad" value={quantity} onChangeText={setQuantity} className={s.flex} />
                  <Button
                    label="Thêm"
                    leadingIcon="add"
                    style={{ backgroundColor: accent }}
                    disabled={!addOnId || action.isPending}
                    onPress={() =>
                      action.mutate(() =>
                        addBookingAddOn(b.id, { addOnId, quantity: Math.min(ADD_ON_LIMITS.maxQuantity, Math.max(1, Number(quantity) || 1)) }).then((r) => (setAddOnId(''), setQuantity('1'), r)),
                      )
                    }
                  />
                </View>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Thu tại quầy khi khách trả phòng; không tính vào tiền khách đã thanh toán.
                </Text>
              </>
            )}
          </View>
        )}
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

      {action.isError && <Text variant="small" color={colors.error}>{apiErrorMessage(action.error, 'Không thực hiện được thao tác.')}</Text>}

      {b.changeRequest?.status === 'PENDING' && (
        <Card>
          <Text variant="h3">Yêu cầu đổi thông tin</Text>
          {b.changeRequest.changes.guestName !== undefined && <KV label="Tên khách" value={b.changeRequest.changes.guestName} strong />}
          {b.changeRequest.changes.contactPhone !== undefined && <KV label="Số điện thoại" value={b.changeRequest.changes.contactPhone} strong />}
          {b.changeRequest.changes.arrivalTime !== undefined && <KV label="Giờ đến" value={b.changeRequest.changes.arrivalTime ?? 'Xóa'} strong />}
          {b.changeRequest.changes.specialRequests !== undefined && <KV label="Yêu cầu đặc biệt" value={b.changeRequest.changes.specialRequests ?? 'Xóa'} strong />}
          <Input label="Lý do từ chối" placeholder="Bắt buộc khi từ chối" value={changeReason} onChangeText={setChangeReason} />
          <View className={s.row}>
            <Button
              label="Từ chối"
              variant="secondary"
              className={s.flex}
              disabled={!changeReason.trim() || action.isPending}
              onPress={() => action.mutate(() => rejectBookingChange(b.id, { reason: changeReason.trim() }))}
            />
            <Button label="Chấp nhận" className={s.flex} style={{ backgroundColor: accent }} disabled={action.isPending} onPress={() => action.mutate(() => acceptBookingChange(b.id))} />
          </View>
        </Card>
      )}

      {b.paymentStatus === 'REFUND_PENDING' && (
        <Card>
          <Text variant="h3">Chuyển yêu cầu hoàn tiền cho chủ khách sạn</Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Chủ khách sạn là người duyệt; ghi lại những gì bạn đã kiểm tra.
          </Text>
          <Input label="Ghi chú" placeholder="Ví dụ: đã liên hệ khách, lý do hợp lệ…" value={refundNote} onChangeText={setRefundNote} multiline />
          <Button
            label="Chuyển yêu cầu"
            leadingIcon="send"
            style={{ backgroundColor: accent }}
            disabled={!refundNote.trim() || action.isPending}
            onPress={() => action.mutate(() => forwardRefund(b.id, { note: refundNote.trim() }).then((r) => (setRefundNote(''), r)))}
          />
        </Card>
      )}

      {/* Giống web: đơn đã trả tiền mà quá ngày nhận phòng chưa thấy khách. */}
      {b.status === 'CONFIRMED' && b.paymentStatus === 'PAID' && b.checkIn < dateInput() && (
        <Button label="Đánh dấu khách không đến (no-show)" leadingIcon="person_off" variant="secondary" disabled={action.isPending} onPress={() => action.mutate(() => markNoShow(b.id))} />
      )}

      <Card>
        <Text variant="h3">Lịch sử đơn</Text>
        {b.timeline.length === 0 ? (
          <Text variant="small" color={colors.onSurfaceVariant}>
            Chưa có cập nhật.
          </Text>
        ) : (
          b.timeline.map((t, i) => (
            <View key={`${t.at}-${i}`} className={s.row}>
              <View className="h-2 w-2 rounded bg-primary" />
              <View className={s.flex}>
                <Text variant="small" weight="semibold">
                  {bookingEventLabel(t.event)}
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
