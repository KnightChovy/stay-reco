import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/constants/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

const tones = {
  primary: { bg: colors.primaryFixed, fg: colors.primaryContainer },
  secondary: { bg: colors.secondaryFixed, fg: colors.onSecondaryContainer },
  tertiary: { bg: colors.tertiaryFixed, fg: colors.onTertiaryFixedVariant },
  neutral: { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant },
  selected: { bg: colors.primaryContainer, fg: colors.onPrimary },
  outline: { bg: colors.surfaceContainerLowest, fg: colors.onSurfaceVariant },
};

type Props = {
  label: string;
  icon?: IconName;
  tone?: keyof typeof tones;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, icon, tone = 'neutral', onPress, style: extra }: Props) {
  const t = tones[tone];
  const content = (
    <>
      {icon && <Icon name={icon} size={14} color={t.fg} />}
      <Text variant="caption" weight="medium" color={t.fg}>
        {label}
      </Text>
    </>
  );
  const style = [styles.chip, { backgroundColor: t.bg }, tone === 'outline' && styles.outline, extra];
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={style}>
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  outline: { borderWidth: 1, borderColor: colors.outlineVariant },
});
