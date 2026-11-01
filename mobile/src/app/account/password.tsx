import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import type { AxiosError } from 'axios';
import { changePasswordSchema } from '@stayreco/shared';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { changePassword } from '@/services/auth.service';

type ApiError = AxiosError<{ code?: string; message?: string }>;

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const input = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!input.success) {
      setError(currentPassword ? 'Mật khẩu mới cần tối thiểu 8 ký tự, có cả chữ và số.' : 'Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (confirm !== newPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await changePassword(input.data);
      Alert.alert('Đã đổi mật khẩu', 'Các thiết bị khác đã được đăng xuất.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) {
      const body = (err as ApiError).response?.data;
      setError(
        body?.code === 'AUTH_WRONG_PASSWORD'
          ? 'Mật khẩu hiện tại không đúng.'
          : body?.message || 'Không đổi được mật khẩu. Vui lòng kiểm tra kết nối và thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Đổi mật khẩu" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label="Mật khẩu hiện tại"
          icon="lock"
          secureTextEntry
          autoComplete="current-password"
          value={currentPassword}
          onChangeText={setCurrent}
        />
        <Input
          label="Mật khẩu mới"
          icon="password"
          secureTextEntry
          autoComplete="new-password"
          value={newPassword}
          onChangeText={setNew}
        />
        <Input
          label="Xác nhận mật khẩu mới"
          icon="password"
          secureTextEntry
          autoComplete="new-password"
          value={confirm}
          onChangeText={setConfirm}
        />
        <Text variant="caption" color={colors.onSurfaceVariant}>
          Tối thiểu 8 ký tự, có cả chữ và số. Máy này vẫn đăng nhập, các thiết bị khác sẽ bị đăng xuất.
        </Text>
        {!!error && (
          <Text variant="small" color={colors.error}>
            {error}
          </Text>
        )}
        <Button
          label={submitting ? 'Đang lưu...' : 'Đổi mật khẩu'}
          leadingIcon="lock_reset"
          size="lg"
          disabled={submitting}
          onPress={() => void submit()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16 },
});
