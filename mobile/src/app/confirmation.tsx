import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { QrCode } from '@/components/ui/qr-code';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { images } from '@/lib/mock-data';
import { formatDate, formatVnd, nightsBetween } from '@/lib/stay';
import { getBooking, getVoucher } from '@/services/bookings.service';

const notes = [
  'Quý khách vui lòng xuất trình CCCD/Hộ chiếu gốc của tất cả khách lưu trú để khách sạn hoàn tất thủ tục đăng ký tạm trú.',
  'Đưa mã QR này cho lễ tân khi nhận phòng; mã có chữ ký của StayReco nên không thể chỉnh sửa.',
];

export default function ConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const voucher = useQuery({ queryKey: ['bookings', id, 'voucher'], queryFn: () => getVoucher(id), enabled: !!id });
  // Voucher không có ảnh và thành phố của khách sạn; lấy thêm từ booking (thường đã có trong cache).
  const booking = useQuery({ queryKey: ['bookings', id], queryFn: () => getBooking(id), enabled: !!id });
  const v = voucher.data;

  if (!v) {
    return (
      <View className="flex-1 bg-surface">
        <ScreenHeader title="Chi Tiết Đặt Phòng" />
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text variant="small" color={colors.onSurfaceVariant} center>
            {voucher.isError || !id
              ? 'Voucher không còn hiệu lực hoặc đơn chưa được xác nhận.'
              : 'Đang tải voucher...'}
          </Text>
          {(voucher.isError || !id) && (
            <Button label="Về chuyến đi của tôi" variant="secondary" onPress={() => router.navigate('/trips')} />
          )}
        </View>
      </View>
    );
  }

  const nights = nightsBetween(v.checkIn, v.checkOut);

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Chi Tiết Đặt Phòng" />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" showsVerticalScrollIndicator={false}>
        <View className="items-center gap-2">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-tertiary-fixed">
            <Icon name="check_circle" size={36} color={colors.tertiaryContainer} />
          </View>
          <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant} className="tracking-[1px]">
            MÃ ĐƠN: {v.code}
          </Text>
          <Text variant="h1" color={colors.primary} center>
            Đặt phòng thành công!
          </Text>
          <Chip label="Đã xác nhận & thanh toán" icon="verified" tone="tertiary" style={{ alignSelf: 'center' }} />
        </View>

        <View className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-card">
          <View className="h-[130px] justify-end">
            <Image
              source={booking.data?.hotel.coverImageUrl ?? images.voucherHero}
              className="absolute inset-0"
              contentFit="cover"
            />
            <View className="absolute inset-0 bg-[rgba(1,30,50,0.45)]" />
            <View className="gap-0.5 p-3.5">
              <Text variant="h2" color={colors.white}>
                {v.hotelName}
              </Text>
              {booking.data && (
                <View className="flex-row items-center gap-1.5">
                  <Icon name="location_on" size={14} color={colors.white} />
                  <Text variant="caption" color={colors.white}>
                    {booking.data.hotel.city}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="gap-3 bg-surface-container-low p-4">
            <View className="flex-row items-center justify-between gap-2">
              <Text variant="caption" weight="bold" color={colors.onSurfaceVariant} className="tracking-[1px]">
                QR CHECK-IN
              </Text>
              <Chip label="Sẵn sàng sử dụng" tone="tertiary" />
            </View>
            <View className="self-center rounded-lg bg-surface-container-lowest p-3.5">
              <QrCode value={v.qrToken} size={200} />
            </View>
            <Text variant="caption" color={colors.onSurfaceVariant} center>
              Đưa mã QR này cho lễ tân tại quầy để nhận phòng
            </Text>
          </View>

          <View className="gap-3.5 p-4">
            <View className="gap-2.5 rounded-md bg-surface-container-low p-3">
              <View className="flex-row items-center gap-1.5">
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Icon name="login" size={16} color={colors.onSurfaceVariant} />
                    <Text variant="caption" color={colors.onSurfaceVariant}>
                      Nhận phòng
                    </Text>
                  </View>
                  <Text variant="label" weight="bold">
                    {formatDate(v.checkIn)}
                  </Text>
                </View>
                <View className="flex-1 items-end">
                  <View className="flex-row items-center gap-1.5">
                    <Icon name="logout" size={16} color={colors.onSurfaceVariant} />
                    <Text variant="caption" color={colors.onSurfaceVariant}>
                      Trả phòng
                    </Text>
                  </View>
                  <Text variant="label" weight="bold">
                    {formatDate(v.checkOut)}
                  </Text>
                </View>
              </View>
              <View className="h-px bg-surface-container-high" />
              <View className="flex-row items-center justify-between gap-2">
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Thời gian lưu trú
                </Text>
                <Text variant="small" weight="bold" color={colors.primary}>
                  {nights} đêm
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-1">
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Hạng phòng đã chọn
                </Text>
                <Text variant="label" weight="bold">
                  {v.roomTypeName}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Khách: {v.guestName}
                </Text>
              </View>
              <Chip label={`${v.guests} khách • ${v.rooms} phòng`} tone="primary" />
            </View>

            <View className="flex-row items-center justify-between gap-2 border-t border-surface-container-high pt-3">
              <View className="flex-1">
                <Text variant="small" weight="semibold">
                  Tổng chi phí thanh toán
                </Text>
                <Text variant="caption" color={colors.tertiaryContainer}>
                  Đã thanh toán đủ (bao gồm thuế & phí)
                </Text>
              </View>
              <Text variant="price" color={colors.secondary}>
                {formatVnd(v.amountPaid)}
              </Text>
            </View>
          </View>
        </View>

        <View className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-card gap-3 p-4">
          <View className="flex-row items-center gap-1.5">
            <Icon name="info" size={20} color={colors.secondary} />
            <Text variant="label" weight="bold" color={colors.primary}>
              Lưu ý quan trọng khi nhận phòng
            </Text>
          </View>
          {notes.map((n, i) => (
            <View key={n} className="flex-row gap-2.5">
              <View className="h-[22px] w-[22px] items-center justify-center rounded-full bg-surface-container">
                <Text variant="caption" weight="bold">
                  {i + 1}
                </Text>
              </View>
              <Text variant="small" color={colors.onSurfaceVariant} className="flex-1">
                {n}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
