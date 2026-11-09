import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

const tones = {
  primary: { bg: 'bg-primary-fixed', fg: colors.primaryContainer },
  secondary: { bg: 'bg-secondary-fixed', fg: colors.onSecondaryContainer },
  tertiary: { bg: 'bg-tertiary-fixed', fg: colors.onTertiaryFixedVariant },
  neutral: { bg: 'bg-surface-container', fg: colors.onSurfaceVariant },
  selected: { bg: 'bg-primary-container', fg: colors.onPrimary },
  outline: { bg: 'bg-surface-container-lowest border border-outline-variant', fg: colors.onSurfaceVariant },
  warning: { bg: 'bg-[#fff0d9]', fg: '#7a4600' },
  danger: { bg: 'bg-error-container', fg: '#8c0009' },
};

type Props = {
  label: string;
  icon?: IconName;
  tone?: keyof typeof tones;
  onPress?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, icon, tone = 'neutral', onPress, className = '', style }: Props) {
  const t = tones[tone];
  const content = (
    <>
      {icon && <Icon name={icon} size={14} color={t.fg} />}
      <Text variant="caption" weight="medium" color={t.fg}>
        {label}
      </Text>
    </>
  );
  const cls = `flex-row items-center self-start gap-1 px-2.5 py-[5px] rounded-full ${t.bg} ${className}`;
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} className={cls} style={style}>
      {content}
    </Pressable>
  ) : (
    <View className={cls} style={style}>
      {content}
    </View>
  );
}
