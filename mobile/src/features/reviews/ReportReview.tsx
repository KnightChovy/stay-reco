import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ReportReason } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { apiErrorMessage } from '@/services/ApiService';
import { reportReview } from '@/services/reviews.service';
import { useAuthStore } from '@/stores/auth.store';

const reasons: { key: ReportReason; label: string }[] = [
  { key: 'OFFENSIVE', label: 'Xúc phạm, phản cảm' },
  { key: 'NOT_A_STAY', label: 'Không phải khách đã ở' },
  { key: 'PERSONAL_DATA', label: 'Lộ thông tin cá nhân' },
  { key: 'SPAM_OR_ADVERT', label: 'Spam, quảng cáo' },
  { key: 'WRONG_HOTEL', label: 'Nhầm khách sạn' },
  { key: 'AI_GENERATED', label: 'Nội dung do AI tạo' },
  { key: 'OTHER', label: 'Lý do khác' },
];

/** Nút "Báo cáo" dưới mỗi đánh giá; báo cáo không tự ẩn nội dung, quản lý nền tảng quyết định. */
export function ReportReview({ reviewId }: { reviewId: string }) {
  const signedIn = useAuthStore((st) => !!st.account);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>();
  const [note, setNote] = useState('');
  const report = useMutation({
    mutationFn: () => reportReview(reviewId, { reason: reason!, ...(note.trim() ? { note: note.trim() } : {}) }),
  });

  if (report.isSuccess) {
    return (
      <Text variant="caption" color={colors.onSurfaceVariant}>
        Đã gửi báo cáo. Quản lý nền tảng sẽ xem xét.
      </Text>
    );
  }
  if (!open) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Báo cáo đánh giá này"
        hitSlop={8}
        className="flex-row items-center gap-1 self-start py-1"
        onPress={() => (signedIn ? setOpen(true) : router.push('/login'))}
      >
        <Icon name="flag" size={14} color={colors.outline} />
        <Text variant="caption" color={colors.outline}>
          Báo cáo
        </Text>
      </Pressable>
    );
  }

  const already = (report.error as AxiosError<{ code?: string }> | null)?.response?.data?.code === 'REPORT_ALREADY_RAISED';
  return (
    <View className="gap-2 rounded-md bg-surface-container-low p-3">
      <Text variant="small" weight="semibold">
        Vì sao bạn báo cáo đánh giá này?
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {reasons.map((r) => (
          <Chip key={r.key} label={r.label} tone={r.key === reason ? 'selected' : 'outline'} onPress={() => setReason(r.key)} />
        ))}
      </View>
      <Input placeholder="Ghi chú thêm (không bắt buộc)" accessibilityLabel="Ghi chú báo cáo" maxLength={1000} value={note} onChangeText={setNote} />
      {report.isError && (
        <Text variant="caption" color={colors.error}>
          {already ? 'Bạn đã báo cáo đánh giá này rồi.' : apiErrorMessage(report.error, 'Không gửi được báo cáo. Vui lòng thử lại.')}
        </Text>
      )}
      <View className="flex-row gap-2">
        <Button label="Hủy" variant="muted" size="sm" onPress={() => setOpen(false)} />
        <Button
          label={report.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
          size="sm"
          disabled={!reason || report.isPending}
          onPress={() => report.mutate()}
        />
      </View>
    </View>
  );
}
