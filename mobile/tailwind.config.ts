import type { Config } from 'tailwindcss';
import { colors, fonts, radius } from './src/constants/theme';

// Token lấy thẳng từ constants/theme.ts: class `bg-primary`, `text-on-surface-variant`, `rounded-lg`, `font-be-semibold`…
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export default {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: Object.fromEntries(Object.entries(colors).map(([k, v]) => [kebab(k), v])),
      borderRadius: Object.fromEntries(Object.entries(radius).map(([k, v]) => [k, `${v}px`])),
      // Font Be Vietnam Pro có file riêng cho từng độ đậm, Android không tự đổi bằng fontWeight.
      fontFamily: Object.fromEntries(Object.entries(fonts).map(([k, v]) => [`be-${k}`, [v]])),
      boxShadow: {
        card: '0px 4px 16px rgba(32, 43, 54, 0.06)',
        floating: '0px 8px 28px rgba(32, 43, 54, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
