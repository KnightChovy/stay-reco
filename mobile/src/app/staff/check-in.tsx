import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import { Banner, Card, CardHead, KV, StaffScreen, SuccessSheet, accent, s, useStaffHotel } from '@/features/staff/ui';
import { bookingStatusLabel, formatDate, formatVnd } from '@/lib/stay';
import { apiErrorMessage } from '@/services/ApiService';
import { checkInBooking, getRoomOptions, lookupBooking, toLookup } from '@/services/staff.service';

export default function StaffCheckInScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const { hotelId } = useStaffHotel();
  const queryClient = useQueryClient();
  const [input, setInput] = useState(params.code ?? '');
  const [query, setQuery] = useState(params.code?.trim() || '');
  const [chosen, setChosen] = useState<string[] | null>(null);

  const lookup = useQuery({
    queryKey: ['staff', 'lookup', hotelId, query],
    queryFn: () => lookupBooking(hotelId!, toLookup(query)),
    enabled: !!hotelId && !!query,
    retry: false,
  });
  const booking = lookup.data;
  const checkIn = useMutation({
    mutationFn: (roomIds: string[]) => checkInBooking(booking!.id, { roomIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
  const canCheckIn = booking?.status === 'CONFIRMED' && booking.paymentStatus === 'PAID';
  // Sau khi check-in xong đơn là CHECKED_IN, gọi lại room-options sẽ trả 409.
  const options = useQuery({
    queryKey: ['staff', 'room-options', booking?.id],
    queryFn: () => getRoomOptions(booking!.id),
    enabled: !!canCheckIn && !checkIn.isSuccess,
  });

  // Ưu tiên phòng đang giữ mà đã sẵn sàng (phòng giữ có thể còn CLEANING), thiếu thì lấy phòng trống cùng hạng.
  const defaults = booking
    ? [
        ...(options.data?.held.filter((r) => r.status === 'AVAILABLE').map((r) => r.id) ?? []),
        ...(options.data?.available.map((r) => r.id) ?? []),
      ].slice(0, booking.rooms)
    : [];
  const selected = chosen ?? defaults;
  const ready = !!booking && selected.length === booking.rooms;
  const rooms = [...(options.data?.held ?? []), ...(options.data?.available ?? [])];
  const roomNumbers = rooms.filter((r) => selected.includes(r.id)).map((r) => r.roomNumber);

  const search = () => {
    const value = input.trim();
    if (!value) return;
    setChosen(null);
    checkIn.reset();
    setQuery(value);
  };
  const toggle = (id: string) => {
    if (!booking) return;
    if (selected.includes(id)) setChosen(selected.filter((x) => x !== id));
    else if (selected.length < booking.rooms) setChosen([...selected, id]);
  };

  return (
    <StaffScreen
      title="Check-in & gán phòng"
      right={
        booking ? (
          <Button label="Chi tiết đơn" variant="ghost" size="sm" onPress={() => router.push({ pathname: '/staff/bookings/[id]', params: { id: booking.id } })} />
        ) : undefined
      }
      footer={
        canCheckIn && !checkIn.isSuccess ? (
          <Button
            label={checkIn.isPending ? 'Đang check-in…' : 'Hoàn tất check-in'}
            leadingIcon="check_circle"
            size="lg"
            disabled={!ready || checkIn.isPending}
            style={[s.flex, { backgroundColor: accent }]}
            onPress={() => checkIn.mutate(selected)}
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
        <Button label="Tìm đơn" leadingIcon="qr_code_scanner" disabled={!input.trim() || !hotelId} onPress={search} style={{ backgroundColor: accent }} />
        <Text variant="caption" color={colors.onSurfaceVariant}>
          Có thể nhập mã không dấu gạch, ví dụ SR2610311234. Chỉ check-in được từ ngày nhận phòng đến trước ngày trả phòng.
        </Text>
      </Card>

      {lookup.isFetching && <ActivityIndicator color={colors.primary} />}
      {lookup.isError && <Banner icon="error" tone="danger" title="Không tìm thấy đơn" text={apiErrorMessage(lookup.error, 'Mã đơn hoặc token QR không hợp lệ.')} />}

      {booking && (
        <>
          <Card>
            <CardHead icon="person" title={`Đơn #${booking.code}`} right={<Chip label={bookingStatusLabel[booking.status]} tone={canCheckIn ? 'primary' : 'neutral'} />} />
            <Text variant="label" weight="bold">
              {booking.guestName}
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              SĐT: {booking.contactPhone}
              {booking.arrivalTime ? ` · Đến khoảng ${booking.arrivalTime}` : ''}
            </Text>
            <View style={s.box}>
              <KV label="Hạng phòng" value={booking.roomType.name} strong />
              <KV label="Lưu trú" value={`${booking.nights} đêm (${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)})`} />
              <KV label="Số khách / phòng" value={`${booking.guests} khách · ${booking.rooms} phòng`} />
              <KV label="Tổng tiền" value={formatVnd(booking.totalAmount)} strong />
            </View>
            {!!booking.specialRequests && <Text variant="small">Yêu cầu: {booking.specialRequests}</Text>}
          </Card>

          {!canCheckIn && !checkIn.isSuccess && (
            <Banner
              icon="info"
              tone="amber"
              title="Đơn chưa thể check-in"
              text={booking.paymentStatus === 'REFUND_PENDING' ? 'Đơn đang chờ quyết định hoàn tiền; khách sạn cần xử lý trước.' : 'Chỉ đơn đã xác nhận và đã thanh toán mới check-in được.'}
            />
          )}

          {canCheckIn && !checkIn.isSuccess && (
            <Card>
              <CardHead icon="apartment" title={`Chọn ${booking.rooms} phòng (${selected.length}/${booking.rooms})`} />
              {options.isPending && <ActivityIndicator color={colors.primary} />}
              {options.isError && <Text variant="small" color={colors.error}>{apiErrorMessage(options.error, 'Không tải được danh sách phòng.')}</Text>}
              {options.data && rooms.length === 0 && (
                <Text variant="small" color={colors.onSurfaceVariant}>
                  Không còn phòng trống thuộc hạng này.
                </Text>
              )}
              {rooms.map((r) => {
                const on = selected.includes(r.id);
                const held = options.data?.held.some((h) => h.id === r.id);
                return (
                  <Pressable
                    key={r.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`Phòng ${r.roomNumber}`}
                    onPress={() => toggle(r.id)}
                    style={[styles.room, on && styles.roomOn]}
                  >
                    <Icon name={on ? 'check_box' : 'check_box_outline_blank'} color={on ? accent : colors.outline} />
                    <Text variant="label" weight="bold" style={s.flex}>
                      {r.roomNumber}
                    </Text>
                    {held && <Chip label="Đang giữ" tone="primary" />}
                    <Chip label={r.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Đang dọn'} tone={r.status === 'AVAILABLE' ? 'tertiary' : 'warning'} />
                  </Pressable>
                );
              })}
              {checkIn.isError && <Text variant="small" color={colors.error}>{apiErrorMessage(checkIn.error, 'Check-in không thành công.')}</Text>}
            </Card>
          )}
        </>
      )}

      <SuccessSheet
        visible={checkIn.isSuccess}
        onClose={() => router.back()}
        title="Check-in thành công!"
        text={`Đã gán phòng cho khách ${booking?.guestName ?? ''}.`}
        printLabel="Đóng"
        rows={
          <>
            <KV label="Mã đặt phòng" value={`#${booking?.code ?? ''}`} strong />
            <KV label="Phòng đã gán" value={(checkIn.data?.assignedRooms.map((r) => r.roomNumber) ?? roomNumbers).join(', ')} strong color={accent} />
          </>
        }
      />
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  room: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.surfaceContainerHigh },
  roomOn: { borderWidth: 2, borderColor: accent, backgroundColor: '#fbf3f0' },
});
