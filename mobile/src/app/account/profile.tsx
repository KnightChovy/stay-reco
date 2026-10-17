import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { images } from '@/lib/mock-data';

const genders = ['Nam', 'Nữ', 'Khác'];

function SectionTitle({ icon, title, note }: { icon: IconName; title: string; note?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Icon name={icon} size={20} color={colors.secondary} />
      <Text variant="label" weight="bold" style={[styles.flex, styles.tracking]}>
        {title}
      </Text>
      {note && (
        <Text variant="caption" weight="semibold" color={colors.secondary}>
          {note}
        </Text>
      )}
    </View>
  );
}

function Verified({ label }: { label: string }) {
  return (
    <View style={styles.row}>
      <Icon name="check" size={14} color={colors.tertiaryContainer} />
      <Text variant="caption" weight="semibold" color={colors.tertiaryContainer}>
        {label}
      </Text>
    </View>
  );
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('Nguyễn Minh Anh');
  const [birthday, setBirthday] = useState('18/08/1995');
  const [gender, setGender] = useState('Nữ');
  const [address, setAddress] = useState('Quận Hải Châu, TP. Đà Nẵng');

  // shortcut: chưa có API cập nhật hồ sơ, Lưu chỉ quay về màn trước.
  const save = () => router.back();

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Chỉnh sửa hồ sơ cá nhân" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.banner}>
          <Icon name="shield_with_heart" size={18} color={colors.primaryContainer} />
          <Text variant="small" color={colors.onSurfaceVariant} style={styles.flex}>
            Hồ sơ định danh lưu trú an toàn
          </Text>
          <Chip label="Cấp 2: Đã đối soát" tone="tertiary" />
        </View>

        <View style={[styles.card, styles.center]}>
          <View>
            <Image source={images.avatar} style={styles.avatar} contentFit="cover" />
            <View style={styles.avatarBadge}>
              <Icon name="verified" size={16} color={colors.white} />
            </View>
          </View>
          <Text variant="h2">{fullName || 'Nguyễn Minh Anh'}</Text>
          <Text variant="small" color={colors.onSurfaceVariant}>
            Thành viên từ tháng 04/2023 • Hạng Bạc
          </Text>
          <View style={styles.row}>
            <Button label="Thay đổi ảnh" leadingIcon="photo_camera" size="sm" />
            <Button label="Gỡ ảnh" leadingIcon="delete" variant="muted" size="sm" />
          </View>
          <Text variant="caption" color={colors.onSurfaceVariant} center>
            Hỗ trợ JPG, PNG, WebP (tối đa 5MB). Ảnh rõ mặt giúp quầy lễ tân đón tiếp chu đáo và đẩy nhanh thủ tục nhận phòng.
          </Text>
        </View>

        <SectionTitle icon="badge" title="THÔNG TIN ĐỊNH DANH CÁ NHÂN" note="Bắt buộc theo CCCD" />
        <View style={styles.card}>
          <View style={styles.gap6}>
            <Input
              label="Họ và tên đầy đủ *"
              labelRight={
                <View style={styles.row}>
                  <Icon name="verified_user" size={14} color={colors.tertiaryContainer} />
                  <Text variant="caption" weight="semibold" color={colors.tertiaryContainer}>
                    Khớp căn cước
                  </Text>
                </View>
              }
              icon="person"
              placeholder="Nhập họ và tên"
              autoComplete="name"
              value={fullName}
              onChangeText={setFullName}
              right={<Icon name="check_circle" size={20} color={colors.tertiaryContainer} />}
            />
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Cần trùng khớp giấy tờ tùy thân để nhận phòng nhanh tại quầy lễ tân các điểm lưu trú đối tác.
            </Text>
          </View>

          <Input
            label="Vai trò tài khoản"
            icon="loyalty"
            value="Khách hàng thành viên (Guest / Customer)"
            editable={false}
            multiline
            right={<Icon name="lock" size={18} color={colors.outline} />}
          />

          <View style={styles.gap6}>
            <View style={styles.between}>
              <Text variant="label" weight="semibold">
                Số điện thoại liên hệ
              </Text>
              <Verified label="Đã xác thực OTP" />
            </View>
            <View style={styles.row}>
              <View style={[styles.readonly, styles.flex]}>
                <Icon name="call" size={18} color={colors.outline} />
                <Text variant="body">+84 0912 345 678</Text>
              </View>
              <Button label="Đổi SĐT" variant="muted" style={styles.sideBtn} />
            </View>
          </View>

          <View style={styles.gap6}>
            <View style={styles.between}>
              <Text variant="label" weight="semibold">
                Email nhận thông báo & hóa đơn
              </Text>
              <Verified label="Đã kích hoạt" />
            </View>
            <View style={styles.row}>
              <View style={[styles.readonly, styles.flex]}>
                <Icon name="mail" size={18} color={colors.outline} />
                <Text variant="body" numberOfLines={1} style={styles.flex}>
                  minhanh.nguyen@email.vn
                </Text>
              </View>
              <Button label="Đổi email" variant="muted" style={styles.sideBtn} />
            </View>
          </View>
        </View>

        <SectionTitle icon="hotel" title="THÔNG TIN BỔ SUNG & LƯU TRÚ" />
        <View style={styles.card}>
          <View style={styles.gap6}>
            <Input
              label="Ngày sinh"
              icon="cake"
              placeholder="DD/MM/YYYY"
              keyboardType="numbers-and-punctuation"
              value={birthday}
              onChangeText={setBirthday}
              right={<Icon name="calendar_today" size={20} color={colors.onSurfaceVariant} />}
            />
            <Text variant="caption" color={colors.secondary}>
              Nhận quà tặng ưu đãi & voucher sinh nhật mỗi năm.
            </Text>
          </View>

          <View style={styles.gap6}>
            <Text variant="label" weight="semibold">
              Giới tính
            </Text>
            <View style={styles.row}>
              {genders.map((g) => {
                const selected = g === gender;
                return (
                  <Pressable
                    key={g}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setGender(g)}
                    style={[styles.radio, selected && styles.radioSelected]}
                  >
                    <Icon
                      name={selected ? 'radio_button_checked' : 'radio_button_unchecked'}
                      size={18}
                      color={selected ? colors.primary : colors.outline}
                    />
                    <Text variant="small" weight={selected ? 'semibold' : 'regular'}>
                      {g}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.gap6}>
            <Input
              label="Số CCCD / Hộ chiếu (Tùy chọn)"
              labelRight={
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  Check-in tự động
                </Text>
              }
              icon="encrypted"
              value="048195009842"
              secureTextEntry
              editable={false}
              right={
                <Text variant="small" weight="bold" color={colors.primary}>
                  Sửa
                </Text>
              }
            />
            <View style={styles.rowTop}>
              <Icon name="check_circle" size={14} color={colors.tertiaryContainer} />
              <Text variant="caption" color={colors.onSurfaceVariant} style={styles.flex}>
                Mã hóa chuẩn SSL 256-bit. Dùng cho tính năng Check-in không chạm (Contactless) tại lễ tân.
              </Text>
            </View>
          </View>

          <Input
            label="Địa chỉ thường trú / Nhận hóa đơn GTGT"
            icon="location_on"
            placeholder="Nhập địa chỉ của bạn"
            autoComplete="street-address"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.policy}>
          <View style={styles.policyIcon}>
            <Icon name="policy" size={20} color={colors.primaryContainer} />
          </View>
          <View style={styles.flex}>
            <Text variant="small" weight="bold">
              Bảo mật thông tin khách hàng tuyệt đối
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              StayReco tuân thủ Nghị định bảo vệ dữ liệu cá nhân Việt Nam (NĐ 13/2023) và tiêu chuẩn an ninh thông tin. Hồ sơ
              chỉ được chia sẻ bảo mật tới lễ tân resort/khách sạn sau khi bạn chốt đặt chỗ.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.between}>
          <View style={styles.row}>
            <Icon name="cloud_done" size={16} color={colors.onSurfaceVariant} />
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Tự động đồng bộ đa thiết bị
            </Text>
          </View>
          <Text variant="caption" color={colors.secondary}>
            Bản nháp đã lưu lúc 10:42
          </Text>
        </View>
        <View style={styles.row}>
          <Button label="Hủy bỏ" variant="muted" onPress={() => router.back()} />
          <Button label="Lưu thay đổi" leadingIcon="check" size="lg" style={styles.flex} onPress={save} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  flex: { flex: 1 },
  gap6: { gap: 6 },
  center: { alignItems: 'center' },
  tracking: { letterSpacing: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
  },
  card: { padding: 16, gap: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: colors.white,
  },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  readonly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  sideBtn: { minHeight: 52 },
  radio: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  radioSelected: { backgroundColor: colors.primaryFixed },
  policy: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceContainer },
  policyIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
  },
  bottomBar: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
});
