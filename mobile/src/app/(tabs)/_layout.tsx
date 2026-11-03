import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Role } from '@stayreco/shared';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';

export default function TabsLayout() {
  const role = useAuthStore((s) => s.account?.role);
  // Nhân viên khách sạn dùng portal staff; áp dụng cả khi đăng nhập lẫn khi khôi phục phiên.
  if (role === Role.HOTEL_STAFF) return <Redirect href="/staff" />;

  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false, animation: 'shift', sceneStyle: { backgroundColor: colors.surface } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="trips" />
      <Tabs.Screen name="assistant" />
      <Tabs.Screen name="account" />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}
