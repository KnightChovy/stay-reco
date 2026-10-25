import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
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

const menu: { title: string; desc: string; icon: IconName; bg: string; fg: string }[] = [
  {
    title: 'Mật khẩu & Bảo mật tài khoản',
    desc: 'Đổi mật khẩu, 2FA & Thiết bị đăng nhập',
    icon: 'security',
    bg: colors.secondaryFixed,
    fg: colors.secondary,
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
    desc: '3 thông báo đặt phòng & ưu đãi mới',
    icon: 'notifications_active',
    bg: colors.tertiaryFixed,
    fg: colors.tertiaryContainer,
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
      <View style={styles.screen}>
        <AppHeader subtitle="Hồ sơ cá nhân" />
        <View style={[styles.card, styles.guest]}>
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
    <View style={styles.screen}>
      <AppHeader subtitle="Hồ sơ cá nhân" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Image source={account.avatarUrl ?? images.avatar} style={styles.avatar} contentFit="cover" />
              <View style={styles.avatarBadge}>
                <Icon name="verified" size={14} color={colors.white} />
              </View>
            </View>
            <View style={[styles.flex, styles.gap4]}>
              <View style={styles.wrapRow}>
                <Text variant="h3" weight="bold">
                  {account.fullName}
                </Text>
                {account.emailVerified && <Chip label="Đã xác thực" tone="tertiary" />}
              </View>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {account.email}
              </Text>
              <View style={styles.row}>
                <Button label="Chỉnh sửa hồ sơ" leadingIcon="edit" variant="muted" size="sm" onPress={editProfile} />
                <Button label="Đổi ảnh" variant="ghost" size="sm" onPress={editProfile} />
              </View>
            </View>
          </View>

          <View style={styles.elite}>
            <View style={styles.between}>
              <View style={styles.row}>
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
            <View style={styles.progress}>
              <View style={styles.progressFill} />
            </View>
            <View style={styles.between}>
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
            <View style={styles.between}>
              <Text variant="h2" color={colors.white}>
                2.450{' '}
                <Text variant="small" color={colors.primaryFixed}>
                  StayMiles
                </Text>
              </Text>
              <Pressable style={styles.redeem}>
                <Icon name="featured_seasonal_and_gifts" size={18} color={colors.white} />
                <Text variant="small" weight="bold" color={colors.white}>
                  Đổi quà
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
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

        <View style={styles.card}>
          <View style={styles.between}>
            <View style={styles.row}>
              <Icon name="badge" size={20} color={colors.primaryContainer} />
              <Text variant="label" weight="bold">
                Hồ sơ định danh cá nhân
              </Text>
            </View>
            <Chip label="Khớp CCCD" tone="tertiary" />
          </View>
          {identity.map((f) => (
            <View key={f.label} style={styles.field}>
              <Text variant="small" color={colors.onSurfaceVariant} style={styles.flex}>
                {f.label}
              </Text>
              <View style={[styles.row, styles.fieldValue]}>
                <Text variant="small" weight="semibold" style={styles.shrink}>
                  {f.value}
                </Text>
                {f.badge && <Chip label={f.badge} tone="tertiary" />}
              </View>
            </View>
          ))}
          <Button label="Chỉnh sửa thông tin cá nhân" leadingIcon="edit_note" variant="muted" onPress={editProfile} />
        </View>

        <View style={styles.card}>
          <View style={styles.between}>
            <View style={[styles.row, styles.shrink]}>
              <Icon name="tune" size={20} color={colors.primaryContainer} />
              <Text variant="label" weight="bold" style={styles.shrink}>
                Cấu hình gợi ý & Gu du lịch StayReco
              </Text>
            </View>
            <Chip label="AI" tone="primary" />
          </View>
          <Text variant="small" color={colors.onSurfaceVariant}>
            Hệ thống cá nhân hóa phòng nghỉ theo sở thích lưu trú của riêng bạn:
          </Text>
          <View style={styles.wrapRow}>
            {tastes.map((t) => (
              <Chip key={t.label} label={t.label} icon={t.icon} tone="neutral" />
            ))}
          </View>
          <Button
            label="Tùy chỉnh gợi ý du lịch"
            leadingIcon="auto_awesome"
            variant="ghost"
            style={styles.tinted}
            onPress={() => router.push('/assistant')}
          />
        </View>

        <View style={[styles.card, styles.menu]}>
          {menu.map((m, i) => (
            <Pressable key={m.title} style={[styles.menuItem, i > 0 && styles.menuDivider]}>
              <View style={[styles.menuIcon, { backgroundColor: m.bg }]}>
                <Icon name={m.icon} size={20} color={m.fg} />
              </View>
              <View style={styles.flex}>
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

        <View style={styles.privacy}>
          <Icon name="shield_with_heart" size={18} color={colors.primaryContainer} />
          <Text variant="caption" color={colors.onSurfaceVariant} style={styles.flex}>
            Dữ liệu định danh được mã hóa chuẩn SSL 256-bit và bảo mật theo Nghị định bảo vệ dữ liệu cá nhân Việt Nam.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: signingOut }}
          disabled={signingOut}
          onPress={signOut}
          style={[styles.logout, signingOut && { opacity: 0.5 }]}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16, paddingBottom: 120 },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  gap4: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrapRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  card: { padding: 16, gap: 14, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  avatar: { width: 76, height: 76, borderRadius: 38 },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tertiaryContainer,
    borderWidth: 2,
    borderColor: colors.white,
  },
  elite: { padding: 16, gap: 10, borderRadius: radius.lg, backgroundColor: colors.primaryContainer },
  progress: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { width: '62%', height: 6, borderRadius: 3, backgroundColor: colors.secondaryContainer },
  redeem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    ...shadow.card,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  fieldValue: { flexShrink: 1, maxWidth: '68%', flexWrap: 'wrap', justifyContent: 'flex-end' },
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tinted: { backgroundColor: colors.surfaceContainerLow },
  menu: { paddingVertical: 4, gap: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  menuDivider: { borderTopWidth: 1, borderTopColor: colors.surfaceContainerHigh },
  menuIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  privacy: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.surfaceContainer },
  guest: { margin: 16, alignItems: 'center' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryFixed,
  },
});
