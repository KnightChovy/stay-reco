import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { isAxiosError } from 'axios';
import { resetPasswordSchema } from '@stayreco/shared';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { apiErrorMessage } from '@/services/ApiService';
import { resetPassword } from '@/services/auth.service';

/** Mở từ liên kết trong email (`mobile://reset-password?token=…`), giống /reset-password bên web. */
export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const input = resetPasswordSchema.safeParse({ token, newPassword });
    if (!input.success) {
      setError('Mật khẩu mới cần tối thiểu 8 ký tự, có cả chữ và số.');
      return;
    }
    if (confirm !== newPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await resetPassword(input.data);
      setDone(true);
    } catch (err) {
      const expired = 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (chỉ có hiệu lực 30 phút).';
      // Backend trả thông báo tiếng Anh cho token sai/hết hạn; dùng câu tiếng Việt thay thế.
      setError(isAxiosError(err) && (err.response?.data as { code?: string } | undefined)?.code === 'AUTH_TOKEN_INVALID' ? expired : apiErrorMessage(err, expired));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Đặt lại mật khẩu" />
      <ScrollView contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
        {!token ? (
          <View className="items-center gap-3 pt-8">
            <Icon name="warning" size={36} color={colors.error} />
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Liên kết không hợp lệ. Hãy mở lại liên kết trong email hoặc yêu cầu liên kết mới.
            </Text>
            <Button label="Yêu cầu liên kết mới" onPress={() => router.replace('/forgot-password')} />
          </View>
        ) : done ? (
          <View className="items-center gap-3 pt-8">
            <Icon name="check_circle" size={40} color={colors.tertiaryContainer} />
            <Text variant="h2" center>
              Đặt lại mật khẩu thành công!
            </Text>
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
            </Text>
            <Button label="Đăng nhập" leadingIcon="login" onPress={() => router.replace('/login')} />
          </View>
        ) : (
          <>
            <Input label="Mật khẩu mới" icon="lock" secureTextEntry autoComplete="new-password" value={newPassword} onChangeText={setNew} />
            <Input label="Xác nhận mật khẩu mới" icon="lock" secureTextEntry autoComplete="new-password" value={confirm} onChangeText={setConfirm} onSubmitEditing={submit} />
            {!!error && (
              <Text variant="small" color={colors.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            )}
            <Button label={submitting ? 'Đang lưu…' : 'Đặt lại mật khẩu'} disabled={submitting} onPress={() => void submit()} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
