import { StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';

export function PriceLine({ label, value, tone, icon }: { label: string; value: string; tone?: string; icon?: IconName }) {
  return (
    <View style={styles.between}>
      <View style={[styles.row, styles.flex]}>
        {icon && <Icon name={icon} size={16} color={tone} />}
        <Text variant="small" color={tone ?? colors.onSurfaceVariant}>
          {label}
        </Text>
      </View>
      <Text variant="small" weight="semibold" color={tone}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
