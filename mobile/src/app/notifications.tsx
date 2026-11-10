import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Notification, NotificationType } from '@stayreco/shared';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/notifications.service';
import { useAuthStore } from '@/stores/auth.store';

const typeIcon: Record<NotificationType, IconName> = {
  BOOKING: 'hotel',
  PAYMENT: 'payments',
  PROMOTION: 'sell',
  REVIEW: 'star',
  ALERT: 'info',
  SYSTEM: 'notifications',
};

// Link là đường dẫn của web ("/account/bookings/<id>"); mobile chưa có màn chi tiết đơn nên mở danh sách chuyến đi.
const openLink = (link: string | null) => {
  if (link?.startsWith('/account/bookings')) router.navigate('/trips');
};

export default function NotificationsScreen() {
  const account = useAuthStore((s) => s.account);
  const queryClient = useQueryClient();
  // shortcut: chỉ lấy 50 thông báo mới nhất, thêm phân trang khi cần xem lại thông báo cũ hơn.
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => getNotifications({ page: 1, pageSize: 50 }),
    enabled: !!account,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const open = async (n: Notification) => {
    if (!n.isRead) {
      // Đánh dấu đã đọc lỗi thì vẫn mở link; lần tải sau sẽ hiện lại đúng trạng thái.
      await markNotificationRead(n.id).catch(() => undefined);
      void refresh();
    }
    openLink(n.link);
  };

  const readAll = async () => {
    await markAllNotificationsRead().catch(() => undefined);
    void refresh();
  };

  const hasUnread = data?.notifications.some((n) => !n.isRead);

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        title="Thông báo"
        right={
          hasUnread && <Button label="Đọc tất cả" leadingIcon="task_alt" variant="ghost" size="sm" onPress={() => void readAll()} />
        }
      />
      <ScrollView contentContainerClassName="gap-3 p-4 pb-8" showsVerticalScrollIndicator={false}>
        {!account ? (
          <View className="items-center gap-3 py-6">
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Đăng nhập để xem thông báo.
            </Text>
            <Button label="Đăng nhập" leadingIcon="login" onPress={() => router.push('/login')} />
          </View>
        ) : isPending ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={72} radius={radius.lg} />)
        ) : isError ? (
          <View className="items-center gap-3 py-6">
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Không tải được thông báo. Vui lòng kiểm tra kết nối.
            </Text>
            <Button label="Thử lại" leadingIcon="refresh" variant="secondary" size="sm" onPress={() => refetch()} />
          </View>
        ) : data.notifications.length === 0 ? (
          <View className="items-center gap-3 py-6">
            <Text variant="small" color={colors.onSurfaceVariant} center>
              Bạn chưa có thông báo nào.
            </Text>
          </View>
        ) : (
          data.notifications.map((n) => (
            <Pressable
              key={n.id}
              accessibilityRole="button"
              accessibilityLabel={`${n.isRead ? '' : 'Chưa đọc. '}${n.title ?? ''} ${n.message}`}
              onPress={() => void open(n)}
              className={`flex-row items-start gap-3 rounded-lg p-3.5 shadow-card ${!n.isRead ? 'bg-primary-fixed' : 'bg-surface-container-lowest'}`}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-low">
                <Icon name={typeIcon[n.type]} size={20} color={colors.primaryContainer} />
              </View>
              <View className="flex-1 gap-0.5">
                {!!n.title && (
                  <Text variant="small" weight="bold">
                    {n.title}
                  </Text>
                )}
                <Text variant="small" color={colors.onSurfaceVariant}>
                  {n.message}
                </Text>
                <Text variant="caption" color={colors.outline}>
                  {new Date(n.createdAt).toLocaleString('vi-VN')}
                </Text>
              </View>
              {!n.isRead && <View className="mt-1.5 h-2 w-2 rounded-full bg-secondary" />}
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
