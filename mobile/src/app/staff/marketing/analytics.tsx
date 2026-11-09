import { View } from 'react-native';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { aiRecommendation, marketingKpis as k, topPosts } from '@/features/staff/data';
import { Banner, Card, Grid, Section, StaffScreen, Stat, accent } from '@/features/staff/ui';
import { formatVnd } from '@/lib/stay';

export default function StaffMarketingAnalyticsScreen() {
  return (
    <StaffScreen title="Hiệu quả tiếp thị">
      <Grid>
        <Stat icon="payments" label="Doanh thu từ Marketing" value={`${k.revenue / 1e6} tr`} unit="₫" foot="Tháng 10/2026" />
        <Stat icon="receipt_long" label="Lượt đặt phòng từ Camp" value={`${k.bookings}`} unit="booking" foot="Tăng trưởng" tint="#2e7d55" />
        <Stat icon="bar_chart" label="Tỷ lệ chuyển đổi (CVR)" value={k.cvr} unit="" foot={`${k.clicks} Clicks`} tint={colors.primaryContainer} />
        <Stat icon="auto_awesome" label="Chỉ số ROI trung bình" value={k.roi} unit="ROI" foot="Trên 3 kênh" tint={accent} />
      </Grid>
      <Banner icon="auto_awesome" tone="clay" title="AI Recommendation" text={aiRecommendation} />

      <Section title="Bài viết chuyển đổi cao nhất" />
      <Card style={{ gap: 0, paddingVertical: 2 }}>
        {topPosts.map((p, i) => (
          <View key={p.rank} className={`flex-row gap-3 py-3 ${i > 0 ? 'border-t border-surface-container-high' : ''}`}>
            <View className={`h-7 w-7 items-center justify-center rounded-lg ${p.rank === 1 ? 'bg-primary' : 'bg-surface-container-low'}`}>
              <Text variant="small" weight="bold" color={p.rank === 1 ? colors.onPrimary : colors.primary}>
                {p.rank}
              </Text>
            </View>
            <View className="flex-1 gap-1.5">
              <Text variant="small" weight="bold">
                {p.title}
              </Text>
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {p.platform} · {p.clicks} clicks · {p.bookings} booking
              </Text>
              <View className="flex-row items-center justify-between">
                <Text variant="small" weight="bold">
                  {formatVnd(p.revenue)}
                </Text>
                <Chip label={`ROI ${p.roi}`} tone="tertiary" />
              </View>
            </View>
          </View>
        ))}
      </Card>
    </StaffScreen>
  );
}
