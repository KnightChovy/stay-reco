import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { getUnreadCount } from '@/services/notifications.service';
import { useAuthStore } from '@/stores/auth.store';

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <View className="items-center justify-center rounded-md bg-primary-container" style={{ width: size, height: size }}>
      <Icon name="roofing" size={size * 0.55} color={colors.onPrimary} />
    </View>
  );
}

// Header thương hiệu dùng cho các tab chính (logo, tiền tệ, thông báo, tài khoản).
export function AppHeader({ subtitle = 'BOUTIQUE TRAVEL' }: { subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const account = useAuthStore((s) => s.account);
  // shortcut: chỉ tải lại khi mở lại màn/app (staleTime mặc định), thêm push hoặc refetchInterval nếu cần thời gian thực.
  const unread = useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: getUnreadCount, enabled: !!account });
  const unreadCount = account ? (unread.data?.count ?? 0) : 0;
  return (
    <View className="flex-row items-center justify-between bg-surface px-4 pb-2.5" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-2">
        <BrandMark />
        <View>
          <Text variant="h3" weight="bold" color={colors.primary}>
            StayReco
          </Text>
          <Text variant="caption" weight="medium" color={colors.onSurfaceVariant} className="tracking-[1px]" style={{ fontSize: 10, lineHeight: 12 }}>
            {subtitle}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="rounded-full bg-surface-container px-2.5 py-1.5">
          <Text variant="caption" weight="semibold" color={colors.primary}>
            VND · VI
          </Text>
        </View>
        <Pressable
          accessibilityLabel={unreadCount ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
          onPress={() => router.push('/notifications')}
          className="h-10 w-10 items-center justify-center rounded-full"
        >
          <Icon name="notifications" color={colors.primary} />
          {unreadCount > 0 && <View className="absolute right-2.5 top-[9px] h-2 w-2 rounded border-[1.5px] border-surface bg-secondary" />}
        </Pressable>
        <Pressable
          accessibilityLabel="Tài khoản"
          onPress={() => router.push('/account')}
          className="h-9 w-9 items-center justify-center rounded-full bg-primary-container"
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
    <View className="flex-row items-center justify-between bg-surface px-4 pb-2.5" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityLabel="Quay lại"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          className="h-10 w-10 items-center justify-center rounded-full"
        >
          <Icon name="arrow_back" color={colors.onSurface} />
        </Pressable>
        <Text variant="h3" weight="bold">
          {title}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">{right}</View>
    </View>
  );
}
