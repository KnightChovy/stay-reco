import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { getMyHotels } from '@/services/staff.service';

/** Màu nhấn của portal staff bên web (#934a33) cho nút chính. */
export const accent = colors.secondary;
export const success = '#0b5a36';

/** `className` thêm class; muốn đè padding/màu gốc của card thì dùng `style`. */
export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View className={`${s.card} ${className}`} style={style}>
      {children}
    </View>
  );
}

export function CardHead({ icon, title, right }: { icon: IconName; title: string; right?: ReactNode }) {
  return (
    <View className={`${s.between} ${s.headLine}`}>
      <View className={`${s.row} ${s.flex}`}>
        <Icon name={icon} size={16} color={accent} />
        <Text variant="caption" weight="bold" color={colors.onSurfaceVariant} className={s.upper}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

export function KV({ label, value, strong, color, labelColor = colors.onSurfaceVariant }: { label: string; value: ReactNode; strong?: boolean; color?: string; labelColor?: string }) {
  return (
    <View className={`${s.between} ${s.kv}`}>
      <Text variant="small" color={labelColor}>
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text variant="small" weight={strong ? 'bold' : 'medium'} color={color} className={s.kvValue}>
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
    <View className={`${s.between} ${s.section}`}>
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
    <View className={s.banner} style={{ backgroundColor: t.bg }}>
      <Icon name={icon} size={18} color={t.fg} />
      <View className={s.flex}>
        <Text variant="small" weight="bold" color={t.fg}>
          {title}
        </Text>
        <Text variant="caption" color={t.fg} className={s.lh}>
          {text}
        </Text>
      </View>
    </View>
  );
}

export function Stat({ icon, label, value, unit, foot, tint = colors.primary }: { icon: IconName; label: string; value: string; unit: string; foot: string; tint?: string }) {
  return (
    <Card style={{ width: '48.5%', gap: 6, padding: 14 }}>
      <View className={s.row}>
        <Icon name={icon} size={18} color={tint} />
        <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant} className={s.flex}>
          {label}
        </Text>
      </View>
      <View className={`${s.row} ${s.baseline}`}>
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
  return <View className={s.grid}>{children}</View>;
}

export function Avatar({ text, size = 40, bg = colors.surfaceContainerLow, fg = colors.primary }: { text: string; size?: number; bg?: string; fg?: string }) {
  return (
    <View className={s.avatar} style={{ width: size, height: size, backgroundColor: bg }}>
      <Text variant="small" weight="bold" color={fg}>
        {text}
      </Text>
    </View>
  );
}

export function FilterChips<K extends string>({ items, value, onChange }: { items: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={s.chips} className={s.chipsWrap}>
      {items.map((i) => {
        const on = i.key === value;
        return (
          <Pressable
            key={i.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(i.key)}
            className={`${s.filter} ${on ? s.filterOn : s.filterOff}`}
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
    <View className={s.seg}>
      {items.map((i) => {
        const on = i.key === value;
        return (
          <Pressable
            key={i.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(i.key)}
            className={`${s.segItem} ${on ? s.segOn : ''}`}
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
      <Pressable accessibilityLabel="Đóng" className={s.scrim} onPress={onClose} />
      <View className={s.sheet} style={{ paddingBottom: insets.bottom + 16 }}>
        <View className={s.grabber} />
        {title && (
          <View className={s.between}>
            <Text variant="h3" weight="bold" className={s.flex}>
              {title}
            </Text>
            <Pressable accessibilityLabel="Đóng" onPress={onClose} className={s.iconBtn}>
              <Icon name="close" color={colors.onSurface} />
            </Pressable>
          </View>
        )}
        <ScrollView contentContainerClassName={s.sheetBody} keyboardShouldPersistTaps="handled">
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
      <View className={s.successIcon}>
        <Icon name="check" size={32} color="#2e7d55" />
      </View>
      <Text variant="h2" weight="bold" center>
        {title}
      </Text>
      <Text variant="small" color={colors.onSurfaceVariant} center>
        {text}
      </Text>
      <View className={s.rowsBox}>{rows}</View>
      <View className={s.row}>
        <Button label={printLabel} leadingIcon="close" variant="secondary" className={s.flex} onPress={onClose} />
        <Button label="Về bàn làm việc" className={s.flex} style={{ backgroundColor: accent }} onPress={() => router.navigate('/staff')} />
      </View>
    </Sheet>
  );
}

export function StickyBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View className={s.sticky} style={{ paddingBottom: insets.bottom + 12 }}>
      {children}
    </View>
  );
}

/** Màn con: header quay lại + nội dung cuộn + thanh hành động dưới cùng (tuỳ chọn). */
export function StaffScreen({ title, right, footer, children }: { title: string; right?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <View className={s.screen}>
      <ScreenHeader title={title} right={right} />
      <ScrollView contentContainerClassName={s.content} contentContainerStyle={{ paddingBottom: footer ? 120 : 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {footer && <StickyBar>{footer}</StickyBar>}
    </View>
  );
}

/** Khách sạn đang trực: giống StaffHotelProvider bên web, lấy khách sạn đầu tiên nhân viên được phân công. */
export function useStaffHotel() {
  const { data, isPending, isError } = useQuery({ queryKey: ['staff', 'hotels'], queryFn: getMyHotels });
  return { hotel: data?.[0], hotelId: data?.[0]?.id, isPending, isError };
}

/** Màn tab: header khách sạn đang trực + nội dung cuộn chừa chỗ cho tab bar. */
export function StaffTabScreen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { hotel, isPending, isError } = useStaffHotel();
  return (
    <View className={s.screen}>
      <View className={`${s.between} ${s.hotelBar}`} style={{ paddingTop: insets.top + 10 }}>
        <View className={`${s.row} ${s.flex}`}>
          <View className={s.hotelIcon}>
            <Icon name="apartment" size={20} color={colors.onPrimary} />
          </View>
          <View className={s.flex}>
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
        <Pressable accessibilityLabel="Thông báo" onPress={() => router.push('/notifications')} className={s.roundBtn}>
          <Icon name="notifications" color={colors.primary} />
        </Pressable>
      </View>
      <ScrollView contentContainerClassName={`${s.content} ${s.tabContent}`} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

/** Class Tailwind dùng chung của portal staff (thay cho StyleSheet `s` trước đây). */
export const s = {
  screen: 'flex-1 bg-surface',
  content: 'gap-3.5 p-4',
  tabContent: 'pb-[130px] pt-1.5',
  flex: 'flex-1',
  row: 'flex-row items-center gap-2',
  between: 'flex-row items-center justify-between gap-2',
  wrap: 'flex-row flex-wrap gap-1.5',
  baseline: 'items-baseline gap-1',
  lh: 'leading-[18px]',
  upper: 'uppercase tracking-[0.5px]',
  card: 'gap-3 rounded-lg border border-surface-container bg-surface-container-lowest p-4 shadow-card',
  headLine: 'border-b border-surface-container-high pb-2.5',
  kv: 'items-start',
  kvValue: 'shrink text-right',
  section: 'pt-1',
  banner: 'flex-row gap-2.5 rounded-lg p-3.5',
  grid: 'flex-row flex-wrap justify-between gap-y-2.5',
  avatar: 'items-center justify-center rounded-full',
  chipsWrap: '-mx-4 grow-0',
  chips: 'gap-2 px-4',
  filter: 'min-h-[38px] justify-center rounded-full border px-3.5',
  filterOff: 'border-outline-variant bg-surface-container-lowest',
  filterOn: 'border-primary bg-primary',
  seg: 'flex-row rounded-full bg-surface-container p-1',
  segItem: 'min-h-10 flex-1 items-center justify-center rounded-full',
  segOn: 'bg-surface-container-lowest shadow-card',
  scrim: 'flex-1 bg-[rgba(15,23,42,0.6)]',
  sheet: 'max-h-[88%] gap-3 rounded-t-xl bg-surface-container-lowest px-4 pt-2.5',
  sheetBody: 'gap-3.5 pb-1',
  grabber: 'h-1 w-10 self-center rounded-sm bg-outline-variant',
  iconBtn: 'h-11 w-11 items-center justify-center',
  successIcon: 'h-[60px] w-[60px] items-center justify-center self-center rounded-full bg-[#dff3e7]',
  rowsBox: 'gap-2 rounded-lg bg-surface-container-low p-3.5',
  sticky: 'absolute bottom-0 left-0 right-0 flex-row gap-2.5 border-t border-surface-container-high bg-surface-container-lowest px-4 pt-3',
  hotelBar: 'bg-surface px-4 pb-2',
  hotelIcon: 'h-10 w-10 items-center justify-center rounded-xl bg-primary',
  roundBtn: 'h-11 w-11 items-center justify-center rounded-full border border-surface-container-high bg-surface-container-lowest',
  box: 'gap-2 rounded-md bg-surface-container-low p-3',
  divider: 'h-px bg-surface-container-high',
};
