import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AxiosError } from 'axios';
import { createBookingSchema, type ErrorDetail } from '@stayreco/shared';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors, fonts, radius, shadow } from '@/constants/theme';
import { BookingProgress } from '@/features/booking/BookingProgress';
import { PriceLine } from '@/features/booking/PriceLine';
import { images } from '@/lib/mock-data';
import { formatDate, formatVnd, nightsBetween, stayFromParams } from '@/lib/stay';
import { createBooking } from '@/services/bookings.service';
import { hotelListingQuery } from '@/services/stays.service';
import { useAuthStore } from '@/stores/auth.store';

function CardTitle({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={20} color={colors.primaryContainer} />
      <Text variant="label" weight="bold" style={styles.cardTitle}>
        {title}
      </Text>
    </View>
  );
}

type ApiError = AxiosError<{ code?: string; message?: string; details?: ErrorDetail[] }>;

export default function BookingInfoScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ hotelId: string; roomTypeId: string }>();
  const stay = stayFromParams(params);
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const account = useAuthStore((s) => s.account);
  const hydrating = useAuthStore((s) => s.hydrating);
  const queryClient = useQueryClient();
  const { data, isError, refetch } = useQuery(hotelListingQuery(params.hotelId, stay));
  const room = data?.roomTypes.find((r) => r.roomType.id === params.roomTypeId);
  const offer = room?.offer;

  // Chưa sửa thì lấy theo tài khoản, kể cả khi khách đăng nhập sau khi đã mở màn này.
  const [nameInput, setName] = useState<string>();
  const [phoneInput, setPhone] = useState<string>();
  const name = nameInput ?? account?.fullName ?? '';
  const phone = phoneInput ?? account?.phone ?? '';
  const [requests, setRequests] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (expectedTotal: number) => {
    const input = createBookingSchema.safeParse({
      roomTypeId: params.roomTypeId,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      guests: stay.guests,
      rooms: stay.rooms,
      guestName: name,
      contactPhone: phone,
      ...(requests.trim() ? { specialRequests: requests } : {}),
      expectedTotal,
    });
    if (!input.success) {
      setError('Vui lòng nhập họ tên và số điện thoại hợp lệ.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const booking = await createBooking(input.data);
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      router.replace({ pathname: '/booking/payment', params: { id: booking.id } });
    } catch (err) {
      const body = (err as ApiError).response?.data;
      if (body?.code === 'BOOKING_PRICE_CHANGED') {
        // MSG13: backend trả tổng mới trong details; khách đồng ý thì gửi lại với tổng đó.
        const newTotal = Number(body.details?.find((d) => d.field === 'expectedTotal')?.message);
        // Tải lại giá để chi tiết giá và tổng tiền trên màn hiện theo giá mới.
        void queryClient.invalidateQueries({ queryKey: ['stays', 'hotel', params.hotelId] });
        Alert.alert('Giá phòng đã thay đổi', `Tổng tiền mới là ${formatVnd(newTotal)}. Bạn có muốn tiếp tục đặt phòng?`, [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đặt với giá mới', onPress: () => void submit(newTotal) },
        ]);
      } else if (body?.code === 'ROOM_SOLD_OUT') {
        setError('Rất tiếc, hạng phòng này vừa hết phòng cho ngày bạn chọn. Vui lòng chọn phòng khác.');
        void queryClient.invalidateQueries({ queryKey: ['stays', 'hotel', params.hotelId] });
      } else {
        setError(body?.message || 'Không đặt được phòng. Vui lòng kiểm tra kết nối và thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!account) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Thông Tin Đặt Phòng" />
        <View style={styles.state}>
          <Text variant="small" color={colors.onSurfaceVariant} center>
            {hydrating ? 'Đang tải...' : 'Vui lòng đăng nhập để đặt phòng.'}
          </Text>
          {!hydrating && <Button label="Đăng nhập" leadingIcon="login" onPress={() => router.push('/login')} />}
        </View>
      </View>
    );
  }

  if (!data || !room || !offer) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Thông Tin Đặt Phòng" />
        <View style={styles.state}>
          <Text variant="small" color={colors.onSurfaceVariant} center>
            {data
              ? 'Hạng phòng này không còn mở bán cho ngày bạn chọn.'
              : isError
                ? 'Không tải được giá phòng. Vui lòng kiểm tra kết nối.'
                : 'Đang tải...'}
          </Text>
          {!data && isError && (
            <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => refetch()} />
          )}
        </View>
      </View>
    );
  }

  const { hotel } = data;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Thông Tin Đặt Phòng" />
      <BookingProgress current={1} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Image
                source={room.roomType.images[0]?.url ?? hotel.images[0]?.url ?? images.bookingThumb}
                style={styles.thumb}
                contentFit="cover"
              />
              {hotel.starRating != null && (
                <View style={styles.thumbTag}>
                  <Text variant="caption" weight="bold" color={colors.white}>
                    {hotel.starRating} Sao
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.flex, styles.gap4]}>
              <View style={styles.row}>
                <Icon name="location_on" size={14} color={colors.secondary} />
                <Text variant="caption" color={colors.secondary} style={styles.flex}>
                  {hotel.city}
                </Text>
              </View>
              <Text variant="h3">{hotel.name}</Text>
              <View style={styles.row}>
                <Icon name="bed" size={14} color={colors.onSurfaceVariant} />
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {room.roomType.name}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.dates}>
            <View style={styles.flex}>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Nhận phòng
              </Text>
              <Text variant="label" weight="bold">
                {hotel.checkInTime ? `${hotel.checkInTime} • ` : ''}
                {formatDate(stay.checkIn)}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Trả phòng
              </Text>
              <Text variant="label" weight="bold">
                {hotel.checkOutTime ? `${hotel.checkOutTime} • ` : ''}
                {formatDate(stay.checkOut)}
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {nights} đêm
              </Text>
            </View>
          </View>
          <View style={styles.between}>
            <View style={styles.row}>
              <Icon name="group" size={18} color={colors.onSurfaceVariant} />
              <Text variant="small" color={colors.onSurfaceVariant}>
                Số lượng khách:
              </Text>
            </View>
            <Text variant="small" weight="bold">
              {stay.guests} khách ({stay.rooms} phòng)
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <CardTitle icon="person_pin" title="Thông tin người liên hệ" />
          <Input label="Họ và tên khách" placeholder="Nhập họ và tên có dấu" value={name} onChangeText={setName} />
          <Input
            label="Số điện thoại di động"
            placeholder="0912 xxx xxx"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Xác nhận đặt phòng sẽ gửi tới {account.email}
          </Text>
        </View>

        <View style={styles.card}>
          <CardTitle icon="hotel_class" title="Yêu cầu đặc biệt" />
          <TextInput
            multiline
            maxLength={500}
            accessibilityLabel="Ghi chú thêm cho lễ tân"
            placeholder="Ví dụ: Giờ bay dự kiến, phòng tầng cao, dịp kỷ niệm..."
            placeholderTextColor={colors.outline}
            value={requests}
            onChangeText={setRequests}
            style={styles.textarea}
          />
        </View>

        <View style={styles.card}>
          <Text variant="h3">Chi tiết giá</Text>
          {offer.nightlyPrices.map((n) => (
            <PriceLine
              key={n.date}
              label={`Đêm ${formatDate(n.date)}${stay.rooms > 1 ? ` × ${stay.rooms} phòng` : ''}`}
              value={formatVnd(n.price * stay.rooms)}
            />
          ))}
          <PriceLine label="Thuế VAT & Phí phục vụ" value="Đã bao gồm" />
          <View style={styles.divider} />
          <View style={styles.between}>
            <Text variant="label" weight="bold">
              Tổng tiền thanh toán
            </Text>
            <Text variant="price" color={colors.primary}>
              {formatVnd(offer.total)}
            </Text>
          </View>
        </View>

        <View style={[styles.policy, styles.row]}>
          <Icon name="event_available" size={22} color={colors.tertiaryContainer} />
          <View style={styles.flex}>
            <Text variant="small" weight="bold" color={colors.tertiary}>
              Chính sách hủy
            </Text>
            <Text variant="caption" color={colors.tertiary}>
              {offer.freeCancellationUntil
                ? `Miễn phí hủy phòng trước ${new Date(offer.freeCancellationUntil).toLocaleString('vi-VN')}. Sau đó phí hủy ${offer.cancellationFeePercent}%.`
                : `Phí hủy ${offer.cancellationFeePercent}% tổng tiền.`}
            </Text>
          </View>
        </View>

        <View style={[styles.row, styles.terms]}>
          <Checkbox checked={agreed} onChange={setAgreed} />
          <Text variant="caption" color={colors.onSurfaceVariant} style={styles.flex}>
            Tôi đã đọc và đồng ý với Điều khoản dịch vụ, chính sách lưu trú của {hotel.name} và quy chuẩn bảo mật StayReco.
          </Text>
        </View>
        {!!error && (
          <Text variant="small" color={colors.error}>
            {error}
          </Text>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Tổng tiền ({nights} đêm)
          </Text>
          <Text variant="h3" weight="bold" color={colors.primary}>
            {formatVnd(offer.total)}
          </Text>
        </View>
        <Button
          label={submitting ? 'Đang giữ phòng...' : 'Giữ phòng & thanh toán'}
          leadingIcon="lock"
          size="sm"
          style={[styles.flex, styles.cta]}
          disabled={!agreed || submitting}
          onPress={() => void submit(offer.total)}
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
  gap4: { gap: 4 },
  cta: { minHeight: 52 },
  cardTitle: { fontSize: 16, flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  card: { padding: 16, gap: 12, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  thumb: { width: 84, height: 84, borderRadius: radius.md },
  thumbTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryContainer,
  },
  dates: { flexDirection: 'row', padding: 12, gap: 12, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
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
  divider: { height: 1, backgroundColor: colors.surfaceContainerHigh },
  policy: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.tertiaryFixed, alignItems: 'flex-start' },
  terms: { alignItems: 'flex-start' },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
});
