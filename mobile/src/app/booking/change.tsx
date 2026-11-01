import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { BOOKING_LIMITS, changeRequestSchema, type Booking, type ChangeRequestInput } from '@stayreco/shared';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { formatDate } from '@/lib/stay';
import { getBooking, requestChange } from '@/services/bookings.service';

type ApiError = AxiosError<{ code?: string; message?: string }>;

const errorText: Record<string, string> = {
  BOOKING_STATUS_CONFLICT: 'Chỉ đổi được thông tin khi đơn đã xác nhận và chưa nhận phòng.',
  REFUND_DECISION_PENDING: 'Đơn đang chờ khách sạn duyệt hoàn tiền, chưa gửi yêu cầu đổi được.',
  CHANGE_REQUEST_PENDING: 'Bạn đã có một yêu cầu đang chờ khách sạn duyệt.',
};

/** Chỉ gửi các trường khác với đơn; ô để trống ở giờ đến / yêu cầu đặc biệt nghĩa là xóa. */
function diffChanges(b: Booking, form: Record<keyof ChangeRequestInput, string>): Partial<ChangeRequestInput> {
  const out: Partial<ChangeRequestInput> = {};
  if (form.guestName.trim() !== b.guestName) out.guestName = form.guestName;
  if (form.contactPhone.trim() !== b.contactPhone) out.contactPhone = form.contactPhone;
  const arrival = form.arrivalTime.trim() || null;
  if (arrival !== b.arrivalTime) out.arrivalTime = arrival;
  const special = form.specialRequests.trim() || null;
  if (special !== b.specialRequests) out.specialRequests = special;
  return out;
}

export default function ChangeBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const booking = useQuery({ queryKey: ['bookings', id], queryFn: () => getBooking(id), enabled: !!id });
  const [form, setForm] = useState({ guestName: '', contactPhone: '', arrivalTime: '', specialRequests: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const b = booking.data;

  useEffect(() => {
    if (b)
      setForm({
        guestName: b.guestName,
        contactPhone: b.contactPhone,
        arrivalTime: b.arrivalTime ?? '',
        specialRequests: b.specialRequests ?? '',
      });
  }, [b]);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!b) return;
    const changes = diffChanges(b, form);
    if (Object.keys(changes).length === 0) {
      setError('Bạn chưa thay đổi thông tin nào.');
      return;
    }
    const input = changeRequestSchema.safeParse(changes);
    if (!input.success) {
      const field = input.error.issues[0]?.path[0];
      setError(
        field === 'contactPhone'
          ? 'Số điện thoại không hợp lệ.'
          : field === 'arrivalTime'
            ? 'Giờ đến cần theo dạng HH:mm, ví dụ 14:30.'
            : field === 'guestName'
              ? 'Vui lòng nhập tên khách.'
              : 'Thông tin chưa hợp lệ.',
      );
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await requestChange(id, input.data);
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert('Đã gửi yêu cầu', 'Khách sạn sẽ xem xét và báo lại cho bạn qua email và thông báo.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const body = (err as ApiError).response?.data;
      setError((body?.code && errorText[body.code]) || body?.message || 'Không gửi được yêu cầu. Vui lòng thử lại.');
      void queryClient.invalidateQueries({ queryKey: ['bookings', id] });
    } finally {
      setSubmitting(false);
    }
  };

  if (!b) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Đổi thông tin đơn" />
        <View style={styles.state}>
          <Text variant="small" color={colors.onSurfaceVariant} center>
            {booking.isError || !id ? 'Không tải được thông tin đơn.' : 'Đang tải...'}
          </Text>
        </View>
      </View>
    );
  }

  const pending = b.changeRequest?.status === 'PENDING';
  const rejected = b.changeRequest?.status === 'REJECTED' ? b.changeRequest : null;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Đổi thông tin đơn" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant}>
            MÃ ĐƠN: {b.code}
          </Text>
          <Text variant="h3">{b.hotel.name}</Text>
          <Text variant="small" color={colors.onSurfaceVariant}>
            {formatDate(b.checkIn)} - {formatDate(b.checkOut)} • Ngày ở và hạng phòng không đổi được.
          </Text>
        </View>

        {pending && (
          <View style={[styles.banner, styles.row]}>
            <Icon name="hourglass_top" size={20} color={colors.secondary} />
            <Text variant="small" style={styles.flex}>
              Yêu cầu gửi lúc {new Date(b.changeRequest!.requestedAt).toLocaleString('vi-VN')} đang chờ khách sạn duyệt.
            </Text>
          </View>
        )}
        {rejected && (
          <View style={[styles.banner, styles.row]}>
            <Icon name="info" size={20} color={colors.error} />
            <Text variant="small" style={styles.flex}>
              Khách sạn đã từ chối yêu cầu trước{rejected.reason ? `: ${rejected.reason}` : '.'}
            </Text>
          </View>
        )}

        <Input label="Tên khách nhận phòng" icon="person" value={form.guestName} onChangeText={set('guestName')} editable={!pending} />
        <Input
          label="Số điện thoại liên hệ"
          icon="call"
          keyboardType="phone-pad"
          value={form.contactPhone}
          onChangeText={set('contactPhone')}
          editable={!pending}
        />
        <Input
          label="Giờ đến dự kiến (HH:mm)"
          icon="schedule"
          placeholder="Ví dụ 14:30"
          value={form.arrivalTime}
          onChangeText={set('arrivalTime')}
          editable={!pending}
        />
        <Input
          label="Yêu cầu đặc biệt"
          icon="edit_note"
          multiline
          maxLength={BOOKING_LIMITS.specialRequestsMax}
          value={form.specialRequests}
          onChangeText={set('specialRequests')}
          editable={!pending}
        />
        {!!error && (
          <Text variant="small" color={colors.error}>
            {error}
          </Text>
        )}
        {!pending && (
          <Button
            label={submitting ? 'Đang gửi...' : 'Gửi yêu cầu cho khách sạn'}
            leadingIcon="send"
            size="lg"
            disabled={submitting}
            onPress={() => void submit()}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  card: { padding: 16, gap: 6, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  banner: { padding: 14, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerHigh },
});
