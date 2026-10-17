import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';

const steps = ['Thông tin', 'Thanh toán', 'Xác nhận'];

export function BookingProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {steps.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <Fragment key={label}>
              {i > 0 && <View style={[styles.line, step <= current && styles.lineDone]} />}
              <View style={[styles.circle, (done || active) && styles.circleActive]}>
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
      <View style={styles.labels}>
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

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 12, gap: 6, backgroundColor: colors.surfaceContainerLowest },
  track: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  line: { flex: 1, height: 2, backgroundColor: colors.surfaceContainerHigh },
  lineDone: { backgroundColor: colors.primary },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
  },
  circleActive: { backgroundColor: colors.primary },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
});
