import { Text as RNText, type TextProps } from 'react-native';
import { colors } from '@/constants/theme';

const variants = {
  hero: 'text-[28px] leading-9 font-be-bold',
  h1: 'text-2xl font-be-bold',
  h2: 'text-xl font-be-bold',
  h3: 'text-[17px] leading-6 font-be-semibold',
  body: 'text-[15px] leading-[22px] font-be-regular',
  label: 'text-sm font-be-medium',
  small: 'text-[13px] leading-[18px] font-be-regular',
  caption: 'text-xs font-be-regular',
  price: 'text-xl font-be-bold tabular-nums',
};
const weights = { regular: 'font-be-regular', medium: 'font-be-medium', semibold: 'font-be-semibold', bold: 'font-be-bold' };

type Props = TextProps & {
  variant?: keyof typeof variants;
  weight?: keyof typeof weights;
  color?: string;
  center?: boolean;
  className?: string;
};

export function Text({ variant = 'body', weight, color = colors.onSurface, center, className = '', style, ...props }: Props) {
  // `weight` thay font của variant: bỏ font-be-* của variant để không có hai class cùng thuộc tính.
  const base = weight ? variants[variant].replace(/font-be-\w+/, weights[weight]) : variants[variant];
  return <RNText className={`${base} ${center ? 'text-center' : ''} ${className}`} style={[{ color }, style]} {...props} />;
}
