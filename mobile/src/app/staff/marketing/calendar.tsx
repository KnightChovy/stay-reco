import { View } from 'react-native';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { channels, scheduledPosts, type Tone } from '@/features/staff/data';
import { Avatar, Card, Section, StaffScreen, s } from '@/features/staff/ui';

const statusTone: Record<(typeof scheduledPosts)[number]['status'], Tone> = { 'Chờ đăng': 'warning', 'Đã đăng thành công': 'tertiary', 'Bản nháp': 'neutral' };
const channelColor = Object.fromEntries(channels.map((c) => [c.name.split(' ')[0], c.color]));

export default function StaffMarketingCalendarScreen() {
  return (
    <StaffScreen title="Lịch đăng & kết nối kênh">
      <Section title="Kênh đã kết nối" />
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        {channels.map((c, i) => (
          <View key={c.name} className={`gap-3 py-2.5 ${s.row} ${i > 0 ? 'border-t border-surface-container-high' : ''}`}>
            <Avatar text={c.letter} bg={c.color} fg={colors.onPrimary} />
            <View className={s.flex}>
              <Text variant="label" weight="bold">
                {c.name}
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {c.sub}
              </Text>
            </View>
            <Chip label="Đã kết nối" tone="tertiary" />
          </View>
        ))}
      </Card>

      <Section title="Bài đăng theo lịch (10/2026)" />
      <Text variant="caption" color={colors.onSurfaceVariant}>
        Hệ thống sẽ tự động đăng bài lên các kênh đúng mốc giờ đã chọn.
      </Text>
      {scheduledPosts.map((p) => (
        <Card key={p.id}>
          <View className={s.row}>
            <Avatar text={p.channel[0]} size={32} bg={channelColor[p.channel] ?? colors.primary} fg={colors.onPrimary} />
            <Text variant="caption" weight="semibold" color={colors.onSurfaceVariant} className={s.flex}>
              {p.channel} · {p.scheduledTime}
            </Text>
            <Chip label={p.status} tone={statusTone[p.status]} />
          </View>
          <Text variant="label" weight="bold">
            {p.title}
          </Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Người biên soạn: {p.author}
          </Text>
        </Card>
      ))}
    </StaffScreen>
  );
}
