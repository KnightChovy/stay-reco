import { View } from 'react-native';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ContentIdea, ContentSchedule, ContentStatus, ContentType, ScheduleStatus, SocialPlatform } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { apiErrorMessage } from '@/services/ApiService';
import { cancelSchedule } from '@/services/marketing.service';
import type { Tone } from './data';
import { Card, s } from './ui';

// Nhãn và quy tắc trạng thái giống frontend/src/features/staff/lib/marketing-labels.ts.
type Labelled = { label: string; tone: Tone };

export const contentStatusLabels: Record<ContentStatus, Labelled> = {
  DRAFT: { label: 'Bản nháp', tone: 'neutral' },
  PENDING_APPROVAL: { label: 'Chờ chủ duyệt', tone: 'warning' },
  APPROVED: { label: 'Đã duyệt', tone: 'tertiary' },
  SCHEDULED: { label: 'Đã lên lịch', tone: 'primary' },
  PUBLISHED: { label: 'Đã đăng', tone: 'tertiary' },
  REJECTED: { label: 'Bị từ chối', tone: 'danger' },
};

export const contentTypeLabels: Record<ContentType, string> = {
  POST: 'Bài đăng',
  CAPTION: 'Chú thích ảnh',
  PROMOTION: 'Quảng bá ưu đãi',
  BLOG: 'Bài blog',
};

export const scheduleStatusLabels: Record<ScheduleStatus, Labelled> = {
  SCHEDULED: { label: 'Chờ đăng', tone: 'primary' },
  PUBLISHING: { label: 'Đang đăng', tone: 'warning' },
  PUBLISHED: { label: 'Đã đăng', tone: 'tertiary' },
  FAILED: { label: 'Đăng lỗi', tone: 'danger' },
  CANCELLED: { label: 'Đã huỷ', tone: 'neutral' },
};

export const platformLabels: Record<SocialPlatform, string> = { FACEBOOK: 'Facebook', INSTAGRAM: 'Instagram', TIKTOK: 'TikTok' };

export const ideaKindLabels: Record<ContentIdea['kind'], Labelled> = {
  FREE_ROOMS: { label: 'Phòng còn trống', tone: 'warning' },
  PROMOTION: { label: 'Khuyến mãi đang chạy', tone: 'primary' },
  GREAT_REVIEW: { label: 'Đánh giá tốt', tone: 'tertiary' },
};

/** Chữ và ảnh chỉ sửa được ở các trạng thái này (M18). */
export const EDITABLE_STATUSES: ContentStatus[] = ['DRAFT', 'REJECTED'];
/** Chỉ bài đã duyệt mới lên lịch được (M9). */
export const SCHEDULABLE_STATUSES: ContentStatus[] = ['APPROVED', 'SCHEDULED'];

export const formatUsd = (amount: number) => `$${amount.toFixed(4)}`;
export const dateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

/** `/me/hotels` không cho biết quyền của nhân viên, nên 403 FORBIDDEN là tín hiệu duy nhất của việc thiếu quyền MARKETING. */
export function marketingError(error: unknown, fallback = 'Có lỗi xảy ra. Vui lòng thử lại.') {
  if (isAxiosError(error) && (error.response?.data as { code?: string } | undefined)?.code === 'FORBIDDEN')
    return 'Tài khoản của bạn chưa có quyền Marketing. Hãy nhờ chủ khách sạn cấp quyền trong mục Nhân viên.';
  return apiErrorMessage(error, fallback);
}

export function ErrorCard({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Card>
      <Text variant="small" color={colors.error}>
        {marketingError(error, 'Không tải được dữ liệu.')}
      </Text>
      <Button label="Thử lại" leadingIcon="refresh" variant="secondary" onPress={onRetry} />
    </Card>
  );
}

/** Mọi query marketing nằm dưới key `['marketing']`: sau mỗi thay đổi đọc lại tất cả cho đơn giản. */
export function useMarketingChanged() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: ['marketing'] });
}

/** Một lịch đăng: dùng ở màn lịch và trong chi tiết bài. `showContent` thêm tiêu đề bài và đường dẫn tới bài. */
export function ScheduleCard({ schedule, showContent }: { schedule: ContentSchedule; showContent?: boolean }) {
  const changed = useMarketingChanged();
  const cancel = useMutation({ mutationFn: () => cancelSchedule(schedule.id), onSuccess: changed });
  const status = scheduleStatusLabels[schedule.status];
  const waiting = schedule.status === 'SCHEDULED' || schedule.status === 'PUBLISHING';
  return (
    <Card>
      <View className={s.wrap}>
        <Chip label={platformLabels[schedule.platform]} tone="secondary" />
        <Chip label={status.label} tone={status.tone} />
      </View>
      {showContent && (
        <>
          <Text variant="label" weight="bold">
            {schedule.title || '(Chưa có tiêu đề)'}
          </Text>
          <Text variant="small" color={colors.onSurfaceVariant} numberOfLines={2}>
            {schedule.body}
          </Text>
        </>
      )}
      <Text variant="caption" color={colors.onSurfaceVariant}>
        {schedule.publishedAt
          ? `Đã đăng lúc ${dateTime(schedule.publishedAt)}`
          : schedule.scheduledAt
            ? `Hẹn đăng ${dateTime(schedule.scheduledAt)}`
            : waiting
              ? 'Đăng ở lượt chạy kế tiếp (trong vòng 1 phút)'
              : 'Đăng ngay (không hẹn giờ)'}
        {` · ${schedule.accountName}`}
      </Text>
      {/* Nguyên văn của nền tảng: thứ duy nhất phân biệt token hết hạn với ảnh bị từ chối. */}
      {!!schedule.failureReason && (
        <Text variant="caption" color={colors.error}>
          Lý do: {schedule.failureReason}
        </Text>
      )}
      {cancel.isError && (
        <Text variant="caption" color={colors.error}>
          {marketingError(cancel.error)}
        </Text>
      )}
      <View className={s.wrap}>
        {showContent && <Button label="Mở bài" variant="secondary" size="sm" onPress={() => router.push({ pathname: '/staff/marketing/editor', params: { id: schedule.contentId } })} />}
        {schedule.status === 'SCHEDULED' && <Button label={cancel.isPending ? 'Đang huỷ…' : 'Huỷ lịch'} leadingIcon="cancel" variant="muted" size="sm" disabled={cancel.isPending} onPress={() => cancel.mutate()} />}
        {schedule.status === 'PUBLISHED' && <Button label="Hiệu quả" leadingIcon="bar_chart" variant="secondary" size="sm" onPress={() => router.push('/staff/marketing/analytics')} />}
      </View>
    </Card>
  );
}
