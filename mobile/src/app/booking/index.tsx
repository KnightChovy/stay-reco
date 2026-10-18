import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors, fonts, radius, shadow } from '@/constants/theme';
import { BookingProgress } from '@/features/booking/BookingProgress';
import { PriceLine } from '@/features/booking/PriceLine';
import { images } from '@/lib/mock-data';

function CardTitle({ icon, title, right }: { icon: IconName; title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.between}>
      <View style={[styles.row, styles.flex]}>
        <Icon name={icon} size={20} color={colors.primaryContainer} />
        <Text variant="label" weight="bold" style={styles.cardTitle}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

export default function BookingInfoScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('Nguyễn Minh Anh');
  const [email, setEmail] = useState('minhanh.traveler@gmail.com');
  const [phone, setPhone] = useState('0912 345 678');
  const [highFloor, setHighFloor] = useState(true);
  const [tea, setTea] = useState(true);
  const [agreed, setAgreed] = useState(true);

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
      <View style={styles.hold}>
        <Icon name="hourglass_top" size={18} color={colors.secondary} />
        <Text variant="small" color={colors.onSecondaryContainer} style={styles.flex} numberOfLines={1}>
          Phòng được giữ giá tốt nhất trong 19:45
        </Text>
        <Chip label="Đang giữ chỗ" tone="outline" />
      </View>
      <BookingProgress current={1} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Image source={images.bookingThumb} style={styles.thumb} contentFit="cover" />
              <View style={styles.thumbTag}>
                <Text variant="caption" weight="bold" color={colors.white}>
                  4 Sao
                </Text>
              </View>
            </View>
            <View style={[styles.flex, styles.gap4]}>
              <View style={styles.row}>
                <Icon name="location_on" size={14} color={colors.secondary} />
                <Text variant="caption" color={colors.secondary}>
                  Sơn Trà, Đà Nẵng
                </Text>
              </View>
              <Text variant="h3">An Nhiên Riverside Hotel</Text>
              <View style={styles.row}>
                <Icon name="bed" size={14} color={colors.onSurfaceVariant} />
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Phòng Deluxe River View (Tầng 6)
                </Text>
              </View>
              <Chip label="Không hút thuốc • Ban công riêng" icon="verified_user" tone="neutral" />
            </View>
          </View>
          <View style={styles.dates}>
            <View style={styles.flex}>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Nhận phòng
              </Text>
              <Text variant="label" weight="bold">
                14:00 • 20/10/2026
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Thứ Ba
              </Text>
            </View>
            <View style={styles.flex}>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Trả phòng
              </Text>
              <Text variant="label" weight="bold">
                12:00 • 22/10/2026
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Thứ Năm (2 đêm)
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
              2 người lớn (1 phòng)
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <CardTitle icon="person_pin" title="Thông tin người liên hệ" right={<Chip label="Khách đặt chính" tone="primary" />} />
          <Input
            label="Họ và tên khách"
            placeholder="Nhập họ và tên có dấu"
            value={name}
            onChangeText={setName}
            right={<Icon name="check_circle" size={20} color={colors.onSurfaceVariant} />}
          />
          <Input
            label="Email nhận xác nhận"
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            right={<Icon name="check_circle" size={20} color={colors.onSurfaceVariant} />}
          />
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Vé điện tử và mã QR sẽ gửi tức thời tới địa chỉ này
          </Text>
          <Input
            label="Số điện thoại di động"
            placeholder="0912 xxx xxx"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            left={
              <Text variant="label" color={colors.onSurfaceVariant}>
                +84
              </Text>
            }
          />
        </View>

        <View style={styles.card}>
          <CardTitle icon="hotel_class" title="Yêu cầu & Trải nghiệm riêng" />
          <Text variant="small" color={colors.onSurfaceVariant}>
            Khách sạn luôn ưu tiên chuẩn bị chu đáo trước giờ quý khách ghé thăm.
          </Text>
          <View style={styles.option}>
            <Checkbox checked={highFloor} onChange={setHighFloor} />
            <View style={styles.flex}>
              <Text variant="small" weight="semibold">
                Phòng tầng cao, ngắm trọn sông Hàn
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Ưu tiên từ tầng 6 trở lên, góc nhìn rộng và thoáng đãng
              </Text>
            </View>
          </View>
          <View style={styles.option}>
            <Checkbox checked={tea} onChange={setTea} />
            <View style={styles.flex}>
              <Text variant="small" weight="semibold">
                Set trà chiều Hội An lúc 15:00
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Dành cho 2 khách vào ngày đầu tiên nhận phòng
              </Text>
            </View>
            <Chip label="Tặng kèm" tone="secondary" />
          </View>
          <Text variant="label" weight="semibold">
            Ghi chú thêm cho lễ tân
          </Text>
          <TextInput
            multiline
            accessibilityLabel="Ghi chú thêm cho lễ tân"
            placeholder="Ví dụ: Giờ bay dự kiến, dịp kỷ niệm đặc biệt, yêu cầu nệm phụ..."
            placeholderTextColor={colors.outline}
            style={styles.textarea}
          />
        </View>

        <View style={styles.card}>
          <CardTitle icon="confirmation_number" title="Mã giảm giá & Điểm thưởng" right={<Chip label="+225 điểm Elite" icon="stars" tone="tertiary" />} />
          <View style={styles.row}>
            <View style={[styles.coupon, styles.flex]}>
              <Text variant="label" weight="bold">
                ANHNIEN250
              </Text>
              <View style={styles.row}>
                <Icon name="check" size={14} color={colors.tertiaryContainer} />
                <Text variant="caption" color={colors.tertiaryContainer}>
                  Đã áp dụng
                </Text>
              </View>
            </View>
            <Button label="Đổi mã" variant="muted" />
          </View>
          <View style={[styles.between, styles.discount]}>
            <Text variant="small" color={colors.onSecondaryContainer} style={styles.flex}>
              Ưu đãi độc quyền An Nhiên Retreat
            </Text>
            <Text variant="small" weight="bold" color={colors.secondary}>
              -250.000 ₫
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text variant="h3">Chi tiết giá công khai</Text>
          <PriceLine label="Tiền phòng (2 đêm × 1.250.000 ₫)" value="2.500.000 ₫" />
          <PriceLine label="Voucher ưu đãi (ANHNIEN250)" value="-250.000 ₫" tone={colors.secondary} icon="sell" />
          <PriceLine label="Thuế VAT & Phí phục vụ (8%)" value="Đã bao gồm" />
          <View style={styles.divider} />
          <View style={styles.between}>
            <View>
              <Text variant="label" weight="bold">
                Tổng tiền thanh toán
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Không phụ phí phát sinh tại quầy
              </Text>
            </View>
            <Text variant="price" color={colors.primary}>
              2.250.000 ₫
            </Text>
          </View>
        </View>

        <View style={[styles.policy, styles.row]}>
          <Icon name="event_available" size={22} color={colors.tertiaryContainer} />
          <View style={styles.flex}>
            <Text variant="small" weight="bold" color={colors.tertiary}>
              Chính sách hủy linh hoạt
            </Text>
            <Text variant="caption" color={colors.tertiary}>
              Miễn phí hủy phòng trước 14:00 ngày 18/10/2026. Hoàn tiền 100% trong 24h làm việc.
            </Text>
          </View>
        </View>

        <View style={[styles.row, styles.terms]}>
          <Checkbox checked={agreed} onChange={setAgreed} />
          <Text variant="caption" color={colors.onSurfaceVariant} style={styles.flex}>
            Tôi đã đọc và đồng ý với{' '}
            <Text variant="caption" weight="semibold" color={colors.primary}>
              Điều khoản dịch vụ
            </Text>
            , chính sách lưu trú của An Nhiên Riverside và quy chuẩn bảo mật StayReco.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Tổng tiền (2 đêm)
          </Text>
          <Text variant="h3" weight="bold" color={colors.primary}>
            2.250.000 ₫
          </Text>
        </View>
        <Button
          label="Tiếp tục thanh toán VNPay"
          leadingIcon="lock"
          size="sm"
          style={[styles.flex, styles.cta]}
          onPress={() => agreed && router.push('/booking/payment')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  flex: { flex: 1 },
  gap4: { gap: 4 },
  cta: { minHeight: 52 },
  cardTitle: { fontSize: 16, flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.secondaryFixed,
  },
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
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
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
  coupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  discount: { padding: 12, borderRadius: radius.md, backgroundColor: colors.secondaryFixed },
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
