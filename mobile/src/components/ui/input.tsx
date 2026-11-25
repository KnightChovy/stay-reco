import type { ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '@/constants/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

type Props = TextInputProps & {
  label?: string;
  labelRight?: ReactNode;
  icon?: IconName;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export function Input({ label, labelRight, icon, left, right, className = '', ...props }: Props) {
  return (
    <View className="gap-2">
      {(label || labelRight) && (
        <View className="flex-row items-center justify-between">
          {label && (
            <Text variant="label" weight="semibold">
              {label}
            </Text>
          )}
          {labelRight}
        </View>
      )}
      <View className="min-h-[52px] flex-row items-center gap-2.5 rounded-md border border-surface-container-high bg-surface-container-lowest px-3.5 shadow-card">
        {icon && <Icon name={icon} size={20} color={colors.outline} />}
        {left}
        <TextInput
          placeholderTextColor={colors.outline}
          accessibilityLabel={label}
          className={`flex-1 py-3 font-be-regular text-[15px] text-on-surface ${className}`}
          {...props}
        />
        {right}
      </View>
    </View>
  );
}
