import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { ScheduleStatus } from '@stayreco/shared';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { ErrorCard, ScheduleCard, dateTime, marketingError, platformLabels } from '@/features/staff/marketing';
import { Card, FilterChips, Section, StaffScreen, s, useStaffHotel } from '@/features/staff/ui';
import { getSchedules, getSocialAccounts } from '@/services/marketing.service';

type Tab = 'upcoming' | 'published' | 'failed' | 'all';
const tabs: { key: Tab; label: string; status?: ScheduleStatus[]; sort?: 'published-desc' }[] = [
  { key: 'upcoming', label: 'Chờ đăng', status: ['SCHEDULED', 'PUBLISHING'] },
  { key: 'published', label: 'Đã đăng', status: ['PUBLISHED'], sort: 'published-desc' },
  { key: 'failed', label: 'Đăng lỗi', status: ['FAILED'] },
  { key: 'all', label: 'Tất cả' },
];

export default function StaffMarketingCalendarScreen() {
  const { hotelId } = useStaffHotel();
  const [tab, setTab] = useState<Tab>('upcoming');
  const current = tabs.find((t) => t.key === tab);
  const accounts = useQuery({ queryKey: ['marketing', 'accounts', hotelId], queryFn: () => getSocialAccounts(hotelId!), enabled: !!hotelId });
  // shortcut: một trang 100 lịch (tối đa của API), không tải thêm; phân trang khi khách sạn có hơn 100 lịch mỗi mục.
  const schedules = useQuery({
    queryKey: ['marketing', 'schedules', hotelId, tab],
    queryFn: () => getSchedules(hotelId!, { pageSize: 100, status: current?.status, sort: current?.sort }),
    enabled: !!hotelId,
    // Job đăng bài chạy mỗi phút: còn bài đang chờ thì lịch tự theo dõi.
    refetchInterval: (query) => (query.state.data?.schedules.some((x) => x.status === 'SCHEDULED' || x.status === 'PUBLISHING') ? 20000 : false),
  });

  return (
    <StaffScreen title="Lịch đăng & kênh">
      <Section title="Kênh đã kết nối" />
      {accounts.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : accounts.isError ? (
        <Text variant="small" color={colors.error}>
          {marketingError(accounts.error, 'Không tải được các trang đã kết nối.')}
        </Text>
      ) : accounts.data.length === 0 ? (
        <Text variant="small" color={colors.onSurfaceVariant}>
          Chưa có trang nào được kết nối.
        </Text>
      ) : (
        <Card style={{ gap: 0, paddingVertical: 4 }}>
          {accounts.data.map((a, i) => (
            <View key={a.id} className={`gap-3 py-2.5 ${s.row} ${i > 0 ? 'border-t border-surface-container-high' : ''}`}>
              <View className={s.flex}>
                <Text variant="label" weight="bold">
                  {platformLabels[a.platform]} · {a.accountName}
                </Text>
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {a.expiresAt ? `Hết hạn ${dateTime(a.expiresAt)}` : 'Không có hạn token'}
                </Text>
              </View>
              <Chip label={a.usable ? 'Đang hoạt động' : 'Token hết hạn'} tone={a.usable ? 'tertiary' : 'danger'} />
            </View>
          ))}
        </Card>
      )}
      <Text variant="caption" color={colors.onSurfaceVariant}>
        Chỉ chủ khách sạn mới kết nối hoặc ngắt kết nối trang. TikTok chỉ nhận video nên chưa hỗ trợ đăng bài.
      </Text>

      <Section title="Bài đăng theo lịch" action="Làm mới" onAction={() => void schedules.refetch()} />
      <Text variant="caption" color={colors.onSurfaceVariant}>
        Hệ thống tự đăng mỗi phút; bài lỗi ghi rõ lý do từ nền tảng và không tự thử lại.
      </Text>
      <FilterChips items={tabs} value={tab} onChange={setTab} />
      {schedules.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : schedules.isError ? (
        <ErrorCard error={schedules.error} onRetry={() => void schedules.refetch()} />
      ) : schedules.data.schedules.length === 0 ? (
        <Text variant="small" color={colors.onSurfaceVariant} center>
          Chưa có bài nào ở mục này. Mở một bài đã được duyệt trong Thư viện nội dung để lên lịch đăng.
        </Text>
      ) : (
        schedules.data.schedules.map((item) => <ScheduleCard key={item.id} schedule={item} showContent />)
      )}
    </StaffScreen>
  );
}
