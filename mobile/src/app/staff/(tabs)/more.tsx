import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { alerts, type Tone } from '@/features/staff/data';
import { Avatar, Card, StaffTabScreen, s } from '@/features/staff/ui';
import { useAuthStore } from '@/stores/auth.store';

type Item = { icon: IconName; label: string; href: Href; badge?: number; tone?: Tone };

// Cùng nhóm menu với StaffSidebar bên web.
const groups: { title: string; items: Item[] }[] = [
  {
    title: 'Tác vụ vận hành',
    items: [
      { icon: 'key', label: 'Check-in & Gán phòng', href: '/staff/check-in' },
      { icon: 'logout', label: 'Check-out', href: '/staff/check-out' },
      { icon: 'currency_exchange', label: 'Yêu cầu hoàn tiền', href: '/staff/refunds' },
      { icon: 'warning', label: 'Cảnh báo nghiệp vụ', href: '/staff/alerts', badge: alerts.filter((a) => a.status !== 'Đã giải quyết').length, tone: 'danger' },
    ],
  },
  {
    title: 'Nội dung & Marketing',
    items: [
      { icon: 'auto_awesome', label: 'Thư viện nội dung AI', href: '/staff/marketing/content' },
      { icon: 'calendar_month', label: 'Lịch đăng & Kết nối kênh', href: '/staff/marketing/calendar' },
      { icon: 'bar_chart', label: 'Hiệu quả tiếp thị', href: '/staff/marketing/analytics' },
    ],
  },
  {
    title: 'Tài khoản',
    items: [
      { icon: 'notifications', label: 'Thông báo', href: '/notifications' },
      { icon: 'lock', label: 'Đổi mật khẩu', href: '/account/password' },
    ],
  },
];

function Row({ icon, label, onPress, right, color = colors.onSurface, iconBg = colors.surfaceContainerLow }: { icon: IconName; label: string; onPress: () => void; right?: ReactNode; color?: string; iconBg?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="min-h-14 flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: iconBg }}>
        <Icon name={icon} size={20} color={color === colors.onSurface ? colors.primary : color} />
      </View>
      <Text variant="label" weight="semibold" color={color} className={s.flex}>
        {label}
      </Text>
      {right}
    </Pressable>
  );
}

export default function StaffMoreScreen() {
  const account = useAuthStore((st) => st.account);
  const logout = useAuthStore((st) => st.logout);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    // Hết phiên thì layout staff tự chuyển về màn đăng nhập.
    await logout();
  };

  return (
    <StaffTabScreen>
      <Card>
        <View className={s.row}>
          <Avatar text={(account?.fullName ?? 'S').trim()[0].toUpperCase()} size={52} bg={colors.primary} fg={colors.onPrimary} />
          <View className={s.flex}>
            <Text variant="h3" weight="bold">
              {account?.fullName ?? 'Nhân viên'}
            </Text>
            <Text variant="caption" color={colors.onSurfaceVariant}>
              StayReco Staff · {account?.email}
            </Text>
          </View>
        </View>
      </Card>

      {groups.map((g) => (
        <View key={g.title} className="gap-1.5">
          <Text variant="caption" weight="bold" color={colors.onSurfaceVariant} className={`pl-1 ${s.upper}`}>
            {g.title}
          </Text>
          <Card style={{ gap: 0, paddingVertical: 4 }}>
            {g.items.map((i, idx) => (
              <View key={i.label} className={`${idx > 0 ? 'border-t border-surface-container-high' : ''}`}>
                <Row
                  icon={i.icon}
                  label={i.label}
                  onPress={() => router.push(i.href)}
                  right={
                    <View className={s.row}>
                      {!!i.badge && <Chip label={`${i.badge}`} tone={i.tone} />}
                      <Icon name="chevron_right" size={18} color={colors.outline} />
                    </View>
                  }
                />
              </View>
            ))}
            {g.title === 'Tài khoản' && (
              <View className="border-t border-surface-container-high">
                <Row icon="logout" label={signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'} onPress={() => void signOut()} color={colors.error} iconBg={colors.errorContainer} />
              </View>
            )}
          </Card>
        </View>
      ))}
    </StaffTabScreen>
  );
}
