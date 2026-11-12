import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AxiosError } from 'axios';
import { createReviewSchema, REVIEW_IMAGE_RULES, type Review } from '@stayreco/shared';
import { ReviewImages } from '@/features/reviews/ReviewImages';
import { pickImageForm } from '@/lib/pick-image';
import { apiErrorMessage } from '@/services/ApiService';
import { ScreenHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { formatDate } from '@/lib/stay';
import { getBooking } from '@/services/bookings.service';
import {
  createReview,
  deleteReviewImage,
  findMyReview,
  getRatingCriteria,
  getReviewEligibility,
  updateReview,
  uploadReviewImage,
} from '@/services/reviews.service';

type ApiError = AxiosError<{ code?: string; message?: string }>;

const reasonText: Record<string, string> = {
  REVIEW_NOT_ALLOWED: 'Chỉ đánh giá được sau khi đã trả phòng.',
  REVIEW_ALREADY_EXISTS: 'Bạn đã đánh giá chuyến đi này.',
  REVIEW_WINDOW_CLOSED: 'Đã quá hạn đánh giá chuyến đi này.',
};

/** Chạm sao n để chấm n; chạm lại đúng sao đó để chấm n − 0,5 (API nhận một chữ số thập phân). */
function nextScore(current: number, star: number) {
  return current === star && star > 1 ? star - 0.5 : star;
}

function StarPicker({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${star} sao`}
          accessibilityState={{ selected: value >= star }}
          hitSlop={4}
          className="p-1"
          onPress={() => onChange(nextScore(value, star))}
        >
          <Icon
            name={value >= star ? 'star' : value >= star - 0.5 ? 'star_half' : 'star'}
            size={28}
            color={value >= star - 0.5 ? colors.secondaryContainer : colors.surfaceContainerHigh}
          />
        </Pressable>
      ))}
      {value > 0 && (
        <Text variant="small" weight="bold" className="ml-2">
          {value.toString().replace('.', ',')}
        </Text>
      )}
    </View>
  );
}

export default function WriteReviewScreen() {
  const insets = useSafeAreaInsets();
  // Có `reviewId` là sửa đánh giá đã viết, không có là viết mới.
  const { id, reviewId } = useLocalSearchParams<{ id: string; reviewId?: string }>();
  const editing = !!reviewId;
  const queryClient = useQueryClient();
  const booking = useQuery({ queryKey: ['bookings', id], queryFn: () => getBooking(id) });
  const criteria = useQuery({ queryKey: ['rating-criteria'], queryFn: getRatingCriteria, staleTime: Infinity });
  const eligibility = useQuery({ queryKey: ['bookings', id, 'review-eligibility'], queryFn: () => getReviewEligibility(id) });
  const existing = useQuery({
    queryKey: ['reviews', 'mine', reviewId],
    queryFn: () => findMyReview(reviewId!),
    enabled: editing,
  });
  const [scores, setScores] = useState<Record<string, number>>({});
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');

  /** Thêm/xóa ảnh đều trả cả đánh giá; ghi thẳng vào cache để dải ảnh vẽ lại. */
  const changePhotos = async (action: () => Promise<Review | null>) => {
    setPhotoError('');
    setPhotoBusy(true);
    try {
      const updated = await action();
      if (updated) {
        queryClient.setQueryData(['reviews', 'mine', updated.id], updated);
        void queryClient.invalidateQueries({ queryKey: ['reviews'] });
      }
    } catch (err) {
      setPhotoError(
        (err as ApiError).response?.data?.code === 'UPLOAD_INVALID_FILE'
          ? `Ảnh cần là JPEG, PNG hoặc WebP, tối đa 10MB, tỉ lệ từ 1:1 đến 4:3, tối đa ${REVIEW_IMAGE_RULES.maxPerReview} ảnh.`
          : apiErrorMessage(err, 'Không cập nhật được ảnh. Vui lòng thử lại.'),
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const review = existing.data;
  // Điền sẵn đánh giá cũ một lần khi tải xong (cập nhật state lúc render, không cần effect).
  const [prefilledId, setPrefilledId] = useState<string>();
  if (review && prefilledId !== review.id) {
    setPrefilledId(review.id);
    setScores(Object.fromEntries(review.subRatings.map((s) => [s.criterionId, s.score])));
    setTitle(review.title ?? '');
    setContent(review.content);
  }

  const submit = async () => {
    const list = criteria.data ?? [];
    if (list.some((c) => !scores[c.id])) {
      setError('Vui lòng chấm điểm tất cả các tiêu chí.');
      return;
    }
    const input = createReviewSchema.safeParse({
      ...(title.trim() ? { title } : {}),
      content,
      subRatings: list.map((c) => ({ criterionId: c.id, score: scores[c.id] })),
    });
    if (!input.success) {
      setError('Nhận xét cần từ 10 đến 5000 ký tự.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      if (editing) {
        await updateReview(reviewId, input.data);
        router.back();
      } else {
        // Ảnh gắn vào đánh giá đã có id, nên gửi xong ở lại màn này (chế độ sửa) để khách thêm ảnh.
        const created = await createReview(id, input.data);
        queryClient.setQueryData(['reviews', 'mine', created.id], created);
        setPrefilledId(created.id);
        setJustCreated(true);
        router.setParams({ reviewId: created.id });
      }
      void queryClient.invalidateQueries({ queryKey: ['bookings', id, 'review-eligibility'] });
      void queryClient.invalidateQueries({ queryKey: ['reviews'] });
    } catch (err) {
      const body = (err as ApiError).response?.data;
      setError((body?.code && reasonText[body.code]) || body?.message || 'Không gửi được đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const b = booking.data;
  const elig = eligibility.data;
  const windowOpen = !!elig?.closesAt && new Date(elig.closesAt) > new Date();
  // Viết mới: theo eligibility. Sửa: chỉ cần còn hạn (backend vẫn kiểm tra lại).
  const blocked = elig && (editing ? !windowOpen : !elig.canReview);
  const ready = b && criteria.data && elig && (!editing || review);
  if (!ready || blocked) {
    const failed = booking.isError || criteria.isError || eligibility.isError || existing.isError;
    return (
      <View className="flex-1 bg-surface">
        <ScreenHeader title={editing ? 'Sửa Đánh Giá' : 'Viết Đánh Giá'} />
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text variant="small" color={colors.onSurfaceVariant} center>
            {blocked
              ? editing
                ? reasonText.REVIEW_WINDOW_CLOSED
                : (reasonText[elig.reason ?? ''] ?? 'Chuyến đi này chưa thể đánh giá.')
              : failed
                ? 'Không tải được thông tin. Vui lòng kiểm tra kết nối.'
                : 'Đang tải...'}
          </Text>
          {failed && (
            <Button
              label="Thử lại"
              leadingIcon="refresh"
              variant="secondary"
              size="sm"
              onPress={() => {
                void booking.refetch();
                void criteria.refetch();
                void eligibility.refetch();
                if (editing) void existing.refetch();
              }}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title={editing ? 'Sửa Đánh Giá' : 'Viết Đánh Giá'} />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-1 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <Text variant="h3">{b.hotel.name}</Text>
          <Text variant="caption" color={colors.onSurfaceVariant}>
            {formatDate(b.checkIn)} - {formatDate(b.checkOut)} • {b.roomType.name}
          </Text>
          {elig.closesAt && (
            <Text variant="caption" color={colors.onSurfaceVariant}>
              {editing ? 'Sửa được đến' : 'Hạn đánh giá'}: {new Date(elig.closesAt).toLocaleDateString('vi-VN')}
            </Text>
          )}
          {review && !review.isVisible && (
            <Text variant="caption" color={colors.error}>
              Khách sạn đã ẩn đánh giá này khỏi trang công khai.
            </Text>
          )}
        </View>

        <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <Text variant="label" weight="bold">
            Chấm điểm theo tiêu chí
          </Text>
          {criteria.data.map((c) => (
            <View key={c.id} className="gap-1">
              <Text variant="small" weight="semibold">
                {c.name}
              </Text>
              {!!c.description && (
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {c.description}
                </Text>
              )}
              <StarPicker label={c.name} value={scores[c.id] ?? 0} onChange={(v) => setScores((s) => ({ ...s, [c.id]: v }))} />
            </View>
          ))}
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Chạm lại một sao để chấm nửa sao. Điểm tổng được tính từ các tiêu chí trên.
          </Text>
        </View>

        <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
          <Input label="Tiêu đề (không bắt buộc)" placeholder="Ví dụ: Phòng sạch, nhân viên dễ thương" maxLength={255} value={title} onChangeText={setTitle} />
          <Text variant="label" weight="semibold">
            Nhận xét
          </Text>
          <TextInput
            multiline
            maxLength={5000}
            accessibilityLabel="Nhận xét về chuyến đi"
            placeholder="Chia sẻ trải nghiệm của bạn (ít nhất 10 ký tự)"
            placeholderTextColor={colors.outline}
            value={content}
            onChangeText={setContent}
            className="min-h-28 rounded-md bg-surface-container-low p-3 font-be-regular text-sm text-on-surface"
          />
        </View>
        {review ? (
          <View className="gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card">
            <Text variant="label" weight="bold">
              Ảnh ({review.images.length}/{REVIEW_IMAGE_RULES.maxPerReview})
            </Text>
            {justCreated && (
              <Text variant="small" color={colors.primary}>
                Đã gửi đánh giá. Bạn có thể thêm ảnh bên dưới.
              </Text>
            )}
            <ReviewImages
              images={review.images}
              onRemove={photoBusy ? undefined : (imageId) => void changePhotos(() => deleteReviewImage(imageId))}
            />
            {review.images.length < REVIEW_IMAGE_RULES.maxPerReview && (
              <Button
                label={photoBusy ? 'Đang xử lý...' : 'Thêm ảnh'}
                leadingIcon="photo_library"
                variant="secondary"
                size="sm"
                disabled={photoBusy}
                onPress={() =>
                  void changePhotos(async () => {
                    const form = await pickImageForm();
                    return form && uploadReviewImage(review.id, form);
                  })
                }
              />
            )}
            {!!photoError && (
              <Text variant="small" color={colors.error}>
                {photoError}
              </Text>
            )}
          </View>
        ) : (
          <Text variant="caption" color={colors.onSurfaceVariant}>
            Sau khi gửi đánh giá, bạn có thể thêm tối đa {REVIEW_IMAGE_RULES.maxPerReview} ảnh.
          </Text>
        )}
        {!!error && (
          <Text variant="small" color={colors.error}>
            {error}
          </Text>
        )}
      </ScrollView>
      <View className="border-t border-surface-container-high bg-surface-container-lowest px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button
          label={submitting ? 'Đang gửi...' : editing ? 'Lưu thay đổi' : 'Gửi đánh giá'}
          leadingIcon="send"
          size="lg"
          disabled={submitting}
          onPress={() => void submit()}
        />
      </View>
    </View>
  );
}
