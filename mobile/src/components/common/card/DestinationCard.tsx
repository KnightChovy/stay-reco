import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';

export type DestinationCardProps = { name: string; count: number; image: string };

export function DestinationCard({ name, count, image }: DestinationCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/search', params: { destination: name } })} style={styles.card}>
      <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.overlay} />
      <View style={styles.text}>
        <Text variant="h3" weight="bold" color={colors.white}>
          {name}
        </Text>
        <Text variant="caption" color={colors.white}>
          {count} boutique stays
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, aspectRatio: 1.15, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.28)' },
  text: { padding: 12 },
});
