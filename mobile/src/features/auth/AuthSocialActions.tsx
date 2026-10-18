import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, radius, shadow } from '@/constants/theme';

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
        {['Google', 'Apple'].map((p) => (
          <Pressable key={p} accessibilityRole="button" style={styles.btn}>
            <Text variant="label" weight="semibold">
              {p}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
  row: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    ...shadow.card,
  },
});
