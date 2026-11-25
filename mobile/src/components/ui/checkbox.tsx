import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
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
      className="shrink flex-row items-start gap-2.5"
    >
      <Icon name={checked ? 'check_box' : 'check_box_outline_blank'} size={22} color={colors.primaryContainer} />
      {children}
    </Pressable>
  );
}
