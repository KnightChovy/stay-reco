import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { images } from '@/lib/mock-data';
import { useAuthStore } from '@/stores/auth.store';

const stats: { value: string; label: string; icon: IconName; bg: string; fg: string }[] = [
  { value: '8', label: 'Kỳ nghỉ vui', icon: 'bed', bg: colors.primaryFixed, fg: colors.primaryContainer },
  { value: '3', label: 'Voucher 15%', icon: 'confirmation_number', bg: colors.secondaryFixed, fg: colors.secondary },
  { value: '24/7', label: 'Trợ lý riêng', icon: 'support_agent', bg: colors.tertiaryFixed, fg: colors.tertiaryContainer },
];


const tastes: { label: string; icon: IconName }[] = [
  { label: 'Gu yên tĩnh & cách âm', icon: 'volume_off' },
  { label: 'View sông / hoàng hôn', icon: 'water' },
  { label: 'Bữa sáng hữu cơ', icon: 'restaurant' },
  { label: '1.5tr - 3.0tr / đêm', icon: 'payments' },
];

const menu: { title: string; desc: string; icon: IconName; bg: string; fg: string; href?: '/notifications' | '/account/password' }[] = [
  {
    title: 'Mật khẩu & Bảo mật tài khoản',
    desc: 'Đổi mật khẩu & đăng xuất các thiết bị khác',
    icon: 'security',
    bg: colors.secondaryFixed,
    fg: colors.secondary,
    href: '/account/password',
  },
  {
    title: 'Voucher & Điểm thưởng',
    desc: '4 voucher khả dụng • 2.450 StayMiles',
    icon: 'loyalty',
    bg: colors.primaryFixed,
    fg: colors.primaryContainer,
  },
  {
    title: 'Trung tâm thông báo',
    desc: 'Đặt phòng, thanh toán & hoàn tiền',
    icon: 'notifications_active',
    bg: colors.tertiaryFixed,
    fg: colors.tertiaryContainer,
    href: '/notifications',
  },
];

