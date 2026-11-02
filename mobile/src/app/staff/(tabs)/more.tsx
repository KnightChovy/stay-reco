import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { alerts, checkInGuests, refundRequests, type Tone } from '@/features/staff/data';
import { Avatar, Card, StaffTabScreen, s } from '@/features/staff/ui';
import { useAuthStore } from '@/stores/auth.store';

type Item = { icon: IconName; label: string; href: Href; badge?: number; tone?: Tone };

// Cùng nhóm menu với StaffSidebar bên web.
const groups: { title: string; items: Item[] }[] = [
  {
    title: 'Tác vụ vận hành',
    items: [
      { icon: 'key', label: 'Check-in & Gán phòng', href: '/staff/check-in', badge: checkInGuests.length, tone: 'neutral' },
      { icon: 'logout', label: 'Check-out', href: '/staff/check-out' },
      { icon: 'currency_exchange', label: 'Hoàn tiền & Chính sách', href: '/staff/refunds', badge: refundRequests.filter((r) => r.status === 'Chờ thẩm định').length, tone: 'secondary' },
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
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={[styles.icon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={20} color={color === colors.onSurface ? colors.primary : color} />
      </View>
      <Text variant="label" weight="semibold" color={color} style={s.flex}>
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
        <View style={s.row}>
          <Avatar text={(account?.fullName ?? 'S').trim()[0].toUpperCase()} size={52} bg={colors.primary} fg={colors.onPrimary} />
          <View style={s.flex}>
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
        <View key={g.title} style={styles.group}>
          <Text variant="caption" weight="bold" color={colors.onSurfaceVariant} style={[s.upper, styles.groupTitle]}>
            {g.title}
          </Text>
          <Card style={styles.list}>
            {g.items.map((i, idx) => (
              <View key={i.label} style={idx > 0 && styles.topLine}>
                <Row
                  icon={i.icon}
                  label={i.label}
                  onPress={() => router.push(i.href)}
                  right={
                    <View style={s.row}>
                      {!!i.badge && <Chip label={`${i.badge}`} tone={i.tone} />}
                      <Icon name="chevron_right" size={18} color={colors.outline} />
                    </View>
                  }
                />
              </View>
            ))}
            {g.title === 'Tài khoản' && (
              <View style={styles.topLine}>
                <Row icon="logout" label={signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'} onPress={() => void signOut()} color={colors.error} iconBg={colors.errorContainer} />
              </View>
            )}
          </Card>
        </View>
      ))}
    </StaffTabScreen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  groupTitle: { paddingLeft: 4 },
  list: { gap: 0, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  topLine: { borderTopWidth: 1, borderTopColor: colors.surfaceContainerHigh },
});
