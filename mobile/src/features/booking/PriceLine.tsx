import { View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';

export function PriceLine({ label, value, tone, icon }: { label: string; value: string; tone?: string; icon?: IconName }) {
  return (
    <View className="flex-row items-center justify-between gap-2">
      <View className="flex-row items-center gap-2 flex-1">
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
