import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { images } from '@/lib/mock-data';

const perks: { label: string; icon: IconName }[] = [
  { label: '2 buffet sáng mỗi ngày', icon: 'restaurant' },
  { label: 'Hồ bơi vô cực ngắm pháo hoa', icon: 'pool' },
  { label: 'Set trà chiều Hội An', icon: 'local_cafe' },
  { label: 'Đón sân bay miễn phí', icon: 'airport_shuttle' },
];

const notes = [
  'Quý khách vui lòng xuất trình CCCD/Hộ chiếu gốc của tất cả khách lưu trú để khách sạn hoàn tất thủ tục đăng ký tạm trú.',
  'Hỗ trợ gửi hành lý: Quý khách đến sớm trước 14:00 có thể gửi hành lý tại quầy Concierge hoàn toàn miễn phí và tự do tham quan.',
  'Cần hỗ trợ đưa đón sân bay hoặc check-in sớm, liên hệ Hotline lễ tân: 0236 3888 999 (24/7).',
];

export default function ConfirmationScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader subtitle="Chuyến Đi" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.success}>
            <Icon name="check_circle" size={36} color={colors.tertiaryContainer} />
          </View>
          <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant} style={styles.code}>
            MÃ ĐƠN: SR-261020-0842
          </Text>
          <Text variant="h1" color={colors.primary} center>
            Đặt phòng thành công!
          </Text>
          <Chip label="Đã xác nhận & Thanh toán qua VNPay" icon="verified" tone="tertiary" style={styles.selfCenter} />
        </View>

        <View style={styles.card}>
          <View style={styles.cover}>
            <Image source={images.voucherHero} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.coverOverlay} />
            <View style={styles.coverText}>
              <View style={styles.row}>
                <Icon name="star" size={14} color={colors.white} />
                <Text variant="caption" color={colors.white}>
                  Khách sạn boutique 4 sao
                </Text>
              </View>
              <Text variant="h2" color={colors.white}>
                An Nhiên Riverside Hotel
              </Text>
              <View style={styles.row}>
                <Icon name="location_on" size={14} color={colors.white} />
                <Text variant="caption" color={colors.white}>
                  128 Bạch Đằng, Hải Châu, Đà Nẵng
                </Text>
              </View>
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
              <Icon name="qr_code_2" size={190} color={colors.primary} />
            </View>
            <View style={[styles.row, styles.center]}>
              <Text variant="small" color={colors.onSurfaceVariant}>
                Mã PIN nhận phòng:
              </Text>
              <View style={styles.pin}>
                <Text variant="label" weight="bold" style={styles.code}>
                  8492
                </Text>
              </View>
              <Icon name="content_copy" size={18} color={colors.onSurfaceVariant} />
            </View>
            <Text variant="caption" color={colors.onSurfaceVariant} center>
              Đưa mã QR này cho lễ tân tại quầy để nhận phòng siêu tốc không chạm
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
                    20/10/2026
                  </Text>
                  <Text variant="caption" color={colors.secondary}>
                    Từ 14:00
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
                    22/10/2026
                  </Text>
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    Trước 12:00
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.between}>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Thời gian lưu trú
                </Text>
                <Text variant="small" weight="bold" color={colors.primary}>
                  2 đêm trọn vẹn
                </Text>
              </View>
            </View>

            <View style={styles.between}>
              <View style={styles.flex}>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Hạng phòng đã chọn
                </Text>
                <Text variant="label" weight="bold">
                  Deluxe River View
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  1 Giường King cỡ lớn • Ban công hướng sông Hàn
                </Text>
              </View>
              <Chip label="2 người lớn" tone="primary" />
            </View>

            <View style={styles.row}>
              <Icon name="card_giftcard" size={18} color={colors.secondary} />
              <Text variant="small" weight="semibold">
                Đặc quyền bao gồm trong gói:
              </Text>
            </View>
            <View style={styles.perks}>
              {perks.map((p) => (
                <Chip key={p.label} label={p.label} icon={p.icon} tone="neutral" />
              ))}
            </View>

            <View style={[styles.between, styles.total]}>
              <View style={styles.flex}>
                <Text variant="small" weight="semibold">
                  Tổng chi phí thanh toán
                </Text>
                <Text variant="caption" color={colors.tertiaryContainer}>
                  Đã thanh toán đủ (Bao gồm thuế & phí)
                </Text>
              </View>
              <Text variant="price" color={colors.secondary}>
                2.250.000 ₫
              </Text>
            </View>
          </View>
        </View>

        <Button label="Tải voucher PDF (Xác nhận đặt phòng)" leadingIcon="download" size="lg" />
        <View style={styles.row}>
          <Button label="Thêm vào Wallet" leadingIcon="account_balance_wallet" variant="secondary" style={styles.flex} />
          <Button label="Lưu ảnh QR" leadingIcon="photo_camera" variant="secondary" style={styles.flex} />
        </View>

        <View style={[styles.card, styles.mapCard]}>
          <View style={styles.between}>
            <View style={styles.row}>
              <View style={styles.mapIcon}>
                <Icon name="near_me" size={18} color={colors.secondary} />
              </View>
              <View>
                <Text variant="small" weight="bold">
                  Vị trí khách sạn
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Cách Cầu Rồng 350m đi bộ
                </Text>
              </View>
            </View>
            <Button label="Chỉ đường" icon="arrow_forward" variant="muted" size="sm" />
          </View>
          <View style={styles.map}>
            <Image source={images.hotelMap} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.mapLabel}>
              <Icon name="pin_drop" size={14} color={colors.secondary} />
              <Text variant="caption">Mặt tiền đường Bạch Đằng</Text>
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

        <View style={[styles.row, styles.center]}>
          <Icon name="support_agent" size={16} color={colors.onSurfaceVariant} />
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Liên hệ Chăm sóc khách hàng StayReco (1900 6868)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 120 },
  flex: { flex: 1 },
  alignEnd: { alignItems: 'flex-end' },
  center: { justifyContent: 'center' },
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
  pin: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: colors.surfaceContainerLowest },
  body: { padding: 16, gap: 14 },
  stay: { padding: 12, gap: 10, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHigh },
  perks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  total: { paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.surfaceContainerHigh },
  mapCard: { padding: 16, gap: 12 },
  mapIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryFixed,
  },
  map: { height: 140, borderRadius: radius.md, overflow: 'hidden', justifyContent: 'flex-end', padding: 10 },
  mapLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLowest,
  },
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
