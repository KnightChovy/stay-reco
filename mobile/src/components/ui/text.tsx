import { Text as RNText, type TextProps } from 'react-native';
import { colors, fonts } from '@/constants/theme';

const variants = {
  hero: { fontSize: 28, lineHeight: 36, fontFamily: fonts.bold },
  h1: { fontSize: 24, lineHeight: 32, fontFamily: fonts.bold },
  h2: { fontSize: 20, lineHeight: 28, fontFamily: fonts.bold },
  h3: { fontSize: 17, lineHeight: 24, fontFamily: fonts.semibold },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.regular },
  label: { fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
  small: { fontSize: 13, lineHeight: 18, fontFamily: fonts.regular },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.regular },
  price: { fontSize: 20, lineHeight: 28, fontFamily: fonts.bold, fontVariant: ['tabular-nums' as const] },
};

type Props = TextProps & {
  variant?: keyof typeof variants;
  weight?: keyof typeof fonts;
  color?: string;
  center?: boolean;
};

export function Text({ variant = 'body', weight, color = colors.onSurface, center, style, ...props }: Props) {
  return (
    <RNText
      style={[
        variants[variant],
        { color },
        weight && { fontFamily: fonts[weight] },
        center && { textAlign: 'center' },
        style,
      ]}
      {...props}
    />
  );
}
