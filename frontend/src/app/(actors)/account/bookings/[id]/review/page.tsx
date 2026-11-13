'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
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
import { createReviewSchema, type RatingCriterion, type Review } from '@stayreco/shared';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getApiErrorMessage, getApiFieldErrors, validateWith } from '@/lib/api-error';
import { useBooking } from '@/features/booking/api/booking-queries';
import {
  useCreateReview,
  useMyReviews,
  useRatingCriteria,
  useReviewEligibility,
  useUpdateReview,
} from '@/features/account/api/rewards-queries';
import { StarDisplay, StarInput } from '@/features/reviews/components/StarRating';
import { formatDate, formatDateTime } from '@/features/stays/lib/format';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

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
  const pending = createReview.isPending || updateReview.isPending;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries((existing?.subRatings ?? []).map((rating) => [rating.criterionId, rating.score])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const overall = previewOverall(criteria, scores);
  const missing = criteria.filter((criterion) => scores[criterion.id] === undefined);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (missing.length > 0) {
      setFormError(`Vui lòng chấm điểm đủ ${criteria.length} tiêu chí (còn thiếu: ${missing.map((c) => c.name).join(', ')}).`);
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
    const onSuccess = (review: Review) =>
      router.replace(`/account/bookings/${bookingId}?reviewed=${review.isVisible ? 'visible' : 'hidden'}`);

    if (existing) {
      // Sending `subRatings` replaces all of them, so the whole set always goes.
      updateReview.mutate({ reviewId: existing.id, input: result.data }, { onSuccess, onError });
    } else {
      createReview.mutate({ bookingId, input: result.data }, { onSuccess, onError });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <Card className="space-y-5 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-[#202B36]">Chấm điểm theo từng tiêu chí</h2>
          <div className="flex items-center gap-2 rounded-lg bg-[#f1f3f9] px-3 py-1.5">
            <span className="text-[11px] font-semibold uppercase text-slate-500">Điểm tổng</span>
            <span className="text-lg font-bold text-[#013758]">{overall !== null ? overall.toFixed(1) : '—'}</span>
            {overall !== null && <StarDisplay value={overall} size="size-3.5" />}
          </div>
        </div>
        <p className="-mt-2 text-xs text-slate-500">
          Điểm tổng được tính tự động theo trọng số của từng tiêu chí; bạn cần chấm đủ mọi tiêu chí.
        </p>

        <ul className="divide-y divide-slate-100">
          {criteria.map((criterion) => (
            <li key={criterion.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#202B36]">{criterion.name}</p>
                {criterion.description && <p className="text-xs text-slate-500">{criterion.description}</p>}
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

      <Card className="space-y-5 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
        <h2 className="border-b border-slate-100 pb-3 text-lg font-bold text-[#202B36]">Chia sẻ trải nghiệm</h2>

        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs font-semibold text-[#202B36] sm:text-sm">
            Tiêu đề <span className="font-normal text-slate-400">(không bắt buộc)</span>
          </Label>
          <Input
            id="title"
            value={title}
            maxLength={255}
            disabled={pending}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ví dụ: Phòng sạch, nhân viên dễ thương"
            aria-invalid={!!errors.title}
            className="h-11 border-slate-300"
          />
          {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content" className="text-xs font-semibold text-[#202B36] sm:text-sm">
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
            className="min-h-36 border-slate-300 text-sm"
          />
          <div className="flex justify-between text-[11px]">
            <span className={errors.content ? 'text-red-600' : 'text-slate-400'}>
              {errors.content ?? `Tối thiểu ${CONTENT_MIN} ký tự.`}
            </span>
            <span className="text-slate-400">
              {content.trim().length}/{CONTENT_MAX}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-[#f1f3f9] p-3 text-xs text-slate-600">
          <Info className="mt-0.5 size-4 shrink-0 text-[#013758]" />
          <p className="leading-relaxed">
            Đánh giá hiển thị ngay trên trang khách sạn với tên rút gọn của bạn (ví dụ &ldquo;Nguyễn Văn A.&rdquo;).
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

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Link href={`/account/bookings/${bookingId}`}>
          <Button type="button" variant="outline" className="h-11 w-full gap-1.5 px-5 text-sm sm:w-auto">
            <ArrowLeft className="size-4" /> Quay lại
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={pending}
          className="h-11 gap-2 bg-[#013758] px-8 text-sm font-bold text-white hover:bg-[#193B56]"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : existing ? <Edit2 className="size-4" /> : <Send className="size-4" />}
          {existing ? 'Lưu chỉnh sửa' : 'Gửi đánh giá'}
        </Button>
      </div>
    </form>
  );
}

function ReviewSummary({ review }: { review: Review }) {
  return (
    <Card className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-3xl font-bold text-[#013758]">{review.overallRating.toFixed(1)}</span>
        <StarDisplay value={review.overallRating} />
        {!review.isVisible && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            Khách sạn đã ẩn đánh giá này
          </span>
        )}
      </div>
      {review.title && <h3 className="text-base font-bold text-[#202B36]">{review.title}</h3>}
      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{review.content}</p>
      <ul className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
        {review.subRatings.map((rating) => (
          <li key={rating.criterionId} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-600">{rating.name}</span>
            <span className="font-semibold text-[#202B36]">{rating.score.toFixed(1)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-slate-400">Viết lúc {formatDateTime(review.createdAt)}</p>
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

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9ff] font-sans text-[#202B36] antialiased">
      <Header />

      <main className="w-full flex-1 py-6 lg:py-10">
        <div className="mx-auto max-w-marketplace px-4 sm:px-6">
          <AppBreadcrumb
            items={[
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Chuyến đi của tôi', href: '/account/bookings' },
              { label: booking ? `Chi tiết #${booking.code}` : 'Chi tiết', href: `/account/bookings/${bookingId}` },
              { label: existing ? 'Đánh giá của bạn' : 'Viết đánh giá', active: true },
            ]}
          />

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
              <Loader2 className="size-5 animate-spin" /> Đang tải…
            </div>
          ) : error || !booking || !eligibility || !criteriaQuery.data ? (
            <div className="mx-auto max-w-lg py-20 text-center">
              <AlertTriangle className="mx-auto size-10 text-amber-500" />
              <h1 className="mt-3 text-xl font-bold">Không mở được trang đánh giá</h1>
              <p className="mt-1 text-sm text-slate-500">{getApiErrorMessage(error)}</p>
              <Link href="/account/bookings">
                <Button className="mt-5 bg-[#013758] text-white">Chuyến đi của tôi</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 mt-6">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {existing ? (editable ? 'Chỉnh sửa đánh giá' : 'Đánh giá của bạn') : 'Đánh giá kỳ nghỉ'}
                </h1>
                <p className="mt-1.5 max-w-3xl text-sm text-slate-500">
                  Chia sẻ trải nghiệm thực tế tại {booking.hotel.name} để giúp những du khách khác chọn chỗ nghỉ phù hợp.
                </p>
              </div>

              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
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
                      <Alert className="border-slate-200 bg-white">
                        <Clock className="size-4" />
                        <AlertDescription className="text-xs">
                          Đã hết thời hạn chỉnh sửa. Đánh giá của bạn vẫn được giữ nguyên như dưới đây.
                        </AlertDescription>
                      </Alert>
                      <ReviewSummary review={existing} />
                    </>
                  ) : (
                    <Card className="flex flex-col items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-8 text-center">
                      <Info className="size-8 text-[#013758]" />
                      <p className="text-sm font-semibold">
                        {REASON_TEXT[eligibility.reason ?? ''] ?? 'Chuyến đi này chưa thể đánh giá.'}
                      </p>
                      <Link href={`/account/bookings/${booking.id}`}>
                        <Button variant="outline" className="gap-1.5">
                          <ArrowLeft className="size-4" /> Về chi tiết đặt phòng
                        </Button>
                      </Link>
                    </Card>
                  )}
                </div>

                <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
                  <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-md">
                    <div className="relative h-40 w-full bg-slate-100">
                      <Image
                        src={booking.hotel.coverImageUrl ?? FALLBACK_IMAGE}
                        alt={booking.hotel.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-3 p-5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="size-3.5" /> Lưu trú đã xác thực
                      </span>
                      <h2 className="text-base font-bold">{booking.hotel.name}</h2>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="size-3.5 text-[#013758]" /> {booking.hotel.city}
                      </p>
                      <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-[#013758]" /> {formatDate(booking.checkIn)} –{' '}
                          {formatDate(booking.checkOut)} · {booking.nights} đêm
                        </p>
                        <p>Mã đặt phòng: <strong className="text-[#202B36]">#{booking.code}</strong></p>
                        {eligibility.closesAt && (
                          <p className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-[#934a33]" /> Hạn đánh giá: {formatDateTime(eligibility.closesAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                  <div className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-white p-4 text-xs text-slate-500">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#35624A]" />
                    <p>Chỉ khách đã hoàn tất kỳ nghỉ mới được đánh giá, mỗi chuyến đi một đánh giá.</p>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
