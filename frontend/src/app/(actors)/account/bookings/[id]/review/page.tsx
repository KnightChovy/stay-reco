'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Info,
  Loader2,
  MapPin,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { createReviewSchema, type RatingCriterion, type Review, type ReviewImage } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState, ErrorState } from '@/components/common/StateViews';
import { getApiErrorCode, getApiErrorMessage, getApiFieldErrors, validateWith } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { FALLBACK_HOTEL_IMAGE } from '@/features/booking/lib/booking-status';
import {
  BookingBreadcrumb,
  BookingPageLoading,
  linkButton,
} from '@/features/account/booking-detail/BookingPageParts';
import { useBooking } from '@/features/booking/api/booking-queries';
import {
  useCreateReview,
  useDeleteReviewImage,
  useMyReviews,
  useRatingCriteria,
  useReviewEligibility,
  useUpdateReview,
  useUploadReviewImage,
} from '@/features/account/api/rewards-queries';
import { notify } from '@/features/account/AccountShell';
import {
  checkReviewPhoto,
  ReviewPhotoPicker,
  type PendingPhoto,
} from '@/features/reviews/components/ReviewPhotoPicker';
import { StarDisplay, StarInput } from '@/features/reviews/components/StarRating';
import { formatDate, formatDateTime } from '@/features/stays/lib/format';

const CONTENT_MIN = 10;
const CONTENT_MAX = 5000;

const REASON_TEXT: Record<string, string> = {
  REVIEW_NOT_ALLOWED: 'Bạn chỉ có thể đánh giá sau khi đã trả phòng và chuyến đi được ghi nhận là hoàn tất.',
  REVIEW_WINDOW_CLOSED: 'Đã quá thời hạn đánh giá chuyến đi này.',
  REVIEW_ALREADY_EXISTS: 'Bạn đã đánh giá chuyến đi này.',
};

/** The weighted average the backend will compute, shown live so the guest sees what their stars add up to. */
function previewOverall(criteria: RatingCriterion[], scores: Record<string, number>) {
  const scored = criteria.filter((criterion) => scores[criterion.id] !== undefined);
  if (scored.length !== criteria.length || criteria.length === 0) return null;
  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0) || 1;
  const value = criteria.reduce((sum, criterion) => sum + scores[criterion.id] * criterion.weight, 0) / totalWeight;
  return Math.round(value * 10) / 10;
}

