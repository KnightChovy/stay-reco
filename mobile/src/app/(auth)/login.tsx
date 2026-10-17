import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { loginSchema } from '@stayreco/shared';
import { BrandMark, ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import { AuthSocialActions } from '@/features/auth/AuthSocialActions';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const submit = async () => {
    if (loading) return;
    if (!loginSchema.safeParse({ email, password }).success) {
      setError('Email hoặc mật khẩu chưa hợp lệ.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password, remember);
    setLoading(false);
    if (result.success) router.replace('/');
    else setError(result.message);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Đăng nhập" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.brand}>
          <BrandMark size={48} />
          <View>
            <Text variant="h2" color={colors.primary}>
              StayReco
            </Text>
            <Text variant="caption" weight="semibold" color={colors.secondary} style={styles.tracking}>
              BOUTIQUE HOSPITALITY
            </Text>
          </View>
        </View>

        <View style={styles.gap8}>
          <Text variant="hero">Chào mừng bạn trở lại</Text>
          <Text variant="body" color={colors.onSurfaceVariant}>
            Tiếp tục hành trình khám phá những chốn nghỉ dưỡng boutique tinh tế và đậm bản sắc.
          </Text>
        </View>

        <View style={styles.notice}>
          <Icon name="hub" size={20} color={colors.primaryContainer} />
          <Text variant="small" color={colors.onSurfaceVariant} style={styles.flex}>
            <Text variant="small" weight="bold" color={colors.primary}>
              Cổng truy cập đồng nhất:
            </Text>{' '}
            Hệ thống tự động nhận diện và chuyển tiếp giao diện phù hợp cho Khách hàng, Đối tác khách sạn hoặc Ban điều
            hành.
          </Text>
        </View>

        <Input
          label="Email hoặc số điện thoại"
          icon="mail"
          placeholder="Nhập email hoặc số điện thoại"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Mật khẩu"
          icon="lock"
          placeholder="Nhập mật khẩu của bạn"
          secureTextEntry={!showPassword}
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
          right={
            <Pressable
              accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={8}
            >
              <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} color={colors.outline} />
            </Pressable>
          }
        />
        {!!error && (
          <Text variant="small" color={colors.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}

        <View style={styles.between}>
          <Checkbox checked={remember} onChange={setRemember}>
            <Text variant="small">Ghi nhớ đăng nhập</Text>
          </Checkbox>
          <Link href="/forgot-password">
            <Text variant="small" weight="bold" color={colors.secondary}>
              Quên mật khẩu?
            </Text>
          </Link>
        </View>

        <Button
          label={loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          icon="arrow_forward"
          size="lg"
          onPress={submit}
          disabled={loading}
        />
        <AuthSocialActions />

        <View style={styles.links}>
          <Pressable onPress={() => router.push('/register')} style={styles.between}>
            <Text variant="small" color={colors.onSurfaceVariant}>
              Chưa có tài khoản?
            </Text>
            <View style={styles.row}>
              <Text variant="small" weight="bold" color={colors.primary}>
                Đăng ký ngay
              </Text>
              <Icon name="chevron_right" size={18} color={colors.primary} />
            </View>
          </Pressable>
          <View style={styles.divider} />
          <View style={styles.between}>
            <View style={styles.row}>
              <Icon name="apartment" size={18} color={colors.secondary} />
              <Text variant="small" color={colors.onSurfaceVariant}>
                Dành cho chủ khách sạn
              </Text>
            </View>
            <View style={styles.row}>
              <Text variant="small" weight="bold" color={colors.secondary}>
                Trở thành đối tác
              </Text>
              <Icon name="open_in_new" size={16} color={colors.secondary} />
            </View>
          </View>
        </View>

        <View style={[styles.row, styles.center]}>
          <Icon name="verified_user" size={16} color={colors.onSurfaceVariant} />
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Mã hóa SSL 256-bit
          </Text>
          <Text variant="caption" color={colors.outline}>
            •
          </Text>
          <Icon name="shield" size={16} color={colors.onSurfaceVariant} />
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Bảo mật chuẩn quốc tế
          </Text>
        </View>
        <Text variant="caption" color={colors.onSurfaceVariant} center>
          StayReco cam kết giữ an toàn tuyệt đối mọi thông tin hồ sơ và hành trình lưu trú của bạn.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 18, paddingBottom: 40 },
  flex: { flex: 1 },
  gap8: { gap: 8 },
  center: { justifyContent: 'center' },
  tracking: { letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notice: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  links: { padding: 16, gap: 12, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHigh },
});
