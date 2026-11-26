import { Redirect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Tabs } from 'expo-router/js-tabs';
import { Role } from '@stayreco/shared';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { colors } from '@/constants/theme';
import { getOnboarding } from '@/services/recommendations.service';
import { useAuthStore } from '@/stores/auth.store';

export default function TabsLayout() {
  const role = useAuthStore((s) => s.account?.role);
  // Khách hàng có onboarding `NEW` phải chọn sở thích trước (bắt buộc từ 2026-11-26, không bỏ qua được): gợi ý của
  // khách chưa ở lần nào bắt đầu từ các câu trả lời này. Quay lại từ màn hình đó cũng chỉ về lại đó.
  const onboarding = useQuery({ queryKey: ['onboarding'], queryFn: getOnboarding, enabled: role === Role.CUSTOMER });
  if (role === Role.CUSTOMER && onboarding.data?.status === 'NEW') return <Redirect href="/onboarding" />;
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
