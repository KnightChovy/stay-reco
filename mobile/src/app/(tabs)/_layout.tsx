import { useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Tabs } from 'expo-router/js-tabs';
import { Role } from '@stayreco/shared';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { colors } from '@/constants/theme';
import { getOnboarding } from '@/services/recommendations.service';
import { useAuthStore } from '@/stores/auth.store';

// Mỗi lần mở app chỉ mời onboarding một lần, kể cả khi khách thoát bằng nút quay lại mà không bấm "Để sau".
let onboardingShown = false;

export default function TabsLayout() {
  const role = useAuthStore((s) => s.account?.role);
  // Khách hàng có onboarding `NEW` được mời chọn sở thích (nhận voucher chào mừng) ngay sau khi đăng nhập.
  const onboarding = useQuery({ queryKey: ['onboarding'], queryFn: getOnboarding, enabled: role === Role.CUSTOMER });
  const isNew = onboarding.data?.status === 'NEW';
  useEffect(() => {
    if (!isNew || onboardingShown) return;
    onboardingShown = true;
    router.push('/onboarding');
  }, [isNew]);
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
