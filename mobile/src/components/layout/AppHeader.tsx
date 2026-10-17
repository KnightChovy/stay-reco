import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <View style={[styles.logo, { width: size, height: size }]}>
      <Icon name="roofing" size={size * 0.55} color={colors.onPrimary} />
    </View>
  );
}

// Header thương hiệu dùng cho các tab chính (logo, tiền tệ, thông báo, tài khoản).
export function AppHeader({ subtitle = 'BOUTIQUE TRAVEL' }: { subtitle?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <BrandMark />
        <View>
          <Text variant="h3" weight="bold" color={colors.primary}>
            StayReco
          </Text>
          <Text variant="caption" weight="medium" color={colors.onSurfaceVariant} style={styles.sub}>
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.pill}>
          <Text variant="caption" weight="semibold" color={colors.primary}>
            VND · VI
          </Text>
        </View>
        <Pressable accessibilityLabel="Thông báo" style={styles.iconBtn}>
          <Icon name="notifications" color={colors.primary} />
          <View style={styles.dot} />
        </Pressable>
        <Pressable
          accessibilityLabel="Tài khoản"
          onPress={() => router.push('/account')}
          style={[styles.iconBtn, styles.avatar]}
        >
          <Icon name="person" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

type ScreenHeaderProps = { title: string; right?: ReactNode };

// Header có nút quay lại cho các màn con.
export function ScreenHeader({ title, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel="Quay lại"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.iconBtn}
        >
          <Icon name="arrow_back" color={colors.onSurface} />
        </Pressable>
        <Text variant="h3" weight="bold">
          {title}
        </Text>
      </View>
      <View style={styles.row}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: {
    borderRadius: radius.md,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sub: { letterSpacing: 1, fontSize: 10, lineHeight: 12 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  avatar: { backgroundColor: colors.primaryContainer, width: 36, height: 36 },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
