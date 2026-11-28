import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import type { ContentMetric, ContentSchedule } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import type { IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { ErrorCard, dateTime, marketingError, platformLabels, useMarketingChanged } from '@/features/staff/marketing';
import { Card, Grid, KV, Section, StaffScreen, Stat, accent, s, useStaffHotel } from '@/features/staff/ui';
import { getScheduleMetrics, getSchedules, refreshScheduleMetrics } from '@/services/marketing.service';

// Không hiện lượt xem: Facebook cập nhật số này chậm vài giờ, bài mới luôn ra 0 bên cạnh like và chia sẻ thật.
const figures: { key: 'likes' | 'shares' | 'comments'; label: string; icon: IconName }[] = [
  { key: 'likes', label: 'Lượt thích', icon: 'favorite' },
  { key: 'shares', label: 'Chia sẻ', icon: 'share' },
  { key: 'comments', label: 'Bình luận', icon: 'chat_bubble_outline' },
];

const count = (n: number) => n.toLocaleString('vi-VN');

function PostCard({ schedule, readings, loading }: { schedule: ContentSchedule; readings?: ContentMetric[]; loading: boolean }) {
  const changed = useMarketingChanged();
  const refresh = useMutation({ mutationFn: () => refreshScheduleMetrics(schedule.id), onSuccess: changed });
  const [latest, previous] = readings ?? [];
  return (
    <Card>
      <View className={s.between}>
        <Chip label={platformLabels[schedule.platform]} tone="secondary" />
        <Text variant="caption" color={colors.onSurfaceVariant}>
          {schedule.publishedAt ? `Đăng ${dateTime(schedule.publishedAt)}` : ''}
        </Text>
      </View>
      <Text variant="label" weight="bold" onPress={() => router.push({ pathname: '/staff/marketing/editor', params: { id: schedule.contentId } })}>
        {schedule.title || '(Chưa có tiêu đề)'}
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : latest ? (
        <>
          {figures.map(({ key, label }) => {
            // Mỗi lần đo là một dòng riêng (M15), nên so được với lần đo trước.
            const delta = previous ? latest[key] - previous[key] : 0;
            return <KV key={key} label={label} value={`${count(latest[key])}${delta ? ` (${delta > 0 ? '+' : ''}${count(delta)})` : ''}`} strong />;
          })}
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Cập nhật lúc {dateTime(latest.recordedAt)} · {readings!.length} lần đo
          </Text>
        </>
      ) : (
        <Text variant="small" color={colors.onSurfaceVariant}>
          Chưa có số liệu. Bấm “Cập nhật số liệu” để lấy số mới nhất từ {platformLabels[schedule.platform]}.
        </Text>
      )}
      {refresh.isError && (
        <Text variant="caption" color={colors.error}>
          {marketingError(refresh.error)}
        </Text>
      )}
      <Button label={refresh.isPending ? 'Đang cập nhật…' : 'Cập nhật số liệu'} leadingIcon="refresh" variant="secondary" size="sm" disabled={refresh.isPending} onPress={() => refresh.mutate()} />
    </Card>
  );
}

export default function StaffMarketingAnalyticsScreen() {
  const { hotelId } = useStaffHotel();
  // Mới đăng nhất trước. shortcut: chỉ 20 bài mới nhất (mỗi bài một request số liệu); phân trang khi cần xem bài cũ hơn.
  const published = useQuery({
    queryKey: ['marketing', 'schedules', hotelId, 'analytics'],
    queryFn: () => getSchedules(hotelId!, { pageSize: 20, status: ['PUBLISHED'], sort: 'published-desc' }),
    enabled: !!hotelId,
  });
  const schedules = published.data?.schedules ?? [];
  const metrics = useQueries({
    queries: schedules.map((x) => ({ queryKey: ['marketing', 'metrics', x.id], queryFn: () => getScheduleMetrics(x.id) })),
  });
  // Tổng trên lần đo mới nhất của từng bài đang hiển thị.
  const total = (key: (typeof figures)[number]['key']) => metrics.reduce((sum, q) => sum + (q.data?.[0]?.[key] ?? 0), 0);

  return (
    <StaffScreen title="Hiệu quả tiếp thị">
      <Grid>
        {figures.map(({ key, label, icon }) => (
          <Stat key={key} icon={icon} label={label} value={count(total(key))} unit="" foot={`${schedules.length}/${published.data?.meta.total ?? 0} bài đã đăng`} tint={accent} />
        ))}
      </Grid>
      <Section title="Bài đã đăng" />
      {published.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : published.isError ? (
        <ErrorCard error={published.error} onRetry={() => void published.refetch()} />
      ) : schedules.length === 0 ? (
        <Text variant="small" color={colors.onSurfaceVariant} center>
          Chưa có bài nào được đăng. Bài được lên lịch ở Lịch đăng sẽ xuất hiện tại đây sau khi đăng thành công.
        </Text>
      ) : (
        schedules.map((x, i) => <PostCard key={x.id} schedule={x} readings={metrics[i]?.data} loading={metrics[i]?.isPending ?? true} />)
      )}
    </StaffScreen>
  );
}
