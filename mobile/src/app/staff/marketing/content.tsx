import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import { contents, type Platform, type Tone } from '@/features/staff/data';
import { Card, FilterChips, Grid, StaffScreen, Stat, accent, s } from '@/features/staff/ui';

type Tab = 'all' | 'fb' | 'insta' | 'email';
const tabPlatform: Record<Exclude<Tab, 'all'>, Platform> = { fb: 'Facebook', insta: 'Instagram', email: 'Email' };
const statusTone: Record<(typeof contents)[number]['status'], Tone> = { 'Bản nháp': 'neutral', 'Đã duyệt': 'primary', 'Đã xuất bản': 'tertiary' };

export default function StaffMarketingContentScreen() {
  const [tab, setTab] = useState<Tab>('all');
  const list = tab === 'all' ? contents : contents.filter((c) => c.platform === tabPlatform[tab]);

  return (
    <StaffScreen
      title="Thư viện nội dung AI"
      footer={<Button label="Tạo nội dung AI" leadingIcon="auto_awesome" size="lg" style={[s.flex, { backgroundColor: accent }]} onPress={() => router.push('/staff/marketing/editor')} />}
    >
      <Grid>
        <Stat icon="auto_awesome" label="Nội dung đã khởi tạo AI" value="24" unit="bài viết" foot="Tháng 10/2026" tint={accent} />
        <Stat icon="bar_chart" label="Dự đoán tương tác AI" value="92%" unit="điểm cao" foot="Tối ưu tốt" tint={colors.primaryContainer} />
        <Stat icon="send" label="Bài viết đã xuất bản" value={`${contents.filter((c) => c.status === 'Đã xuất bản').length}`} unit="bài" foot="Trên 3 kênh" tint="#2e7d55" />
        <Stat icon="payments" label="Doanh thu chuyển đổi" value="145 tr" unit="₫" foot="ROI 4.8x" />
      </Grid>
      <FilterChips
        items={[
          { key: 'all', label: 'Tất cả' },
          { key: 'fb', label: 'Facebook' },
          { key: 'insta', label: 'Instagram' },
          { key: 'email', label: 'Email' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {list.map((c) => (
        <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={c.title} onPress={() => router.push('/staff/marketing/editor')}>
          <Card>
            <Image source={c.coverImage} style={styles.cover} contentFit="cover" accessibilityLabel={`Ảnh bìa ${c.title}`} />
            <View style={s.wrap}>
              <Chip label={c.platform} tone="primary" />
              <Chip label={c.status} tone={statusTone[c.status]} />
              <Chip label={`AI ${c.aiScore}%`} icon="auto_awesome" tone="secondary" />
            </View>
            <Text variant="label" weight="bold">
              {c.title}
            </Text>
            <Text variant="small" color={colors.onSurfaceVariant} numberOfLines={3}>
              {c.previewText}
            </Text>
            <View style={s.between}>
              <Text variant="caption" color={colors.onSurfaceVariant} style={s.flex}>
                Đối tượng: {c.targetAudience}
              </Text>
              <Text variant="caption" color={colors.outline}>
                {c.updatedAt}
              </Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  cover: { height: 150, borderRadius: radius.md, backgroundColor: colors.surfaceContainer },
});
