import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { Icon } from './icon';

type Props = { checked: boolean; onChange: (checked: boolean) => void; children?: ReactNode };

export function Checkbox({ checked, onChange, children }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      hitSlop={8}
      style={styles.row}
    >
      <Icon name={checked ? 'check_box' : 'check_box_outline_blank'} size={22} color={colors.primaryContainer} />
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flexShrink: 1 },
});
