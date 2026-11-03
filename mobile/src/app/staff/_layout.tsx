import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Role } from '@stayreco/shared';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';

// Portal staff chỉ dành cho HOTEL_STAFF; quyền thật vẫn do API kiểm tra.
export default function StaffLayout() {
  const account = useAuthStore((s) => s.account);
  const hydrating = useAuthStore((s) => s.hydrating);

  if (hydrating)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  if (!account) return <Redirect href="/login" />;
  if (account.role !== Role.HOTEL_STAFF) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.surface } }} />;
}
