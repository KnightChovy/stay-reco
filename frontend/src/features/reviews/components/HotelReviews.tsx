"use client";

import { useState } from "react";
import { Loader2, MessageSquareText, RotateCcw, Star } from "lucide-react";
import type { ReviewListQuery } from "@stayreco/shared";
import Pagination from "@/components/common/pagination/Pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDate } from "@/features/stays/lib/format";
import { useHotelRatingSummary, useHotelReviews } from "@/features/account/api/rewards-queries";
import { StarDisplay } from "./StarRating";

const PAGE_SIZE = 5;

const SORTS: Array<{ id: ReviewListQuery["sort"]; label: string }> = [
  { id: "newest", label: "Mới nhất" },
  { id: "rating-desc", label: "Điểm cao nhất" },
  { id: "rating-asc", label: "Điểm thấp nhất" },
];

function ratingWord(average: number) {
  if (average >= 4.5) return "Tuyệt hảo";
  if (average >= 4) return "Rất tốt";
  if (average >= 3) return "Tốt";
  if (average >= 2) return "Trung bình";
  return "Kém";
}

/** Reviews section of the hotel page: the figures (`rating-summary`) and the visible reviews, paged. */
export function HotelReviews({ hotelId }: { hotelId: string }) {
  const [sort, setSort] = useState<ReviewListQuery["sort"]>("newest");
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const summaryQuery = useHotelRatingSummary(hotelId);
  const reviewsQuery = useHotelReviews(hotelId, { sort, minRating, page, pageSize: PAGE_SIZE });
  const summary = summaryQuery.data;
  const reviews = reviewsQuery.data?.reviews ?? [];
  const meta = reviewsQuery.data?.meta;

  const changeFilter = (next: { sort?: ReviewListQuery["sort"]; minRating?: number | undefined }) => {
    if (next.sort !== undefined) setSort(next.sort);
    if ("minRating" in next) setMinRating(next.minRating);
    setPage(1);
  };

  return (
    <section id="reviews" className="rounded-2xl border border-border bg-white p-6 shadow-2xs">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
        <MessageSquareText className="size-5 text-primary" /> Đánh giá từ khách đã ở
      </h2>

      {summaryQuery.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Đang tải đánh giá…
        </div>
      ) : summaryQuery.error || !summary ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-xs text-muted-foreground">{getApiErrorMessage(summaryQuery.error)}</p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void summaryQuery.refetch()}>
            <RotateCcw className="size-3.5" /> Thử lại
          </Button>
        </div>
      ) : summary.count === 0 ? (
        <div className="rounded-xl bg-slate-50 p-6 text-center">
          <Star className="mx-auto size-7 text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-foreground">Chưa có đánh giá nào</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Chỉ khách đã hoàn tất kỳ nghỉ tại đây mới có thể đánh giá.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 border-b border-border pb-6 md:grid-cols-12">
            <div className="flex flex-col items-center justify-center rounded-xl bg-primary/5 p-4 text-center md:col-span-3">
              <span className="text-4xl font-bold text-primary">{summary.average.toFixed(1)}</span>
              <StarDisplay value={summary.average} className="mt-1" />
              <span className="mt-1 text-xs font-semibold text-foreground">{ratingWord(summary.average)}</span>
              <span className="text-[11px] text-muted-foreground">{summary.count} đánh giá thực</span>
            </div>

            <div className="space-y-1.5 md:col-span-4">
              {[...summary.distribution]
                .sort((a, b) => b.star - a.star)
                .map((bucket) => {
                  const share = summary.count ? Math.round((bucket.count / summary.count) * 100) : 0;
                  const active = minRating === bucket.star;
                  return (
                    <button
                      key={bucket.star}
                      type="button"
                      onClick={() => changeFilter({ minRating: active ? undefined : bucket.star })}
                      aria-pressed={active}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-1 text-xs transition-colors hover:bg-slate-50",
                        active && "bg-primary/5",
                      )}
                      aria-label={`${bucket.star} sao trở lên: lọc đánh giá`}
                    >
                      <span className="w-8 text-left font-semibold text-foreground">{bucket.star} ★</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span className="block h-full rounded-full bg-amber-400" style={{ width: `${share}%` }} />
                      </span>
                      <span className="w-8 text-right text-muted-foreground">{bucket.count}</span>
                    </button>
                  );
                })}
            </div>

            <div className="space-y-2 md:col-span-5">
              {summary.criteria.map((criterion) => (
                <div key={criterion.criterionId} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{criterion.name}</span>
                    <span className="font-semibold text-foreground">{criterion.average.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(criterion.average / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Sắp xếp đánh giá">
              {SORTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={sort === item.id}
                  onClick={() => changeFilter({ sort: item.id })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    sort === item.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-white text-muted-foreground hover:bg-slate-50",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {minRating !== undefined && (
              <button
                type="button"
                onClick={() => changeFilter({ minRating: undefined })}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Đang lọc từ {minRating} sao · Bỏ lọc
              </button>
            )}
          </div>

          {reviewsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Đang tải đánh giá…
            </div>
          ) : reviewsQuery.error ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{getApiErrorMessage(reviewsQuery.error)}</p>
          ) : reviews.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Không có đánh giá nào khớp bộ lọc.</p>
          ) : (
            <ul className={cn("space-y-4", reviewsQuery.isPlaceholderData && "opacity-60")}>
              {reviews.map((review) => (
                <li key={review.id} className="space-y-2 rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {review.authorName.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{review.authorName}</p>
                        <p className="text-[11px] text-muted-foreground">Lưu trú đến {formatDate(review.stayedAt)}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                      {review.overallRating.toFixed(1)} <Star className="size-3 fill-current" />
                    </span>
                  </div>
                  {review.title && <h3 className="text-sm font-bold text-foreground">{review.title}</h3>}
                  <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{review.content}</p>
                </li>
              ))}
            </ul>
          )}

          {meta && meta.totalPages > 1 && (
            <Pagination className="mt-4" currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </section>
  );
}
