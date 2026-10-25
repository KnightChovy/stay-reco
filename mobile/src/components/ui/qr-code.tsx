import { useMemo } from 'react';
import { View } from 'react-native';
import { toQR } from 'toqr';
import { colors } from '@/constants/theme';

/** QR vẽ bằng View: toQR trả ma trận vuông 0/1 dạng phẳng. */
export function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const rows = useMemo(() => {
    const cells = toQR(value);
    const n = Math.sqrt(cells.length);
    return Array.from({ length: n }, (_, y) => Array.from(cells.subarray(y * n, (y + 1) * n)));
  }, [value]);
  const cell = size / rows.length;
  return (
    <View accessibilityRole="image" accessibilityLabel="Mã QR check-in" style={{ width: size, height: size }}>
      {rows.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.map((on, x) => (
            <View key={x} style={{ width: cell, height: cell, backgroundColor: on ? colors.primary : colors.white }} />
          ))}
        </View>
      ))}
    </View>
  );
}
