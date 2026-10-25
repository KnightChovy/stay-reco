import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';

const providers = [
  { name: 'Google', logo: require('@/assets/images/google-logo.svg') },
  { name: 'Apple', logo: require('@/assets/images/apple-logo.svg') },
];

// shortcut: nút đăng nhập mạng xã hội chỉ là UI, chưa nối OAuth.
export function AuthSocialActions() {
  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text variant="caption" weight="medium" color={colors.onSurfaceVariant}>
          HOẶC TIẾP TỤC BẰNG
        </Text>
        <View style={styles.line} />
      </View>
      <View style={styles.row}>
        {providers.map((p) => (
          <Pressable key={p.name} accessibilityRole="button" style={styles.btn}>
            <Image source={p.logo} style={styles.logo} contentFit="contain" />
            <Text variant="label" weight="semibold">
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  logo: { width: 20, height: 20 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
  row: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    ...shadow.card,
  },
});
