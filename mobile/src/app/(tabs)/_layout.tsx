import { Tabs } from 'expo-router/js-tabs';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
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
