import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { QrCode } from '@/components/ui/qr-code';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
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
      <View style={styles.screen}>
        <ScreenHeader title="Chi Tiết Đặt Phòng" />
        <View style={styles.state}>
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
    <View style={styles.screen}>
      <ScreenHeader title="Chi Tiết Đặt Phòng" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.success}>
            <Icon name="check_circle" size={36} color={colors.tertiaryContainer} />
          </View>
          <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant} style={styles.code}>
            MÃ ĐƠN: {v.code}
          </Text>
          <Text variant="h1" color={colors.primary} center>
            Đặt phòng thành công!
          </Text>
          <Chip label="Đã xác nhận & thanh toán" icon="verified" tone="tertiary" style={styles.selfCenter} />
        </View>

        <View style={styles.card}>
          <View style={styles.cover}>
            <Image
              source={booking.data?.hotel.coverImageUrl ?? images.voucherHero}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <View style={styles.coverOverlay} />
            <View style={styles.coverText}>
              <Text variant="h2" color={colors.white}>
                {v.hotelName}
              </Text>
              {booking.data && (
                <View style={styles.row}>
                  <Icon name="location_on" size={14} color={colors.white} />
                  <Text variant="caption" color={colors.white}>
                    {booking.data.hotel.city}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.qrSection}>
            <View style={styles.between}>
              <Text variant="caption" weight="bold" color={colors.onSurfaceVariant} style={styles.code}>
                QR CHECK-IN
              </Text>
              <Chip label="Sẵn sàng sử dụng" tone="tertiary" />
            </View>
            <View style={styles.qr}>
              <QrCode value={v.qrToken} size={200} />
            </View>
            <Text variant="caption" color={colors.onSurfaceVariant} center>
              Đưa mã QR này cho lễ tân tại quầy để nhận phòng
            </Text>
          </View>

          <View style={styles.body}>
            <View style={styles.stay}>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <View style={styles.row}>
                    <Icon name="login" size={16} color={colors.onSurfaceVariant} />
                    <Text variant="caption" color={colors.onSurfaceVariant}>
                      Nhận phòng
                    </Text>
                  </View>
                  <Text variant="label" weight="bold">
                    {formatDate(v.checkIn)}
                  </Text>
                </View>
                <View style={[styles.flex, styles.alignEnd]}>
                  <View style={styles.row}>
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
              <View style={styles.divider} />
              <View style={styles.between}>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Thời gian lưu trú
                </Text>
                <Text variant="small" weight="bold" color={colors.primary}>
                  {nights} đêm
                </Text>
              </View>
            </View>

            <View style={styles.between}>
              <View style={styles.flex}>
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

            <View style={[styles.between, styles.total]}>
              <View style={styles.flex}>
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

        <View style={[styles.card, styles.notes]}>
          <View style={styles.row}>
            <Icon name="info" size={20} color={colors.secondary} />
            <Text variant="label" weight="bold" color={colors.primary}>
              Lưu ý quan trọng khi nhận phòng
            </Text>
          </View>
          {notes.map((n, i) => (
            <View key={n} style={styles.note}>
              <View style={styles.noteNum}>
                <Text variant="caption" weight="bold">
                  {i + 1}
                </Text>
              </View>
              <Text variant="small" color={colors.onSurfaceVariant} style={styles.flex}>
                {n}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  flex: { flex: 1 },
  alignEnd: { alignItems: 'flex-end' },
  selfCenter: { alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  code: { letterSpacing: 1 },
  hero: { alignItems: 'center', gap: 8 },
  success: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tertiaryFixed,
  },
  card: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  cover: { height: 130, justifyContent: 'flex-end' },
  coverOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(1,30,50,0.45)' },
  coverText: { padding: 14, gap: 2 },
  qrSection: { padding: 16, gap: 12, backgroundColor: colors.surfaceContainerLow },
  qr: { alignSelf: 'center', padding: 14, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest },
  body: { padding: 16, gap: 14 },
  stay: { padding: 12, gap: 10, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHigh },
  total: { paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.surfaceContainerHigh },
  notes: { padding: 16, gap: 12 },
  note: { flexDirection: 'row', gap: 10 },
  noteNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
});
