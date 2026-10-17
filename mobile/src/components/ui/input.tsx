import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radius, shadow } from '@/constants/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

type Props = TextInputProps & {
  label?: string;
  labelRight?: ReactNode;
  icon?: IconName;
  left?: ReactNode;
  right?: ReactNode;
};

export function Input({ label, labelRight, icon, left, right, style, ...props }: Props) {
  return (
    <View style={styles.wrap}>
      {(label || labelRight) && (
        <View style={styles.labelRow}>
          {label && (
            <Text variant="label" weight="semibold">
              {label}
            </Text>
          )}
          {labelRight}
        </View>
      )}
      <View style={styles.field}>
        {icon && <Icon name={icon} size={20} color={colors.outline} />}
        {left}
        <TextInput
          placeholderTextColor={colors.outline}
          accessibilityLabel={label}
          style={[styles.input, style]}
          {...props}
        />
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    ...shadow.card,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.onSurface, paddingVertical: 12 },
});
