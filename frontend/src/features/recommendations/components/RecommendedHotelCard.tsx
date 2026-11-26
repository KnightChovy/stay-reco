"use client";

import Image from "next/image";
import Link from "next/link";
import { Lightbulb, MapPin, Sparkles, Star } from "lucide-react";
import type { RecommendedHotel } from "@stayreco/shared";
import { formatMoney } from "@/features/stays/lib/format";
import { cn } from "@/lib/utils";
import { WhyRecommendedDialog } from "./WhyRecommendedDialog";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";

/**
 * One hotel from the recommender: the card, why it was picked, and the base price per night. "Vì sao?" (when the
 * recommender explained it) sits over the picture, outside the link, so it opens the explanation instead of the hotel.
 */
export function RecommendedHotelCard({
  hotel,
  className,
}: {
  hotel: RecommendedHotel;
  className?: string;
}) {
  return (
    <div className={cn("relative flex", className)}>
      <Link
        href={`/hotels/${hotel.id}${hotel.recommendationId ? `?recommendationId=${hotel.recommendationId}` : ""}`}
        className={cn(
          "group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        )}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <Image
            src={hotel.coverImageUrl ?? FALLBACK_IMAGE}
            alt={hotel.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {hotel.isNew && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950 shadow-xs">
              <Sparkles className="size-3" aria-hidden /> Mới
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
              <span className="truncate">{hotel.city}</span>
              {hotel.starRating ? (
                <span className="shrink-0">· {hotel.starRating} sao</span>
              ) : null}
            </p>
            <h3 className="mt-1 line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-primary">
              {hotel.name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {hotel.rating !== null ? (
                <>
                  <Star
                    className="size-3.5 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                  <span className="font-semibold text-foreground">
                    {hotel.rating.toFixed(1)}
                  </span>
                  <span>({hotel.reviewCount} đánh giá)</span>
                </>
              ) : (
                <span>Chưa có đánh giá</span>
              )}
            </p>
          </div>

          {hotel.reason && (
            <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
              <Lightbulb
                className="mt-0.5 size-3.5 shrink-0 text-amber-600"
                aria-hidden
              />
              <span>{hotel.reason}</span>
            </p>
          )}

          <div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-3">
            {hotel.pricePerNightFrom !== null ? (
              <p>
                <span className="block text-xs text-muted-foreground">
                  Giá từ
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatMoney(hotel.pricePerNightFrom)}
                </span>
                <span className="text-xs text-muted-foreground"> / đêm</span>
              </p>
            ) : (
              <span className="text-xs text-muted-foreground">
                Xem giá theo ngày đi
              </span>
            )}
            <span className="shrink-0 text-sm font-semibold text-primary group-hover:underline">
              Xem phòng
            </span>
          </div>
        </div>
      </Link>
      <div className="absolute top-3 right-3">
        <WhyRecommendedDialog hotel={hotel} />
      </div>
    </div>
  );
}

/** Same footprint as a card while the list loads. */
export function RecommendedHotelSkeleton() {
  return (
    <div
      className="h-[23rem] animate-pulse rounded-2xl border border-border bg-muted"
      aria-hidden
    />
  );
}
