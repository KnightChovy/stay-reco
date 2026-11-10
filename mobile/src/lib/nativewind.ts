import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { cssInterop } from 'nativewind';

// Component ngoài React Native core phải đăng ký thì `className` mới thành `style`.
cssInterop(Image, { className: 'style' });
cssInterop(Animated.View, { className: 'style' });
