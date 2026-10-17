import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { registerCustomerSchema } from '@stayreco/shared';
import { BrandMark, ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';

function Required() {
  return (
    <Text variant="caption" color={colors.onSurfaceVariant}>
      Bắt buộc
    </Text>
  );
}

function EyeToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <Pressable accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onPress={onToggle} hitSlop={8}>
      <Icon name={visible ? 'visibility' : 'visibility_off'} size={20} color={colors.outline} />
    </Pressable>
  );
}

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [error, setError] = useState('');

  // Quy tắc khớp passwordSchema của @stayreco/shared (≥ 8 ký tự, có chữ và số).
  const rules = [
    { label: 'Tối thiểu 8 ký tự an toàn', ok: password.length >= 8 },
    { label: 'Bao gồm chữ cái (A-Z) & số (0-9)', ok: /[A-Za-z]/.test(password) && /\d/.test(password) },
    { label: 'Mật khẩu xác nhận trùng khớp', ok: confirm.length > 0 && confirm === password },
  ];

  const submit = () => {
    if (!registerCustomerSchema.safeParse({ email, password, fullName }).success || !rules.every((r) => r.ok)) {
      setError('Vui lòng kiểm tra lại họ tên, email và mật khẩu.');
      return;
    }
    if (!agreed) {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ để tiếp tục.');
      return;
    }
    // shortcut: chưa gọi API đăng ký, chỉ chuyển về màn đăng nhập.
    setError('');
    router.replace('/login');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Đăng ký" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <BrandMark size={36} />
          <Text variant="h2" color={colors.primary}>
            StayReco
          </Text>
        </View>
        <View style={styles.gap8}>
          <Text variant="hero">Tạo tài khoản StayReco</Text>
          <Text variant="body" color={colors.onSurfaceVariant}>
            Tham gia cộng đồng du khách tinh tế và tận hưởng kỳ nghỉ trọn vẹn tại Việt Nam.
          </Text>
        </View>

        <Input
          label="Họ và tên đầy đủ"
          labelRight={<Required />}
          icon="badge"
          placeholder="Theo CMND / CCCD / Hộ chiếu"
          autoComplete="name"
          value={fullName}
          onChangeText={setFullName}
        />
        <View style={styles.gap8}>
          <Input
            label="Email nhận vé & hóa đơn"
            labelRight={<Required />}
            icon="mail"
            placeholder="tenban@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <View style={styles.row}>
            <Icon name="info" size={14} color={colors.onSurfaceVariant} />
            <Text variant="caption" color={colors.onSurfaceVariant}>
              Chúng tôi sẽ gửi E-Voucher và xác nhận đến hòm thư này.
            </Text>
          </View>
        </View>
        <Input
          label="Số điện thoại liên lạc"
          icon="phone_iphone"
          left={
            <Text variant="label" color={colors.onSurfaceVariant}>
              +84
            </Text>
          }
          placeholder="091 234 5678"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={phone}
          onChangeText={setPhone}
        />
        <Input
          label="Mật khẩu"
          icon="lock"
          placeholder="Tối thiểu 8 ký tự"
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
          right={<EyeToggle visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
        />
        <Input
          label="Xác nhận mật khẩu"
          icon="lock_reset"
          placeholder="Nhập lại mật khẩu vừa tạo"
          secureTextEntry={!showConfirm}
          autoComplete="new-password"
          value={confirm}
          onChangeText={setConfirm}
          right={<EyeToggle visible={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />}
        />

        <View style={styles.rules}>
          <Text variant="small" weight="bold" color={colors.onSurfaceVariant}>
            Yêu cầu bảo mật:
          </Text>
          {rules.map((r) => (
            <View key={r.label} style={styles.row}>
              <Icon
                name={r.ok ? 'check_circle' : 'radio_button_unchecked'}
                size={16}
                color={r.ok ? colors.tertiaryContainer : colors.outline}
              />
              <Text variant="small" color={r.ok ? colors.tertiary : colors.onSurfaceVariant}>
                {r.label}
              </Text>
            </View>
          ))}
        </View>

        <Checkbox checked={agreed} onChange={setAgreed}>
          <Text variant="small" style={styles.shrink}>
            Tôi đã đọc và đồng ý với{' '}
            <Text variant="small" weight="bold" color={colors.primary}>
              Điều khoản dịch vụ
            </Text>{' '}
            và{' '}
            <Text variant="small" weight="bold" color={colors.primary}>
              Chính sách bảo mật
            </Text>{' '}
            của StayReco.
          </Text>
        </Checkbox>
        <Checkbox checked={newsletter} onChange={setNewsletter}>
          <Text variant="small" style={styles.shrink}>
            Nhận gợi ý lưu trú cá nhân hóa, điểm đến bí mật và mã ưu đãi boutique định kỳ qua email.
          </Text>
        </Checkbox>

        {!!error && (
          <Text variant="small" color={colors.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}
        <Button label="Tạo tài khoản & Tiếp tục" icon="arrow_forward" size="lg" onPress={submit} />

        <View style={[styles.row, styles.center]}>
          <Text variant="small" color={colors.onSurfaceVariant}>
            Đã có tài khoản StayReco?
          </Text>
          <Pressable onPress={() => router.replace('/login')}>
            <Text variant="small" weight="bold" color={colors.primary} style={styles.underline}>
              Đăng nhập ngay
            </Text>
          </Pressable>
        </View>

        <View style={styles.partner}>
          <View style={styles.partnerIcon}>
            <Icon name="corporate_fare" size={22} color={colors.primaryContainer} />
          </View>
          <View style={styles.flex}>
            <Text variant="small" weight="bold">
              Chủ khách sạn & resort boutique?
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant} numberOfLines={1}>
              Tiếp cận du khách tinh hoa qua nền tảng chọn lọc
            </Text>
          </View>
          <Button label="StayReco Partner" variant="secondary" size="sm" />
        </View>

        <View style={[styles.row, styles.center]}>
          <Icon name="lock" size={14} color={colors.onSurfaceVariant} />
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Mã hóa SSL 256-bit
          </Text>
          <Text variant="caption" color={colors.outline}>
            •
          </Text>
          <Icon name="verified_user" size={14} color={colors.onSurfaceVariant} />
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Chuẩn bảo mật PCI-DSS
          </Text>
        </View>
        <Text variant="caption" color={colors.onSurfaceVariant} center>
          Bản quyền © 2025 StayReco Hospitality Platform. Tôn vinh vẻ đẹp lưu trú bản địa.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 18, paddingBottom: 40 },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  gap8: { gap: 8 },
  center: { justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rules: { padding: 14, gap: 8, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  partner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
  },
  partnerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
  },
});