export default function AccountScreen() {
  const editProfile = () => router.push('/account/profile');
  const account = useAuthStore((s) => s.account);
  const hydrating = useAuthStore((s) => s.hydrating);
  const logout = useAuthStore((s) => s.logout);
  const [signingOut, setSigningOut] = useState(false);
  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await logout();
    setSigningOut(false);
    router.replace('/login');
  };
  const identity: { label: string; value: string; badge?: string }[] = account
    ? [
        { label: 'Họ và tên đầy đủ', value: account.fullName },
        { label: 'Email liên hệ', value: account.email, badge: account.emailVerified ? 'Đã xác thực' : undefined },
        { label: 'Số điện thoại', value: account.phone ?? 'Chưa cập nhật' },
      ]
    : [];

  if (!account) {
    return (
      <View className="flex-1 bg-surface">
        <AppHeader subtitle="Hồ sơ cá nhân" />
        <View className="gap-3.5 rounded-lg bg-surface-container-lowest p-4 shadow-card m-4 items-center">
          {hydrating ? (
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Đang tải hồ sơ...
            </Text>
          ) : (
            <>
              <Text variant="small" color={colors.onSurfaceVariant} center>
                Đăng nhập để xem hồ sơ và quản lý đặt phòng.
              </Text>
              <Button label="Đăng nhập" leadingIcon="login" onPress={() => router.push('/login')} />
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <AppHeader subtitle="Hồ sơ cá nhân" />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-[120px]" showsVerticalScrollIndicator={false}>
        <View className="gap-3.5 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <View className="flex-row items-center gap-2">
            <View>
              <Image source={account.avatarUrl ?? images.avatar} className="h-[76px] w-[76px] rounded-full" contentFit="cover" />
              <View className="absolute -bottom-0.5 -right-0.5 h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white bg-tertiary-container">
                <Icon name="verified" size={14} color={colors.white} />
              </View>
            </View>
            <View className="flex-1 gap-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text variant="h3" weight="bold">
                  {account.fullName}
                </Text>
                {account.emailVerified && <Chip label="Đã xác thực" tone="tertiary" />}
              </View>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {account.email}
              </Text>
              <View className="flex-row items-center gap-2">
                <Button label="Chỉnh sửa hồ sơ" leadingIcon="edit" variant="muted" size="sm" onPress={editProfile} />
                <Button label="Đổi ảnh" variant="ghost" size="sm" onPress={editProfile} />
              </View>
            </View>
          </View>

          <View className="gap-2.5 rounded-lg bg-primary-container p-4">
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-row items-center gap-2">
                <Icon name="stars" size={22} color={colors.secondaryContainer} />
                <View>
                  <Text variant="caption" weight="semibold" color={colors.onPrimaryContainer}>
                    HỘI VIÊN ĐẶC QUYỀN
                  </Text>
                  <Text variant="label" weight="bold" color={colors.white}>
                    StayReco Elite • Hạng Bạc
                  </Text>
                </View>
              </View>
              <Chip label="Cấp 2/4" tone="neutral" />
            </View>
            <View className="h-1.5 rounded-[3px] bg-white/20">
              <View className="h-1.5 w-[62%] rounded-[3px] bg-secondary-container" />
            </View>
            <View className="flex-row items-center justify-between gap-2">
              <Text variant="caption" color={colors.primaryFixed}>
                Còn 550 điểm để lên{' '}
                <Text variant="caption" weight="bold" color={colors.white}>
                  Hạng Vàng
                </Text>
              </Text>
              <Text variant="caption" weight="bold" color={colors.white}>
                62%
              </Text>
            </View>
            <View className="flex-row items-center justify-between gap-2">
              <Text variant="h2" color={colors.white}>
                2.450{' '}
                <Text variant="small" color={colors.primaryFixed}>
                  StayMiles
                </Text>
              </Text>
              <Pressable className="flex-row items-center gap-1.5 rounded-md bg-secondary px-3.5 py-2">
                <Icon name="featured_seasonal_and_gifts" size={18} color={colors.white} />
                <Text variant="small" weight="bold" color={colors.white}>
                  Đổi quà
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {stats.map((s) => (
            <View key={s.label} className="flex-1 items-center gap-1 rounded-lg bg-surface-container-lowest py-3.5 shadow-card">
              <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: s.bg }}>
                <Icon name={s.icon} size={18} color={s.fg} />
              </View>
              <Text variant="h2" color={s.fg === colors.primaryContainer ? colors.onSurface : s.fg}>
                {s.value}
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        <View className="gap-3.5 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2">
              <Icon name="badge" size={20} color={colors.primaryContainer} />
              <Text variant="label" weight="bold">
                Hồ sơ định danh cá nhân
              </Text>
            </View>
            <Chip label="Khớp CCCD" tone="tertiary" />
          </View>
          {identity.map((f) => (
            <View key={f.label} className="flex-row items-center justify-between gap-3">
              <Text variant="small" color={colors.onSurfaceVariant} className="flex-1">
                {f.label}
              </Text>
              <View className="flex-row items-center gap-2 max-w-[68%] shrink flex-wrap justify-end">
                <Text variant="small" weight="semibold" className="shrink">
                  {f.value}
                </Text>
                {f.badge && <Chip label={f.badge} tone="tertiary" />}
              </View>
            </View>
          ))}
          <Button label="Chỉnh sửa thông tin cá nhân" leadingIcon="edit_note" variant="muted" onPress={editProfile} />
        </View>

        <View className="gap-3.5 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2 shrink">
              <Icon name="tune" size={20} color={colors.primaryContainer} />
              <Text variant="label" weight="bold" className="shrink">
                Cấu hình gợi ý & Gu du lịch StayReco
              </Text>
            </View>
            <Chip label="AI" tone="primary" />
          </View>
          <Text variant="small" color={colors.onSurfaceVariant}>
            Hệ thống cá nhân hóa phòng nghỉ theo sở thích lưu trú của riêng bạn:
          </Text>
          <View className="flex-row flex-wrap items-center gap-2">
            {tastes.map((t) => (
              <Chip key={t.label} label={t.label} icon={t.icon} tone="neutral" />
            ))}
          </View>
          <Button
            label="Tùy chỉnh gợi ý du lịch"
            leadingIcon="auto_awesome"
            variant="ghost"
            style={{ backgroundColor: colors.surfaceContainerLow }}
            onPress={() => router.push('/assistant')}
          />
        </View>

        <View className="gap-3.5 rounded-lg bg-surface-container-lowest p-4 shadow-card" style={{ paddingVertical: 4, gap: 0 }}>
          {menu.map((m, i) => (
            <Pressable
              key={m.title}
              accessibilityRole="button"
              onPress={m.href ? () => router.push(m.href!) : undefined}
              className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-surface-container-high' : ''}`}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: m.bg }}>
                <Icon name={m.icon} size={20} color={m.fg} />
              </View>
              <View className="flex-1">
                <Text variant="small" weight="semibold">
                  {m.title}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {m.desc}
                </Text>
              </View>
              <Icon name="chevron_right" size={20} color={colors.outline} />
            </Pressable>
          ))}
        </View>

        <View className="flex-row gap-2.5 rounded-md bg-surface-container p-3.5">
          <Icon name="shield_with_heart" size={18} color={colors.primaryContainer} />
          <Text variant="caption" color={colors.onSurfaceVariant} className="flex-1">
            Dữ liệu định danh được mã hóa chuẩn SSL 256-bit và bảo mật theo Nghị định bảo vệ dữ liệu cá nhân Việt Nam.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: signingOut }}
          disabled={signingOut}
          onPress={signOut}
          className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-md bg-secondary-fixed" style={signingOut && { opacity: 0.5 }}
        >
          <Icon name="logout" size={18} color={colors.secondary} />
          <Text variant="label" weight="bold" color={colors.secondary}>
            {signingOut ? 'Đang đăng xuất...' : 'Đăng xuất tài khoản'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
