import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, radius as radii } from '@/constants/theme';

type Props = { width?: DimensionValue; height?: DimensionValue; radius?: number; style?: StyleProp<ViewStyle> };

/** Khối giữ chỗ nhấp nháy khi chờ dữ liệu; withTiming tự bỏ hiệu ứng khi máy bật giảm chuyển động. */
export function Skeleton({ width = '100%', height = 14, radius = radii.sm, style }: Props) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 800 }), -1, true);
  }, [opacity]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceContainerHigh }, pulse, style]}
    />
  );
}
