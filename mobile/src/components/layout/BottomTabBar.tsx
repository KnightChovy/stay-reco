import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Tabs } from 'expo-router/js-tabs';
import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';

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
    <View style={[styles.wrap, { pointerEvents: 'box-none' }, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {items.map((tab) => {
          if (tab.onPress)
            return (
              <PressableScale
                key={tab.name}
                scaleTo={0.9}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                onPress={tab.onPress}
                style={styles.item}
              >
                <View style={styles.raised}>
                  <Icon name={tab.icon} size={24} color={colors.onPrimary} />
                </View>
                <Text variant="caption" weight="semibold" color={colors.primary} style={styles.label}>
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
              style={[styles.item, focused && styles.itemActive]}
            >
              <Icon name={tab.icon} size={22} color={color} />
              {!!tab.badge && (
                <View style={styles.badge}>
                  <Text variant="caption" weight="bold" color={colors.onPrimary} style={styles.badgeText}>
                    {tab.badge}
                  </Text>
                </View>
              )}
              <Text variant="caption" weight={focused ? 'semibold' : 'medium'} color={color} style={styles.label}>
                {tab.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  bar: {
    width: '100%',
    maxWidth: 370,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    ...shadow.floating,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    borderRadius: radius.full,
    // Nền tab đổi màu mượt khi chuyển tab (CSS transition của Reanimated 4).
    transitionProperty: 'backgroundColor',
    transitionDuration: 250,
  },
  itemActive: { backgroundColor: colors.surfaceContainerLow },
  label: { fontSize: 11, lineHeight: 14 },
  raised: {
    width: 52,
    height: 52,
    marginTop: -24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.surface,
    ...shadow.floating,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: '22%',
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  badgeText: { fontSize: 10, lineHeight: 12 },
});
