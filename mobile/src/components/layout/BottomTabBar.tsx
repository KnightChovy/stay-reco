import type { ComponentProps } from 'react';
import { View } from 'react-native';
import type { Tabs } from 'expo-router/js-tabs';
import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';

// expo-router không export public kiểu props của tabBar nên suy ra từ Tabs.
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export type TabItem = {
  name: string;
  label: string;
  icon: IconName;
  badge?: number;
  /** Nút nổi ở giữa: chạy hành động riêng thay vì chuyển tab. */
  onPress?: () => void;
};

const tabs: TabItem[] = [
  { name: 'index', label: 'Khám phá', icon: 'explore' },
  { name: 'trips', label: 'Chuyến đi', icon: 'luggage' },
  { name: 'assistant', label: 'Trợ lý AI', icon: 'auto_awesome' },
  { name: 'account', label: 'Tài khoản', icon: 'account_circle' },
];

// Màn ẩn khỏi tab bar vẫn sáng tab cha của nó.
const parentTab: Record<string, string> = { search: 'index', confirmation: 'trips' };

type Props = BottomTabBarProps & { items?: TabItem[]; parents?: Record<string, string> };

export function BottomTabBar({ state, navigation, insets, items = tabs, parents = parentTab }: Props) {
  const current = state.routes[state.index].name;
  const active = parents[current] ?? current;

  return (
    <View className="absolute left-4 right-4 items-center" style={{ pointerEvents: 'box-none', bottom: Math.max(insets.bottom, 12) }}>
      <View className="w-full max-w-[370px] flex-row justify-between rounded-full border border-surface-container-high bg-white/95 p-1.5 shadow-floating">
        {items.map((tab) => {
          if (tab.onPress)
            return (
              <PressableScale
                key={tab.name}
                scaleTo={0.9}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                onPress={tab.onPress}
                className="flex-1 items-center gap-0.5 rounded-full py-1.5"
              >
                <View className="-mt-6 h-[52px] w-[52px] items-center justify-center rounded-full border-4 border-surface bg-primary shadow-floating">
                  <Icon name={tab.icon} size={24} color={colors.onPrimary} />
                </View>
                <Text variant="caption" weight="semibold" color={colors.primary} style={{ fontSize: 11, lineHeight: 14 }}>
                  {tab.label}
                </Text>
              </PressableScale>
            );
          const focused = active === tab.name;
          const color = focused ? colors.primaryContainer : colors.outline;
          return (
            <PressableScale
              key={tab.name}
              scaleTo={0.9}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.badge ? `${tab.label}, ${tab.badge} mục mới` : tab.label}
              onPress={() => navigation.navigate(tab.name)}
              className={`flex-1 items-center gap-0.5 rounded-full py-1.5 ${focused ? 'bg-surface-container-low' : ''}`}
              // Nền tab đổi màu mượt khi chuyển tab (CSS transition của Reanimated 4).
              style={{ transitionProperty: 'backgroundColor', transitionDuration: 250 }}
            >
              <Icon name={tab.icon} size={22} color={color} />
              {!!tab.badge && (
                <View className="absolute right-[22%] top-0.5 h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1">
                  <Text variant="caption" weight="bold" color={colors.onPrimary} style={{ fontSize: 10, lineHeight: 12 }}>
                    {tab.badge}
                  </Text>
                </View>
              )}
              <Text variant="caption" weight={focused ? 'semibold' : 'medium'} color={color} style={{ fontSize: 11, lineHeight: 14 }}>
                {tab.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
