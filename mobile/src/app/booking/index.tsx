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
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { BookingProgress } from '@/features/booking/BookingProgress';
import { PriceLine } from '@/features/booking/PriceLine';
import { images } from '@/lib/mock-data';
import { formatDate, formatVnd, nightsBetween, stayFromParams } from '@/lib/stay';
import { createBooking } from '@/services/bookings.service';
import { getDiscountQuote, getMyVouchers } from '@/services/rewards.service';
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

const codeErrors: Record<string, string> = {
  VOUCHER_NOT_FOUND: 'Mã giảm giá không tồn tại.',
  VOUCHER_ALREADY_USED: 'Mã này đã được dùng cho một đơn khác.',
  VOUCHER_EXPIRED: 'Mã này đã hết hạn.',
  VOUCHER_NOT_APPLICABLE: 'Mã không áp dụng cho khách sạn hoặc giá trị đơn này.',
};

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
  const [codeInput, setCodeInput] = useState('');
  const [code, setCode] = useState<string>();
  const [codeError, setCodeError] = useState('');
  const [applying, setApplying] = useState(false);
  const [usePoints, setUsePoints] = useState(false);

  // Backend tính giảm giá và điểm (BR-06, BR-11); app chỉ hiển thị và gửi lại đúng expectedTotal.
  const quoteQuery = (pointsToUse: number, withCode = code) => ({
    queryKey: ['discount-quote', params.roomTypeId, stay.checkIn, stay.checkOut, stay.rooms, withCode ?? null, pointsToUse],
    queryFn: () =>
      getDiscountQuote({
        roomTypeId: params.roomTypeId,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        rooms: stay.rooms,
        ...(withCode ? { code: withCode } : {}),
        ...(pointsToUse ? { pointsToUse } : {}),
      }),
  });
  const baseQuote = useQuery({ ...quoteQuery(0), enabled: !!account && !!offer });
  const maxPoints = baseQuote.data?.points?.maxPointsUsable ?? 0;
  // Mặc định dùng tối đa; khách gõ số khác thì giữ số đó nhưng không vượt mức tối đa của báo giá hiện tại.
  const [chosenPoints, setChosenPoints] = useState<number>();
  const [pointsInput, setPointsInput] = useState<string>();
  const pointsToUse = usePoints ? Math.min(chosenPoints ?? maxPoints, maxPoints) : 0;
  const pointsQuote = useQuery({ ...quoteQuery(pointsToUse), enabled: !!account && pointsToUse > 0 });
  const quote = pointsToUse > 0 ? pointsQuote.data : baseQuote.data;
  const total = quote?.expectedTotal ?? offer?.total ?? 0;
  const commitPoints = () => {
    if (pointsInput === undefined) return;
    const n = Number.parseInt(pointsInput.replace(/\D/g, ''), 10);
    setChosenPoints(Number.isNaN(n) ? undefined : Math.max(0, Math.min(n, maxPoints)));
    setPointsInput(undefined);
  };

  // shortcut: gợi ý 20 voucher còn dùng được đầu tiên, đủ cho màn đặt phòng; danh sách đầy đủ ở Điểm thưởng.
  const myVouchers = useQuery({
    queryKey: ['vouchers', 'active', 'suggest'],
    queryFn: () => getMyVouchers({ active: true, page: 1, pageSize: 20 }),
    enabled: !!account,
  });
  // Voucher của khách sạn khác sẽ bị từ chối (VOUCHER_NOT_APPLICABLE), nên chỉ gợi ý voucher dùng được ở đây.
  const suggestions = myVouchers.data?.vouchers.filter((v) => v.hotelId === null || v.hotelId === params.hotelId) ?? [];

  const applyCode = async (raw = codeInput) => {
    const typed = raw.trim().toUpperCase();
    if (!typed) return;
    setCodeError('');
    setApplying(true);
    try {
      await queryClient.fetchQuery(quoteQuery(0, typed));
      setCode(typed);
    } catch (err) {
      const body = (err as ApiError).response?.data;
      setCodeError((body?.code && codeErrors[body.code]) || body?.message || 'Không kiểm tra được mã. Vui lòng thử lại.');
    } finally {
      setApplying(false);
    }
  };
  const removeCode = () => {
    setCode(undefined);
    setCodeInput('');
    setCodeError('');
  };

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
      ...(code ? { code } : {}),
      ...(usePoints && quote?.points?.pointsUsed ? { pointsToUse: quote.points.pointsUsed } : {}),
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
        void queryClient.invalidateQueries({ queryKey: ['discount-quote'] });
        Alert.alert('Giá phòng đã thay đổi', `Tổng tiền mới là ${formatVnd(newTotal)}. Bạn có muốn tiếp tục đặt phòng?`, [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đặt với giá mới', onPress: () => void submit(newTotal) },
        ]);
      } else if (body?.code && codeErrors[body.code]) {
        // Mã vừa hết lượt / hết hạn giữa lúc báo giá và lúc đặt.
        removeCode();
        setCodeError(codeErrors[body.code]);
      } else if (body?.code === 'LOYALTY_POINTS_INSUFFICIENT') {
        setUsePoints(false);
        void queryClient.invalidateQueries({ queryKey: ['discount-quote'] });
        setError('Số điểm StayMiles không còn đủ. Vui lòng kiểm tra lại tổng tiền.');
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
          {quote?.discount && (
            <PriceLine
              icon="sell"
              tone={colors.tertiary}
              label={quote.discount.code ? `Mã ${quote.discount.code}` : quote.discount.name}
              value={`-${formatVnd(quote.discount.amount)}`}
            />
          )}
          {usePoints && !!quote?.points?.amount && (
            <PriceLine
              icon="stars"
              tone={colors.tertiary}
              label={`${quote.points.pointsUsed.toLocaleString('vi-VN')} điểm StayMiles`}
              value={`-${formatVnd(quote.points.amount)}`}
            />
          )}
          <View className="h-px bg-surface-container-high" />
          <View className="flex-row items-center justify-between gap-2">
            <Text variant="label" weight="bold">
              Tổng tiền thanh toán
            </Text>
            <Text variant="price" color={colors.primary}>
              {formatVnd(total)}
            </Text>
          </View>
        </View>

        <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <CardTitle icon="sell" title="Ưu đãi" />
          {code ? (
            <View className="flex-row items-center justify-between gap-2 rounded-md bg-surface-container-low p-3">
              <Text variant="small" weight="bold" className="flex-1">
                Đã áp dụng mã {code}
              </Text>
              <Button label="Bỏ mã" variant="ghost" size="sm" onPress={removeCode} />
            </View>
          ) : (
            <View className="flex-row items-end gap-2">
              <View className="flex-1">
                <Input
                  placeholder="Nhập mã giảm giá"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  value={codeInput}
                  onChangeText={setCodeInput}
                />
              </View>
              <Button
                label={applying ? 'Đang kiểm tra...' : 'Áp dụng'}
                variant="secondary"
                style={{ minHeight: 52 }}
                disabled={applying || !codeInput.trim()}
                onPress={() => void applyCode()}
              />
            </View>
          )}
          {!code && suggestions.length > 0 && (
            <View className="gap-2">
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Voucher của bạn dùng được ở đây:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {suggestions.map((v) => (
                  <Chip
                    key={v.id}
                    icon="confirmation_number"
                    label={`${v.code} • ${v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : formatVnd(v.discountValue)}`}
                    tone="outline"
                    onPress={
                      applying
                        ? undefined
                        : () => {
                            setCodeInput(v.code);
                            void applyCode(v.code);
                          }
                    }
                  />
                ))}
              </View>
            </View>
          )}
          {!!codeError && (
            <Text variant="caption" color={colors.error}>
              {codeError}
            </Text>
          )}
          {!code && quote?.discount?.kind === 'PROMOTION' && (
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Đang tự áp dụng khuyến mãi {quote.discount.name}. Mã giảm giá chỉ được dùng khi giảm nhiều hơn.
            </Text>
          )}
          {maxPoints > 0 && (
            <View className="flex-row items-center gap-2">
              <Checkbox checked={usePoints} onChange={setUsePoints} />
              <Text variant="small" className="flex-1">
                Dùng điểm StayMiles (đang có {baseQuote.data!.points!.pointsBalance.toLocaleString('vi-VN')} điểm, dùng tối đa{' '}
                {maxPoints.toLocaleString('vi-VN')})
              </Text>
            </View>
          )}
          {usePoints && maxPoints > 0 && (
            <Input
              label="Số điểm muốn dùng"
              keyboardType="number-pad"
              returnKeyType="done"
              value={pointsInput ?? String(pointsToUse)}
              onChangeText={setPointsInput}
              onEndEditing={commitPoints}
              onSubmitEditing={commitPoints}
            />
          )}
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
            {formatVnd(total)}
          </Text>
        </View>
        <Button
          label={submitting ? 'Đang giữ phòng...' : 'Giữ phòng & thanh toán'}
          leadingIcon="lock"
          size="sm"
          className="flex-1" style={{ minHeight: 52 }}
          // Chờ báo giá để không gửi tổng chưa trừ khuyến mãi tự áp dụng.
          disabled={!agreed || submitting || baseQuote.isPending || (pointsToUse > 0 && pointsQuote.isPending) || pointsInput !== undefined}
          onPress={() => void submit(total)}
        />
      </View>
    </View>
  );
}
