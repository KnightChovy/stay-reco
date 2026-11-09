import { useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
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
import { colors } from '@/constants/theme';
import { BookingProgress } from '@/features/booking/BookingProgress';
import { PriceLine } from '@/features/booking/PriceLine';
import { images } from '@/lib/mock-data';
import { formatDate, formatVnd, nightsBetween, stayFromParams } from '@/lib/stay';
import { createBooking } from '@/services/bookings.service';
import { hotelListingQuery } from '@/services/stays.service';
import { useAuthStore } from '@/stores/auth.store';

function CardTitle({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name={icon} size={20} color={colors.primaryContainer} />
      <Text variant="label" weight="bold" style={{ fontSize: 16, flexShrink: 1 }}>
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
      <View className="flex-1 bg-surface">
        <ScreenHeader title="Thông Tin Đặt Phòng" />
        <View className="flex-1 items-center justify-center gap-3 p-6">
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
      <View className="flex-1 bg-surface">
        <ScreenHeader title="Thông Tin Đặt Phòng" />
        <View className="flex-1 items-center justify-center gap-3 p-6">
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
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Thông Tin Đặt Phòng" />
      <BookingProgress current={1} />

      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" showsVerticalScrollIndicator={false}>
        <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <View className="flex-row items-center gap-2">
            <View>
              <Image
                source={room.roomType.images[0]?.url ?? hotel.images[0]?.url ?? images.bookingThumb}
                className="h-[84px] w-[84px] rounded-md"
                contentFit="cover"
              />
              {hotel.starRating != null && (
                <View className="absolute left-1.5 top-1.5 rounded-sm bg-primary-container px-1.5 py-0.5">
                  <Text variant="caption" weight="bold" color={colors.white}>
                    {hotel.starRating} Sao
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-1 gap-1">
              <View className="flex-row items-center gap-2">
                <Icon name="location_on" size={14} color={colors.secondary} />
                <Text variant="caption" color={colors.secondary} className="flex-1">
                  {hotel.city}
                </Text>
              </View>
              <Text variant="h3">{hotel.name}</Text>
              <View className="flex-row items-center gap-2">
                <Icon name="bed" size={14} color={colors.onSurfaceVariant} />
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {room.roomType.name}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row gap-3 rounded-md bg-surface-container-low p-3">
            <View className="flex-1">
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Nhận phòng
              </Text>
              <Text variant="label" weight="bold">
                {hotel.checkInTime ? `${hotel.checkInTime} • ` : ''}
                {formatDate(stay.checkIn)}
              </Text>
            </View>
            <View className="flex-1">
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
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2">
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

        <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
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

        <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <CardTitle icon="hotel_class" title="Yêu cầu đặc biệt" />
          <TextInput
            multiline
            maxLength={500}
            accessibilityLabel="Ghi chú thêm cho lễ tân"
            placeholder="Ví dụ: Giờ bay dự kiến, phòng tầng cao, dịp kỷ niệm..."
            placeholderTextColor={colors.outline}
            value={requests}
            onChangeText={setRequests}
            className="min-h-20 rounded-md bg-surface-container-low p-3 font-be-regular text-sm text-on-surface"
          />
        </View>

        <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <Text variant="h3">Chi tiết giá</Text>
          {offer.nightlyPrices.map((n) => (
            <PriceLine
              key={n.date}
              label={`Đêm ${formatDate(n.date)}${stay.rooms > 1 ? ` × ${stay.rooms} phòng` : ''}`}
              value={formatVnd(n.price * stay.rooms)}
            />
          ))}
          <PriceLine label="Thuế VAT & Phí phục vụ" value="Đã bao gồm" />
          <View className="h-px bg-surface-container-high" />
          <View className="flex-row items-center justify-between gap-2">
            <Text variant="label" weight="bold">
              Tổng tiền thanh toán
            </Text>
            <Text variant="price" color={colors.primary}>
              {formatVnd(offer.total)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2 rounded-lg bg-tertiary-fixed p-4">
          <Icon name="event_available" size={22} color={colors.tertiaryContainer} />
          <View className="flex-1">
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

        <View className="flex-row items-center gap-2" style={{ alignItems: 'flex-start' }}>
          <Checkbox checked={agreed} onChange={setAgreed} />
          <Text variant="caption" color={colors.onSurfaceVariant} className="flex-1">
            Tôi đã đọc và đồng ý với Điều khoản dịch vụ, chính sách lưu trú của {hotel.name} và quy chuẩn bảo mật StayReco.
          </Text>
        </View>
        {!!error && (
          <Text variant="small" color={colors.error}>
            {error}
          </Text>
        )}
      </ScrollView>

      <View className="flex-row items-center gap-3 border-t border-surface-container-high bg-surface-container-lowest px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
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
          className="flex-1" style={{ minHeight: 52 }}
          disabled={!agreed || submitting}
          onPress={() => void submit(offer.total)}
        />
      </View>
    </View>
  );
}
