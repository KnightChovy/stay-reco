import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { BottomTabBar, type TabItem } from '@/components/layout/BottomTabBar';
import { colors } from '@/constants/theme';
import { conversations } from '@/features/staff/data';

const items: TabItem[] = [
  { name: 'index', label: 'Tổng quan', icon: 'dashboard' },
  { name: 'bookings', label: 'Đặt phòng', icon: 'receipt_long' },
  // Giống nút "Quét QR Voucher" bên web: mở thẳng quy trình check-in.
  { name: 'scan', label: 'Quét QR', icon: 'qr_code_scanner', onPress: () => router.push('/staff/check-in') },
  { name: 'inbox', label: 'Hộp thư', icon: 'inbox', badge: conversations.filter((c) => c.status === 'Chờ phản hồi').length },
  { name: 'more', label: 'Thêm', icon: 'grid_view' },
];

export default function StaffTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} items={items} parents={{}} />}
      screenOptions={{ headerShown: false, animation: 'shift', sceneStyle: { backgroundColor: colors.surface } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
