import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';

export type DestinationCardProps = { name: string; count: number; image: string };

export function DestinationCard({ name, count, image }: DestinationCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/search', params: { destination: name } })} className="flex-1 aspect-[1.15] justify-end overflow-hidden rounded-lg">
      <Image source={image} className="absolute inset-0" contentFit="cover" />
      <View className="absolute inset-0 bg-black/[0.28]" />
      <View className="p-3">
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
