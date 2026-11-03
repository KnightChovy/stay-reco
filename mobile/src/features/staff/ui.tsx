import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';
import { getMyHotels } from '@/services/staff.service';

/** Màu nhấn của portal staff bên web (#934a33) cho nút chính. */
export const accent = colors.secondary;
export const success = '#0b5a36';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function CardHead({ icon, title, right }: { icon: IconName; title: string; right?: ReactNode }) {
  return (
    <View style={[s.between, s.headLine]}>
      <View style={[s.row, s.flex]}>
        <Icon name={icon} size={16} color={accent} />
        <Text variant="caption" weight="bold" color={colors.onSurfaceVariant} style={s.upper}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

export function KV({ label, value, strong, color, labelColor = colors.onSurfaceVariant }: { label: string; value: ReactNode; strong?: boolean; color?: string; labelColor?: string }) {
  return (
    <View style={[s.between, s.kv]}>
      <Text variant="small" color={labelColor}>
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text variant="small" weight={strong ? 'bold' : 'medium'} color={color} style={s.kvValue}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

export function Section({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={[s.between, s.section]}>
      <Text variant="h3" weight="bold">
        {title}
      </Text>
      {action && <Button label={action} variant="ghost" size="sm" onPress={onAction} />}
    </View>
  );
}

const banners = {
  amber: { bg: '#fff4e0', fg: '#6b3d00' },
  blue: { bg: '#e3f0fb', fg: '#0b3a5c' },
  danger: { bg: colors.errorContainer, fg: '#5f0006' },
  clay: { bg: '#fff6ee', fg: '#3a2118' },
};

export function Banner({ icon, tone, title, text }: { icon: IconName; tone: keyof typeof banners; title: string; text: string }) {
  const t = banners[tone];
  return (
    <View style={[s.banner, { backgroundColor: t.bg }]}>
      <Icon name={icon} size={18} color={t.fg} />
      <View style={s.flex}>
        <Text variant="small" weight="bold" color={t.fg}>
          {title}
        </Text>
        <Text variant="caption" color={t.fg} style={s.lh}>
          {text}
        </Text>
      </View>
    </View>
  );
}

export function Stat({ icon, label, value, unit, foot, tint = colors.primary }: { icon: IconName; label: string; value: string; unit: string; foot: string; tint?: string }) {
  return (
    <Card style={s.stat}>
      <View style={s.row}>
        <Icon name={icon} size={18} color={tint} />
        <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant} style={s.flex}>
          {label}
        </Text>
      </View>
      <View style={[s.row, s.baseline]}>
        <Text variant="h2" weight="bold">
          {value}
        </Text>
        <Text variant="caption" color={colors.onSurfaceVariant}>
          {unit}
        </Text>
      </View>
      <Text variant="caption" color={colors.onSurfaceVariant}>
        {foot}
      </Text>
    </Card>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  return <View style={s.grid}>{children}</View>;
}

export function Avatar({ text, size = 40, bg = colors.surfaceContainerLow, fg = colors.primary }: { text: string; size?: number; bg?: string; fg?: string }) {
  return (
    <View style={[s.avatar, { width: size, height: size, backgroundColor: bg }]}>
      <Text variant="small" weight="bold" color={fg}>
        {text}
      </Text>
    </View>
  );
}

export function FilterChips<K extends string>({ items, value, onChange }: { items: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={s.chipsWrap}>
      {items.map((i) => {
        const on = i.key === value;
        return (
          <Pressable
            key={i.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(i.key)}
            style={[s.filter, on && s.filterOn]}
          >
            <Text variant="small" weight="semibold" color={on ? colors.onPrimary : colors.onSurface}>
              {i.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Segmented<K extends string>({ items, value, onChange }: { items: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  return (
    <View style={s.seg}>
      {items.map((i) => {
        const on = i.key === value;
        return (
          <Pressable
            key={i.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(i.key)}
            style={[s.segItem, on && s.segOn]}
          >
            <Text variant="small" weight="semibold" color={on ? colors.primary : colors.onSurfaceVariant}>
              {i.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Bottom sheet dùng Modal của RN, thay cho dialog bên web. */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Đóng" style={s.scrim} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.grabber} />
        {title && (
          <View style={s.between}>
            <Text variant="h3" weight="bold" style={s.flex}>
              {title}
            </Text>
            <Pressable accessibilityLabel="Đóng" onPress={onClose} style={s.iconBtn}>
              <Icon name="close" color={colors.onSurface} />
            </Pressable>
          </View>
        )}
        <ScrollView contentContainerStyle={s.sheetBody} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Popup "hoàn tất" dùng chung cho check-in và check-out. */
export function SuccessSheet({ visible, onClose, title, text, rows, printLabel }: { visible: boolean; onClose: () => void; title: string; text: string; rows: ReactNode; printLabel: string }) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={s.successIcon}>
        <Icon name="check" size={32} color="#2e7d55" />
      </View>
      <Text variant="h2" weight="bold" center>
        {title}
      </Text>
      <Text variant="small" color={colors.onSurfaceVariant} center>
        {text}
      </Text>
      <View style={s.rowsBox}>{rows}</View>
      <View style={s.row}>
        <Button label={printLabel} leadingIcon="print" variant="secondary" style={s.flex} onPress={onClose} />
        <Button label="Về bàn làm việc" style={[s.flex, { backgroundColor: accent }]} onPress={() => router.navigate('/staff')} />
      </View>
    </Sheet>
  );
}

export function StickyBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[s.sticky, { paddingBottom: insets.bottom + 12 }]}>{children}</View>;
}

/** Màn con: header quay lại + nội dung cuộn + thanh hành động dưới cùng (tuỳ chọn). */
export function StaffScreen({ title, right, footer, children }: { title: string; right?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <View style={s.screen}>
      <ScreenHeader title={title} right={right} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: footer ? 120 : 40 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {footer && <StickyBar>{footer}</StickyBar>}
    </View>
  );
}

/** Màn tab: header khách sạn đang trực + nội dung cuộn chừa chỗ cho tab bar. */
export function StaffTabScreen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  // Web (StaffHotelProvider) cũng lấy khách sạn đầu tiên nhân viên được phân công.
  const { data, isPending, isError } = useQuery({ queryKey: ['staff', 'hotels'], queryFn: getMyHotels });
  const hotel = data?.[0];
  return (
    <View style={s.screen}>
      <View style={[s.between, s.hotelBar, { paddingTop: insets.top + 10 }]}>
        <View style={[s.row, s.flex]}>
          <View style={s.hotelIcon}>
            <Icon name="apartment" size={20} color={colors.onPrimary} />
          </View>
          <View style={s.flex}>
            <Text variant="label" weight="bold" numberOfLines={1}>
              {hotel?.name ?? (isPending ? 'Đang tải khách sạn…' : isError ? 'Không tải được khách sạn' : 'Chưa được phân công khách sạn')}
            </Text>
            {!!hotel && (
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {hotel.city}
              </Text>
            )}
          </View>
        </View>
        <Pressable accessibilityLabel="Thông báo" onPress={() => router.push('/notifications')} style={s.roundBtn}>
          <Icon name="notifications" color={colors.primary} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[s.content, s.tabContent]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 14 },
  tabContent: { paddingTop: 6, paddingBottom: 130 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  baseline: { alignItems: 'baseline', gap: 4 },
  lh: { lineHeight: 18 },
  upper: { textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    ...shadow.card,
  },
  headLine: { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHigh },
  kv: { alignItems: 'flex-start' },
  kvValue: { flexShrink: 1, textAlign: 'right' },
  section: { paddingTop: 4 },
  banner: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.lg },
  stat: { width: '48.5%', gap: 6, padding: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  avatar: { borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  chipsWrap: { marginHorizontal: -16, flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 16 },
  filter: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  filterOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  seg: { flexDirection: 'row', padding: 4, borderRadius: radius.full, backgroundColor: colors.surfaceContainer },
  segItem: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  segOn: { backgroundColor: colors.surfaceContainerLowest, ...shadow.card },
  scrim: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)' },
  sheet: {
    maxHeight: '88%',
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 12,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surfaceContainerLowest,
  },
  sheetBody: { gap: 14, paddingBottom: 4 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.outlineVariant },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  successIcon: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dff3e7',
  },
  rowsBox: { gap: 8, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLow },
  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  hotelBar: { paddingHorizontal: 16, paddingBottom: 8, backgroundColor: colors.surface },
  hotelIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  box: { gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHigh },
});

