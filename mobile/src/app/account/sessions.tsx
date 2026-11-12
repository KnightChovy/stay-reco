import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { apiErrorMessage } from '@/services/ApiService';
import { getSessions, revokeSession } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

/** Tên thiết bị đoán từ User-Agent; không nhận ra thì hiện nguyên chuỗi. */
export function deviceName(userAgent: string | null) {
  if (!userAgent) return 'Thiết bị không rõ';
  const known = /iPhone|iPad|Android|Windows|Macintosh|Linux/.exec(userAgent)?.[0];
  return known === 'Macintosh' ? 'Mac' : (known ?? userAgent);
}

const dateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export default function SessionsScreen() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((st) => st.logout);
  const sessions = useQuery({ queryKey: ['auth', 'sessions'], queryFn: getSessions });
  const [error, setError] = useState('');
  const revoke = useMutation({
    mutationFn: revokeSession,
    onMutate: () => setError(''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] }),
    onError: (err) => setError(apiErrorMessage(err, 'Không đăng xuất được thiết bị. Vui lòng thử lại.')),
  });
  const [loggingOut, setLoggingOut] = useState(false);

  const logoutEverywhere = () =>
    Alert.alert('Đăng xuất mọi thiết bị?', 'Máy này cũng sẽ bị đăng xuất.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout(true);
          router.replace('/login');
        },
      },
    ]);

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Thiết Bị Đăng Nhập" />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" showsVerticalScrollIndicator={false}>
        {sessions.isError ? (
          <View className="items-center gap-3 py-6">
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Không tải được danh sách thiết bị. Vui lòng kiểm tra kết nối.
            </Text>
            <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => void sessions.refetch()} />
          </View>
        ) : !sessions.data ? (
          <Text variant="small" color={colors.onSurfaceVariant} center>
            Đang tải...
          </Text>
        ) : (
          sessions.data.map((s) => (
            <View key={s.id} className="gap-1 rounded-lg bg-surface-container-lowest p-4 shadow-card">
              <View className="flex-row items-center justify-between gap-2">
                <Text variant="label" weight="bold" numberOfLines={1} className="flex-1">
                  {deviceName(s.userAgent)}
                </Text>
                {s.current && <Chip label="Thiết bị này" tone="primary" />}
              </View>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Hoạt động gần nhất: {dateTime(s.lastUsedAt)}
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                Đăng nhập: {dateTime(s.createdAt)}
                {s.ip ? ` • IP ${s.ip}` : ''}
              </Text>
              {!s.current && (
                <Button
                  label={revoke.isPending && revoke.variables === s.id ? 'Đang đăng xuất...' : 'Đăng xuất thiết bị này'}
                  leadingIcon="logout"
                  variant="ghost"
                  size="sm"
                  disabled={revoke.isPending}
                  onPress={() => revoke.mutate(s.id)}
                />
              )}
            </View>
          ))
        )}
        {!!error && (
          <Text variant="small" color={colors.error}>
            {error}
          </Text>
        )}
        {!!sessions.data && (
          <Button
            label={loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất mọi thiết bị'}
            leadingIcon="logout"
            variant="secondary"
            disabled={loggingOut}
            onPress={logoutEverywhere}
          />
        )}
      </ScrollView>
    </View>
  );
}
