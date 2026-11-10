import { Fragment } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';

const steps = ['Thông tin', 'Thanh toán', 'Xác nhận'];

export function BookingProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <View className="gap-1.5 bg-surface-container-lowest px-4 py-3">
      <View className="flex-row items-center px-2.5">
        {steps.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <Fragment key={label}>
              {i > 0 && <View className={`h-0.5 flex-1 ${step <= current ? 'bg-primary' : 'bg-surface-container-high'}`} />}
              <View className={`h-7 w-7 items-center justify-center rounded-full ${done || active ? 'bg-primary' : 'bg-surface-container-high'}`}>
                {done ? (
                  <Icon name="check" size={16} color={colors.onPrimary} />
                ) : (
                  <Text variant="caption" weight="bold" color={active ? colors.onPrimary : colors.onSurfaceVariant}>
                    {step}
                  </Text>
                )}
              </View>
            </Fragment>
          );
        })}
      </View>
      <View className="flex-row justify-between">
        {steps.map((label, i) => (
          <Text
            key={label}
            variant="caption"
            weight={i + 1 === current ? 'bold' : 'regular'}
            color={i + 1 === current ? colors.primary : colors.onSurfaceVariant}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
