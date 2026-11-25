import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import type { ReviewImage } from '@stayreco/shared';
import { Icon } from '@/components/ui/icon';
import { colors } from '@/constants/theme';

/** Dải ảnh thu nhỏ của một đánh giá; có `onRemove` thì mỗi ảnh kèm nút xóa. */
export function ReviewImages({ images, onRemove }: { images: ReviewImage[]; onRemove?: (imageId: string) => void }) {
  if (images.length === 0) return null;
  return (
    <View className="flex-row flex-wrap gap-2">
      {images.map((img, i) => (
        <View key={img.id}>
          <Image source={img.url} className="h-[72px] w-[72px] rounded-md" contentFit="cover" accessibilityLabel={`Ảnh đánh giá ${i + 1}`} />
          {onRemove && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Xóa ảnh ${i + 1}`}
              hitSlop={8}
              onPress={() => onRemove(img.id)}
              className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/60"
            >
              <Icon name="close" size={14} color={colors.white} />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}
