import type { StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';
import { Text } from './text';

const variants = {
  primary: { box: 'bg-primary-container border-transparent', fg: colors.onPrimary },
  secondary: { box: 'bg-surface-container-lowest border-outline-variant', fg: colors.primary },
  ghost: { box: 'bg-transparent border-transparent', fg: colors.primaryContainer },
  muted: { box: 'bg-surface-container-high border-transparent', fg: colors.primary },
};
const sizes = { sm: 'min-h-9 px-3', md: 'min-h-11 px-[18px]', lg: 'min-h-[52px] px-[18px]' };

type Props = {
  label: string;
  onPress?: () => void;
  variant?: keyof typeof variants;
  icon?: IconName;
  leadingIcon?: IconName;
  size?: keyof typeof sizes;
  /** Thêm class (vd. `flex-1`); muốn đè màu/khoảng cách gốc thì dùng `style`. */
  className?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', icon, leadingIcon, size = 'md', className = '', style, disabled }: Props) {
  const v = variants[variant];
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      className={`flex-row items-center justify-center gap-2 rounded-md border ${v.box} ${sizes[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
      style={style}
    >
      {leadingIcon && <Icon name={leadingIcon} size={18} color={v.fg} />}
      <Text variant="label" weight="semibold" color={v.fg} center className="shrink">
        {label}
      </Text>
      {icon && <Icon name={icon} size={18} color={v.fg} />}
    </PressableScale>
  );
}
