import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CheckOutInput } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { Banner, Card, CardHead, KV, StaffScreen, SuccessSheet, accent, s, success, useStaffHotel } from '@/features/staff/ui';
import { bookingStatusLabel, formatDate, formatVnd } from '@/lib/stay';
import { apiErrorMessage } from '@/services/ApiService';
import { checkOutBooking, getCheckOutQuote, lookupBooking, toLookup } from '@/services/staff.service';

export default function StaffCheckOutScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const { hotelId } = useStaffHotel();
  const queryClient = useQueryClient();
  const [input, setInput] = useState(params.code ?? '');
  const [query, setQuery] = useState(params.code?.trim() || '');
  const [fee, setFee] = useState('');
  const [reason, setReason] = useState('');

  const lookup = useQuery({
    queryKey: ['staff', 'lookup', hotelId, query],
    queryFn: () => lookupBooking(hotelId!, toLookup(query)),
    enabled: !!hotelId && !!query,
  });
  const booking = lookup.data;
  const checkOut = useMutation({
    mutationFn: (input: CheckOutInput) => checkOutBooking(booking!.id, input),
    // Không await (để màn chuyển ngay sang trạng thái thành công) và bỏ qua 'check-out-quote': đơn đã đổi trạng thái nên API đó trả 409.
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['staff'], predicate: (q) => q.queryKey[1] !== 'check-out-quote' }),
  });
  const canCheckOut = booking?.status === 'CHECKED_IN';
  const quote = useQuery({
    queryKey: ['staff', 'check-out-quote', booking?.id],
    queryFn: () => getCheckOutQuote(booking!.id),
    enabled: canCheckOut && !checkOut.isSuccess,
  });

  const computed = quote.data?.lateFee?.amount ?? 0;
  // Để trống = thu đúng phí theo chính sách; nhập số thấp hơn thì bắt buộc có lý do (không được cao hơn phí tính ra).
  const lowered = fee.trim() !== '' && Number(fee) !== computed;
  const feeValid = !lowered || (/^\d+$/.test(fee.trim()) && Number(fee) <= computed && !!reason.trim());

  const search = () => {
    const value = input.trim();
    if (!value) return;
    setFee('');
    setReason('');
    checkOut.reset();
    setQuery(value);
  };

  return (
    <StaffScreen
      title="Check-out & quyết toán"
      right={
        booking ? (
          <Button label="Chi tiết đơn" variant="ghost" size="sm" onPress={() => router.push({ pathname: '/staff/bookings/[id]', params: { id: booking.id } })} />
        ) : undefined
      }
      footer={
        canCheckOut && !checkOut.isSuccess ? (
          <Button
            label={checkOut.isPending ? 'Đang xử lý…' : 'Check-out & giải phóng phòng'}
            leadingIcon="check_circle"
            size="lg"
            disabled={!quote.data || !feeValid || checkOut.isPending}
            className={s.flex} style={{ backgroundColor: accent }}
            onPress={() => checkOut.mutate(lowered ? { lateFee: { amount: Number(fee), reason: reason.trim() } } : {})}
          />
        ) : undefined
      }
    >
      <Card>
        <Input
          icon="search"
          placeholder="Mã đơn (SR-261031-1234) hoặc token QR"
          autoCapitalize="characters"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={search}
          returnKeyType="search"
          accessibilityLabel="Mã đơn hoặc token QR"
        />
        <Button label="Tìm đơn" leadingIcon="search" disabled={!input.trim() || !hotelId} onPress={search} style={{ backgroundColor: accent }} />
      </Card>

      {lookup.isFetching && <ActivityIndicator color={colors.primary} />}
      {lookup.isError && <Banner icon="error" tone="danger" title="Không tìm thấy đơn" text={apiErrorMessage(lookup.error, 'Mã đơn hoặc token QR không hợp lệ.')} />}

      {booking && (
        <Card>
          <CardHead icon="bed" title={`Đơn #${booking.code}`} right={<Chip label={bookingStatusLabel[booking.status]} tone={canCheckOut ? 'secondary' : 'neutral'} />} />
          <Text variant="label" weight="bold">
            {booking.guestName}
          </Text>
          <View className={s.box}>
            <KV label="Phòng" value={booking.assignedRooms.map((r) => r.roomNumber).join(', ') || '—'} strong color={accent} />
            <KV label="Hạng phòng" value={booking.roomType.name} />
            <KV label="Lưu trú" value={`${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)} (${booking.nights} đêm)`} />
          </View>
        </Card>
      )}

      {booking && !canCheckOut && !checkOut.isSuccess && (
        <Banner icon="info" tone="amber" title="Đơn chưa thể check-out" text="Chỉ đơn đang lưu trú (đã check-in) mới check-out được." />
      )}

      {canCheckOut && !checkOut.isSuccess && (
        <Card>
          <CardHead icon="receipt_long" title="Quyết toán" />
          {quote.isPending && <ActivityIndicator color={colors.primary} />}
          {quote.isError && <Text variant="small" color={colors.error}>{apiErrorMessage(quote.error, 'Không tải được báo giá trả phòng.')}</Text>}
          {quote.data && (
            <>
              <KV label="Đã thanh toán qua StayReco" value={formatVnd(quote.data.amountPaid)} strong color={success} />
              <KV label="Giờ trả phòng dự kiến" value={new Date(quote.data.scheduledAt).toLocaleString('vi-VN')} />
              {quote.data.early && (
                <Banner
                  icon="schedule"
                  tone="blue"
                  title="Trả phòng sớm"
                  text={`Các đêm ${quote.data.releasedNights.map(formatDate).join(', ')} được mở bán lại, không hoàn tiền.`}
                />
              )}
              {quote.data.lateFee ? (
                <>
                  <KV label={`Trả muộn ${quote.data.minutesLate} phút (${quote.data.lateFee.percent}% giá đêm)`} value={formatVnd(computed)} strong color={accent} />
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    Phí thu tại quầy, không qua StayReco. Để trống để thu đúng phí, hoặc nhập số thấp hơn kèm lý do.
                  </Text>
                  <Input label="Phí thu thực tế (₫)" keyboardType="number-pad" placeholder={`${computed}`} value={fee} onChangeText={setFee} />
                  {lowered && <Input label="Lý do giảm phí *" placeholder="Ví dụ: khách VIP, lỗi từ khách sạn…" value={reason} onChangeText={setReason} />}
                  {!feeValid && (
                    <Text variant="caption" color={colors.error}>
                      Phí phải là số không vượt quá {formatVnd(computed)} và cần có lý do.
                    </Text>
                  )}
                </>
              ) : (
                <KV label="Phí trả muộn" value="Không có" />
              )}
            </>
          )}
          {checkOut.isError && <Text variant="small" color={colors.error}>{apiErrorMessage(checkOut.error, 'Check-out không thành công.')}</Text>}
        </Card>
      )}

      <SuccessSheet
        visible={checkOut.isSuccess}
        onClose={() => router.back()}
        title="Check-out hoàn tất!"
        text="Phòng đã chuyển sang trạng thái cần dọn dẹp."
        printLabel="Đóng"
        rows={
          <>
            <KV label="Mã đặt phòng" value={`#${booking?.code ?? ''}`} strong />
            <KV label="Phí trả muộn đã thu" value={formatVnd(checkOut.data?.lateCheckout?.fee ?? 0)} strong color={accent} />
          </>
        }
      />
    </StaffScreen>
  );
}
