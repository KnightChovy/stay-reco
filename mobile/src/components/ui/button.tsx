import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/constants/theme';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';
import { Text } from './text';

const variants = {
  primary: { bg: colors.primaryContainer, fg: colors.onPrimary, border: 'transparent' },
  secondary: { bg: colors.surfaceContainerLowest, fg: colors.primary, border: colors.outlineVariant },
  ghost: { bg: 'transparent', fg: colors.primaryContainer, border: 'transparent' },
  muted: { bg: colors.surfaceContainerHigh, fg: colors.primary, border: 'transparent' },
};

type Props = {
  label: string;
  onPress?: () => void;
  variant?: keyof typeof variants;
  icon?: IconName;
  leadingIcon?: IconName;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', icon, leadingIcon, size = 'md', style, disabled }: Props) {
  const v = variants[variant];
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border, minHeight: size === 'lg' ? 52 : size === 'sm' ? 36 : 44 },
        size === 'sm' && { paddingHorizontal: 12 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {leadingIcon && <Icon name={leadingIcon} size={18} color={v.fg} />}
      <Text variant="label" weight="semibold" color={v.fg} center style={styles.label}>
        {label}
      </Text>
      {icon && <Icon name={icon} size={18} color={v.fg} />}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  label: { flexShrink: 1 },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
