import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const spring = { damping: 15, stiffness: 400 };

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Tỉ lệ co lại khi đang chạm. */
  scaleTo?: number;
  entering?: React.ComponentProps<typeof AnimatedPressable>['entering'];
};

/** Pressable co nhẹ khi chạm rồi bật về bằng spring. */
export function PressableScale({ style, scaleTo = 0.96, onPressIn, onPressOut, ...props }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, spring);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, spring);
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    />
  );
}