function ReviewForm({
  bookingId,
  criteria,
  existing,
  closesAt,
}: {
  bookingId: string;
  criteria: RatingCriterion[];
  existing: Review | null;
  closesAt: string | null;
}) {
  const router = useRouter();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const uploadImage = useUploadReviewImage();
  const deleteImage = useDeleteReviewImage();
  // Photos picked here are uploaded once the review exists; `uploading` counts them for the button.
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const pending = createReview.isPending || updateReview.isPending || uploading !== null;
  const savedImages: ReviewImage[] = existing?.images ?? [];

  const addPhotos = async (files: File[]) => {
    setPhotoError(null);
    const problems: string[] = [];
    const accepted: PendingPhoto[] = [];
    for (const file of files) {
      const problem = await checkReviewPhoto(file);
      if (problem) problems.push(problem);
      else accepted.push({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, url: URL.createObjectURL(file) });
    }
    if (accepted.length > 0) setPhotos((current) => [...current, ...accepted]);
    if (problems.length > 0) setPhotoError(problems.join(' '));
  };

  const removeSaved = (image: ReviewImage) => {
    if (!window.confirm('Xoá ảnh này khỏi đánh giá? Không thể hoàn tác.')) return;
    setPhotoError(null);
    deleteImage.mutate(image.id, {
      onSuccess: () => notify.success('Đã xoá ảnh'),
      onError: (error) =>
        setPhotoError(
          getApiErrorCode(error) === 'REVIEW_IMAGE_REPORTED'
            ? 'Ảnh này đang bị báo cáo nên chưa xoá được; bạn xoá được sau khi quản lý StayReco xử lý xong.'
            : getApiErrorMessage(error, 'Không xoá được ảnh.'),
        ),
    });
  };

  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries((existing?.subRatings ?? []).map((rating) => [rating.criterionId, rating.score])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [showMissing, setShowMissing] = useState(false);
  const submitted = useRef(false);

  const overall = previewOverall(criteria, scores);
  const missing = criteria.filter((criterion) => scores[criterion.id] === undefined);

  // Leaving with unsaved words loses up to 5,000 characters: ask first. Cleared once the review is saved.
  const initialScores = useMemo(
    () => JSON.stringify(Object.fromEntries((existing?.subRatings ?? []).map((r) => [r.criterionId, r.score]))),
    [existing],
  );
  const dirty =
    title !== (existing?.title ?? '') ||
    content !== (existing?.content ?? '') ||
    JSON.stringify(scores) !== initialScores ||
    photos.length > 0;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (submitted.current) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (missing.length > 0) {
      setShowMissing(true);
      setFormError(`Còn ${missing.length} tiêu chí chưa chấm điểm.`);
      document
        .getElementById(`criterion-${missing[0].id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const input = {
      title: title.trim() || undefined,
      content: content.trim(),
      subRatings: criteria.map((criterion) => ({ criterionId: criterion.id, score: scores[criterion.id] })),
    };
    const result = validateWith(createReviewSchema, input);
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    const onError = (error: unknown) => {
      setErrors(getApiFieldErrors(error));
      setFormError(getApiErrorMessage(error, 'Không gửi được đánh giá. Vui lòng thử lại.'));
    };
    // The words are saved first; then each picked photo is sent one by one, so a refused photo does not lose the
    // review. Whatever could not be uploaded is reported, and the guest can add it again while editing is open.
    const onSuccess = async (review: Review) => {
      submitted.current = true;
      const failed: string[] = [];
      if (photos.length > 0) {
        setUploading({ done: 0, total: photos.length });
        for (const [index, photo] of photos.entries()) {
          try {
            await uploadImage.mutateAsync({ reviewId: review.id, file: photo.file });
          } catch (error) {
            failed.push(`${photo.file.name}: ${getApiErrorMessage(error, 'không tải lên được')}`);
          }
          setUploading({ done: index + 1, total: photos.length });
        }
      }
      if (failed.length > 0) {
        notify.error(`${failed.length} ảnh chưa tải lên được`, failed.join(' · '));
      }
      router.replace(`/account/bookings/${bookingId}?reviewed=${review.isVisible ? 'visible' : 'hidden'}`);
    };

    if (existing) {
      // Sending `subRatings` replaces all of them, so the whole set always goes.
      updateReview.mutate({ reviewId: existing.id, input: result.data }, { onSuccess, onError });
    } else {
      createReview.mutate({ bookingId, input: result.data }, { onSuccess, onError });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <Card className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <h2 className="text-lg font-bold text-foreground">Chấm điểm theo từng tiêu chí</h2>
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Điểm tổng</span>
            <span className="text-lg font-bold text-primary">{overall !== null ? overall.toFixed(1) : '—'}</span>
            {overall !== null && <StarDisplay value={overall} size="size-3.5" />}
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          Điểm tổng được tính tự động theo trọng số của từng tiêu chí; bạn cần chấm đủ mọi tiêu chí.
        </p>

        <ul className="divide-y divide-border">
          {criteria.map((criterion) => (
            <li
              key={criterion.id}
              id={`criterion-${criterion.id}`}
              className={cn(
                'flex scroll-mt-28 flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between',
                showMissing && scores[criterion.id] === undefined && '-mx-3 rounded-lg bg-red-50 px-3',
              )}
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{criterion.name}</p>
                {criterion.description && <p className="text-sm text-muted-foreground">{criterion.description}</p>}
                {showMissing && scores[criterion.id] === undefined && (
                  <p className="text-sm font-semibold text-red-600">Chưa chấm</p>
                )}
              </div>
              <StarInput
                label={criterion.name}
                value={scores[criterion.id]}
                disabled={pending}
                onChange={(score) => setScores((prev) => ({ ...prev, [criterion.id]: score }))}
              />
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-7">
        <h2 className="border-b border-border pb-3 text-lg font-bold text-foreground">Chia sẻ trải nghiệm</h2>

        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs font-semibold text-foreground sm:text-sm">
            Tiêu đề <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
          </Label>
          <Input
            id="title"
            value={title}
            maxLength={255}
            disabled={pending}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ví dụ: Phòng sạch, nhân viên dễ thương"
            aria-invalid={!!errors.title}
            className="h-11"
          />
          {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content" className="text-xs font-semibold text-foreground sm:text-sm">
            Nội dung đánh giá <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="content"
            rows={6}
            value={content}
            maxLength={CONTENT_MAX}
            disabled={pending}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Phòng ốc, vị trí, dịch vụ, bữa sáng… điều gì khiến bạn hài lòng hoặc cần cải thiện?"
            aria-invalid={!!errors.content}
            className="min-h-36 text-base sm:text-sm"
          />
          <div className="flex justify-between text-xs">
            <span className={errors.content ? 'text-red-600' : 'text-muted-foreground'}>
              {errors.content ?? `Tối thiểu ${CONTENT_MIN} ký tự.`}
            </span>
            <span className="text-muted-foreground">
              {content.trim().length}/{CONTENT_MAX}
            </span>
          </div>
        </div>

        <ReviewPhotoPicker
          saved={savedImages}
          pending={photos}
          onAdd={(files) => void addPhotos(files)}
          onRemovePending={(id) => setPhotos((current) => current.filter((photo) => photo.id !== id))}
          onRemoveSaved={existing ? removeSaved : undefined}
          removingId={deleteImage.isPending ? deleteImage.variables : null}
          disabled={pending}
          error={photoError}
        />

        <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="leading-relaxed">
            Đánh giá được đăng công khai ngay trên trang khách sạn với tên rút gọn của bạn (ví dụ &ldquo;Nguyễn Văn
            A.&rdquo;). Khách sạn không thể ẩn đánh giá; chỉ quản lý StayReco ẩn một đánh giá vi phạm sau khi nó bị báo
            cáo.
            {closesAt && ` Bạn có thể chỉnh sửa đến ${formatDateTime(closesAt)}.`}
          </p>
        </div>
      </Card>

      {formError && (
        <Alert variant="destructive" className="bg-red-50">
          <AlertTitle className="text-xs">Chưa gửi được đánh giá</AlertTitle>
          <AlertDescription className="mt-1 text-xs">{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="h-11 w-full gap-2 px-8 sm:w-auto">
          {pending ? <Loader2 className="size-4 animate-spin" /> : existing ? <Edit2 className="size-4" /> : <Send className="size-4" />}
          {uploading
            ? `Đang tải ảnh ${Math.min(uploading.done + 1, uploading.total)}/${uploading.total}…`
            : existing
              ? 'Lưu chỉnh sửa'
              : 'Gửi đánh giá'}
        </Button>
      </div>
    </form>
  );
}

function ReviewSummary({ review }: { review: Review }) {
  return (
    <Card className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-3xl font-bold text-primary">{review.overallRating.toFixed(1)}</span>
        <StarDisplay value={review.overallRating} />
        {!review.isVisible && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            Đang bị ẩn sau khi bị báo cáo
          </span>
        )}
      </div>
      {review.title && <h3 className="text-base font-bold text-foreground">{review.title}</h3>}
      <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{review.content}</p>
      {review.images.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {review.images.map((image) => (
            <li key={image.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- review photos come from storage at their own size */}
              <img src={image.url} alt="Ảnh trong đánh giá của bạn" className="size-full object-cover" />
            </li>
          ))}
        </ul>
      )}
      <ul className="grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-2">
        {review.subRatings.map((rating) => (
          <li key={rating.criterionId} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{rating.name}</span>
            <span className="font-semibold text-foreground">{rating.score.toFixed(1)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Viết lúc {formatDateTime(review.createdAt)}</p>
    </Card>
  );
}

export default function ReviewBookingPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;
  // When the page was opened; the API still refuses an edit sent after the window closes.
  const [openedAt] = useState(() => Date.now());
  const bookingQuery = useBooking(bookingId);
  const eligibilityQuery = useReviewEligibility(bookingId);
  const criteriaQuery = useRatingCriteria();
  const eligibility = eligibilityQuery.data;
  // There is no GET /reviews/:id: the review already written is read back from the author's own list.
  const myReviewsQuery = useMyReviews({ pageSize: 100 }, !!eligibility?.reviewId);
  const existing = useMemo(
    () => myReviewsQuery.data?.reviews.find((review) => review.id === eligibility?.reviewId) ?? null,
    [myReviewsQuery.data, eligibility?.reviewId],
  );

  const booking = bookingQuery.data;
  const loading =
    bookingQuery.isLoading ||
    eligibilityQuery.isLoading ||
    criteriaQuery.isLoading ||
    (!!eligibility?.reviewId && myReviewsQuery.isLoading);
  const error = bookingQuery.error ?? eligibilityQuery.error ?? criteriaQuery.error ?? myReviewsQuery.error;

  const windowOpen = !!eligibility?.closesAt && new Date(eligibility.closesAt).getTime() > openedAt;
  // A written review can be edited while the window is open (the API refuses after it).
  const editable = !!existing && windowOpen;
  const canWrite = !!eligibility?.canReview;

  const breadcrumb = (
    <BookingBreadcrumb
      items={[
        { label: 'Tài khoản', href: '/account/profile' },
        { label: 'Chuyến đi của tôi', href: '/account/bookings' },
        { label: booking ? `Chi tiết #${booking.code}` : 'Chi tiết', href: `/account/bookings/${bookingId}` },
        { label: existing ? 'Đánh giá của bạn' : 'Viết đánh giá', active: true },
      ]}
    />
  );

  if (loading) {
    return (
      <>
        {breadcrumb}
        <BookingPageLoading label="Đang tải trang đánh giá…" />
      </>
    );
  }

  if (error || !booking || !eligibility || !criteriaQuery.data) {
    return (
      <>
        {breadcrumb}
        <div className="mx-auto max-w-lg px-4 py-14">
          <ErrorState
            title="Không mở được trang đánh giá"
            error={error}
            fallback="Không tải được thông tin chuyến đi hoặc tiêu chí đánh giá."
            onRetry={() => {
              void bookingQuery.refetch();
              void eligibilityQuery.refetch();
              void criteriaQuery.refetch();
              if (eligibility?.reviewId) void myReviewsQuery.refetch();
            }}
            action={
              <Link href="/account/bookings" className={linkButton('ghost')}>
                Chuyến đi của tôi
              </Link>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      {breadcrumb}
      <div className="mx-auto w-full max-w-marketplace px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {existing ? (editable ? 'Chỉnh sửa đánh giá' : 'Đánh giá của bạn') : 'Đánh giá kỳ nghỉ'}
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">
            Chia sẻ trải nghiệm thực tế tại {booking.hotel.name} để giúp những du khách khác chọn chỗ nghỉ phù hợp.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            {canWrite || editable ? (
              <ReviewForm
                bookingId={booking.id}
                criteria={criteriaQuery.data}
                existing={editable ? existing : null}
                closesAt={eligibility.closesAt}
              />
            ) : existing ? (
              <>
                <Alert className="border-border bg-card">
                  <Clock className="size-4" />
                  <AlertDescription className="text-sm">
                    Đã hết thời hạn chỉnh sửa. Đánh giá của bạn vẫn được giữ nguyên như dưới đây.
                  </AlertDescription>
                </Alert>
                <ReviewSummary review={existing} />
              </>
            ) : (
              <EmptyState
                icon={Info}
                title={REASON_TEXT[eligibility.reason ?? ''] ?? 'Chuyến đi này chưa thể đánh giá.'}
                action={
                  <Link href={`/account/bookings/${booking.id}`} className={linkButton('default')}>
                    Về chi tiết đặt phòng
                  </Link>
                }
              />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
            <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
              <div className="relative h-40 w-full bg-muted">
                <Image
                  src={booking.hotel.coverImageUrl ?? FALLBACK_HOTEL_IMAGE}
                  alt={booking.hotel.name}
                  fill
                  sizes="(min-width: 1024px) 380px, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-3 p-5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="size-3.5" aria-hidden /> Lưu trú đã xác thực
                </span>
                <h2 className="text-base font-bold text-foreground">{booking.hotel.name}</h2>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4 text-primary" aria-hidden /> {booking.hotel.city}
                </p>
                <div className="space-y-1.5 border-t border-border pt-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="size-4 text-primary" aria-hidden /> {formatDate(booking.checkIn)} –{' '}
                    {formatDate(booking.checkOut)} · {booking.nights} đêm
                  </p>
                  <p>
                    Mã đặt phòng: <strong className="text-foreground">#{booking.code}</strong>
                  </p>
                  {eligibility.closesAt && (
                    <p className="flex items-center gap-1.5">
                      <Clock className="size-4 text-amber-700" aria-hidden /> Hạn đánh giá:{' '}
                      {formatDateTime(eligibility.closesAt)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
            <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
              <p>Chỉ khách đã hoàn tất kỳ nghỉ mới được đánh giá, mỗi chuyến đi một đánh giá.</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
