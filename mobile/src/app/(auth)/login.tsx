import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Link, router } from 'expo-router';
import { loginSchema } from '@stayreco/shared';
import { BrandMark, ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
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
    // Mở từ màn đặt phòng thì quay lại đó để đặt tiếp.
    if (result.success) router.canGoBack() ? router.back() : router.replace('/');
    else setError(result.message);
  };

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Đăng nhập" />
      <ScrollView contentContainerClassName="gap-[18px] p-4 pb-10" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-3">
          <BrandMark size={48} />
          <View>
            <Text variant="h2" color={colors.primary}>
              StayReco
            </Text>
            <Text variant="caption" weight="semibold" color={colors.secondary} className="tracking-[1px]">
              BOUTIQUE HOSPITALITY
            </Text>
          </View>
        </View>

        <View className="gap-2">
          <Text variant="hero">Chào mừng bạn trở lại</Text>
          <Text variant="body" color={colors.onSurfaceVariant}>
            Tiếp tục hành trình khám phá những chốn nghỉ dưỡng boutique tinh tế và đậm bản sắc.
          </Text>
        </View>

        <View className="flex-row gap-3 rounded-md bg-surface-container-low p-3.5">
          <Icon name="hub" size={20} color={colors.primaryContainer} />
          <Text variant="small" color={colors.onSurfaceVariant} className="flex-1">
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

        <View className="flex-row items-center justify-between gap-2">
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

        <View className="gap-3 rounded-lg bg-surface-container-lowest p-4">
          <Pressable onPress={() => router.push('/register')} className="flex-row items-center justify-between gap-2">
            <Text variant="small" color={colors.onSurfaceVariant}>
              Chưa có tài khoản?
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Text variant="small" weight="bold" color={colors.primary}>
                Đăng ký ngay
              </Text>
              <Icon name="chevron_right" size={18} color={colors.primary} />
            </View>
          </Pressable>
          <View className="h-px bg-surface-container-high" />
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-1.5">
              <Icon name="apartment" size={18} color={colors.secondary} />
              <Text variant="small" color={colors.onSurfaceVariant}>
                Dành cho chủ khách sạn
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Text variant="small" weight="bold" color={colors.secondary}>
                Trở thành đối tác
              </Text>
              <Icon name="open_in_new" size={16} color={colors.secondary} />
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5 justify-center">
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
