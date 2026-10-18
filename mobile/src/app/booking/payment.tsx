import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { BookingProgress } from '@/features/booking/BookingProgress';
import { PriceLine } from '@/features/booking/PriceLine';
import { images } from '@/lib/mock-data';

type Method = 'qr' | 'atm' | 'card';

const banks = ['VCB', 'MB BANK', 'TCB', 'AGRIBANK', 'BIDV', '+29 ví'];

function MethodCard({
  selected,
  onPress,
  title,
  desc,
  icon,
  tags,
  badge,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  desc: string;
  icon: IconName;
  tags?: string[];
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={styles.method}>
        <Icon
          name={selected ? 'radio_button_checked' : 'radio_button_unchecked'}
          size={22}
          color={selected ? colors.primary : colors.outline}
        />
        <View style={[styles.flex, styles.gap4]}>
          <View style={styles.row}>
            <Text variant="label" weight="bold" style={styles.shrink}>
              {title}
            </Text>
            {badge && <Chip label={badge} tone="neutral" />}
          </View>
          <Text variant="small" color={colors.onSurfaceVariant}>
            {desc}
          </Text>
          {tags && (
            <View style={styles.tags}>
              {tags.map((t) => (
                <Chip key={t} label={t} tone="neutral" />
              ))}
            </View>
          )}
        </View>
        <View style={styles.methodIcon}>
          <Icon name={icon} size={20} color={colors.primary} />
        </View>
      </Pressable>
      {selected && children}
    </View>
  );
}

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const [method, setMethod] = useState<Method>('qr');

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Chi Tiết Khách Sạn"
        right={
          <Pressable accessibilityLabel="Chia sẻ" style={styles.iconBtn}>
            <Icon name="share" color={colors.onSurface} />
          </Pressable>
        }
      />
      <BookingProgress current={2} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.timer}>
          <Icon name="timer" size={24} color={colors.secondary} />
          <View style={styles.flex}>
            <Text variant="small" color={colors.onSecondaryContainer}>
              Giữ giá phòng và dịch vụ
            </Text>
            <Text variant="small" weight="bold" color={colors.secondary}>
              Đơn giữ chỗ còn 14:31 phút
            </Text>
          </View>
          <View style={styles.timerBar}>
            <View style={styles.timerFill} />
          </View>
        </View>

        <View style={[styles.card, styles.gap12]}>
          <View style={styles.row}>
            <Image source={images.paymentThumb} style={styles.thumb} contentFit="cover" />
            <View style={[styles.flex, styles.gap4]}>
              <View style={styles.row}>
                <Chip label="Boutique Hotel" tone="secondary" />
                <Icon name="star" size={14} color={colors.secondary} />
                <Text variant="caption">4.8</Text>
              </View>
              <Text variant="h3">An Nhiên Riverside Hotel</Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                2 đêm • 20/10/2026 - 22/10/2026
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Mã đơn:{' '}
                <Text variant="caption" weight="bold">
                  SR-261020-0842
                </Text>
              </Text>
            </View>
          </View>
          <View style={styles.summary}>
            <PriceLine label="Giá phòng gốc (2 đêm)" value="2.500.000 ₫" />
            <PriceLine label="Ưu đãi độc quyền (ANHNIEN250)" value="-250.000 ₫" icon="sell" tone={colors.secondary} />
            <PriceLine label="Thuế VAT & Phí dịch vụ (8%)" value="Đã bao gồm" />
            <View style={styles.divider} />
            <View style={styles.between}>
              <View>
                <Text variant="label" weight="bold">
                  Tổng tiền thanh toán
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Giá trọn gói, không phát sinh
                </Text>
              </View>
              <Text variant="price" color={colors.primary}>
                2.250.000 ₫
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.between}>
          <Text variant="label" weight="bold" style={styles.sectionTitle}>
            Chọn phương thức thanh toán
          </Text>
          <View style={styles.row}>
            <Icon name="verified_user" size={14} color={colors.primaryContainer} />
            <Text variant="caption" color={colors.primaryContainer}>
              VNPay bảo đảm
            </Text>
          </View>
        </View>

        <MethodCard
          selected={method === 'qr'}
          onPress={() => setMethod('qr')}
          title="VNPay-QR"
          badge="Khuyên dùng"
          desc="Quét mã trực tiếp từ mọi ứng dụng Ngân hàng & Ví điện tử"
          icon="qr_code_scanner"
        >
          <View style={styles.qrBox}>
            <View style={styles.between}>
              <View style={styles.row}>
                <View style={styles.liveDot} />
                <Text variant="caption">Mã QR động có hiệu lực:</Text>
              </View>
              <Text variant="label" weight="bold" color={colors.secondary}>
                14:31
              </Text>
            </View>
            <View style={styles.qr}>
              <Icon name="qr_code_2" size={180} color={colors.primary} />
            </View>
            <View style={[styles.between, styles.transfer]}>
              <View>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Nội dung chuyển khoản tự động
                </Text>
                <Text variant="label" weight="bold">
                  STAYRECO SR2610200842
                </Text>
              </View>
              <Pressable accessibilityLabel="Sao chép nội dung" hitSlop={8}>
                <Icon name="content_copy" size={20} color={colors.primary} />
              </Pressable>
            </View>
            <Text variant="caption" color={colors.onSurfaceVariant} center>
              Hỗ trợ hơn 34 ngân hàng & ví liên kết VNPAY
            </Text>
            <View style={[styles.tags, styles.center]}>
              {banks.map((b) => (
                <Chip key={b} label={b} tone="outline" />
              ))}
            </View>
          </View>
        </MethodCard>

        <MethodCard
          selected={method === 'atm'}
          onPress={() => setMethod('atm')}
          title="Thẻ ATM & Tài khoản nội địa"
          desc="Cổng VNPay NAPAS, Internet Banking 38 ngân hàng Việt Nam"
          icon="account_balance"
          tags={['Napas', 'Miễn phí giao dịch']}
        />
        <MethodCard
          selected={method === 'card'}
          onPress={() => setMethod('card')}
          title="Thẻ quốc tế (Visa / Mastercard / JCB)"
          desc="Xử lý tức thì với công nghệ bảo vệ 3D-Secure"
          icon="credit_card"
          tags={['VISA', 'MC', 'JCB']}
        />

        <View style={styles.secure}>
          <View style={styles.row}>
            <View style={styles.lock}>
              <Icon name="lock" size={18} color={colors.white} />
            </View>
            <View style={styles.flex}>
              <Text variant="small" weight="bold">
                Bảo mật chuẩn ngân hàng SSL 256-bit & PCI-DSS
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Mọi thông tin thanh toán đều được mã hóa chuẩn hóa quốc tế
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.row, styles.flex]}>
              <Icon name="task_alt" size={16} color={colors.tertiaryContainer} />
              <Text variant="caption" style={styles.flex}>
                Cam kết không lưu trữ số CVC/mật khẩu
              </Text>
            </View>
            <View style={[styles.row, styles.flex]}>
              <Icon name="task_alt" size={16} color={colors.tertiaryContainer} />
              <Text variant="caption" style={styles.flex}>
                Hoàn tiền nếu hủy hợp lệ
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.row]}>
          <Icon name="support_agent" size={24} color={colors.primary} />
          <View style={styles.flex}>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Cần trợ giúp trong quá trình thanh toán?
            </Text>
            <Text variant="small" weight="bold">
              StayReco Care 24/7: 1900 8899
            </Text>
          </View>
          <Button label="Gọi ngay" variant="muted" size="sm" />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label="Xác nhận đã thanh toán / Kiểm tra trạng thái"
          leadingIcon="verified"
          size="lg"
          onPress={() => router.dismissTo('/confirmation')}
        />
        <View style={styles.row}>
          <Button label="Mở ứng dụng ngân hàng" leadingIcon="open_in_new" variant="muted" style={styles.flex} />
          <Pressable accessibilityLabel="Hóa đơn" style={styles.receipt}>
            <Icon name="receipt_long" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  sectionTitle: { fontSize: 16, flexShrink: 1 },
  gap4: { gap: 4 },
  gap12: { gap: 12 },
  center: { justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.secondaryFixed,
  },
  timerBar: { width: 60, height: 6, borderRadius: 3, backgroundColor: 'rgba(147,74,51,0.2)' },
  timerFill: { width: '75%', height: 6, borderRadius: 3, backgroundColor: colors.secondary },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  cardSelected: { borderWidth: 1, borderColor: colors.primaryFixed },
  thumb: { width: 84, height: 84, borderRadius: radius.md },
  summary: { padding: 12, gap: 8, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHigh },
  method: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  qrBox: {
    marginTop: 14,
    padding: 14,
    gap: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary },
  qr: {
    alignSelf: 'center',
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    ...shadow.card,
  },
  transfer: { padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  secure: { padding: 16, gap: 12, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLow },
  lock: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tertiaryContainer,
  },
  bottomBar: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  receipt: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
  },
});
