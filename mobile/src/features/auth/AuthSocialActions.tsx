import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';

const providers = [
  { name: 'Google', logo: require('@/assets/images/google-logo.svg') },
  { name: 'Apple', logo: require('@/assets/images/apple-logo.svg') },
];

// shortcut: nút đăng nhập mạng xã hội chỉ là UI, chưa nối OAuth.
export function AuthSocialActions() {
  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-outline-variant" />
        <Text variant="caption" weight="medium" color={colors.onSurfaceVariant}>
          HOẶC TIẾP TỤC BẰNG
        </Text>
        <View className="h-px flex-1 bg-outline-variant" />
      </View>
      <View className="flex-row gap-3">
        {providers.map((p) => (
          <Pressable key={p.name} accessibilityRole="button" className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-md bg-surface-container-lowest shadow-card">
            <Image source={p.logo} className="h-5 w-5" contentFit="contain" />
            <Text variant="label" weight="semibold">
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
