"use client";

import { Check, CircleHelp, MapPin, Sparkles, Star, Wallet } from "lucide-react";
import type { RecommendedHotel } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PARTS = [
  {
    key: "history",
    label: "Lịch sử của bạn & khách cùng gu",
    detail: "Dự đoán từ điểm bạn và những khách giống bạn đã chấm (lọc cộng tác, SVD++).",
    bar: "bg-primary",
  },
  {
    key: "content",
    label: "Sở thích & mô tả khách sạn",
    detail: "Mô tả, tiện nghi của khách sạn so với sở thích bạn chọn và nơi bạn đã thích.",
    bar: "bg-amber-500",
  },
  {
    key: "group",
    label: "Khách cùng nhóm với bạn",
    detail: "Điểm của khách cùng độ tuổi, giới tính và quốc tịch.",
    bar: "bg-slate-500",
  },
] as const;

/**
 * "Vì sao?" on a recommended hotel: the share of the score each part of the model carried and the rating it predicted
 * (the `explanation` the recommender wrote), what matched the customer's preferences, and whether the hotel is new
 * (no rating yet, so only its description could put it there: item cold start).
 */
export function WhyRecommendedDialog({ hotel }: { hotel: RecommendedHotel }) {
  const e = hotel.explanation;
  if (!e) return null;
  const matched = [
    ...e.styles.map((style) => `Phong cách ${style}`),
    ...(e.inCity ? [`Ở ${hotel.city}, nơi bạn chọn`] : []),
  ];

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="secondary"
            className="h-9 gap-1 rounded-full bg-card/95 px-3 text-xs font-semibold shadow-xs backdrop-blur hover:bg-card"
          />
        }
      >
        <CircleHelp className="size-3.5" aria-hidden /> Vì sao?
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vì sao gợi ý {hotel.name}?</DialogTitle>
          <DialogDescription>
            Điểm dự đoán bạn sẽ chấm: <strong className="text-foreground">{hotel.score.toFixed(1)}/5</strong> · hạng{" "}
            {hotel.rank} trong danh sách của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {hotel.reason && <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">{hotel.reason}</p>}

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Điểm đến từ đâu</p>
            {PARTS.map((part) => {
              const weight = e.weights[part.key];
              const score = e.scores[part.key];
              return (
                <div key={part.key} className={cn("space-y-1", weight === 0 && "opacity-60")} title={`${part.label}: ${Math.round(weight * 100)}%`}>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="font-semibold text-foreground">{part.label}</span>
                    <span className="shrink-0 tabular-nums text-foreground">
                      <strong>{Math.round(weight * 100)}%</strong>
                      {score !== null && <span className="text-muted-foreground"> · dự đoán {score.toFixed(1)}★</span>}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", part.bar)} style={{ width: `${weight * 100}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {weight === 0 && part.key === "history"
                      ? e.hotelRatings === 0
                        ? "Khách sạn mới, chưa ai chấm điểm: chưa có dữ liệu hành vi."
                        : "Bạn chưa có lượt ở nào: chưa có dữ liệu hành vi của bạn."
                      : part.detail}
                  </p>
                </div>
              );
            })}
          </div>

          <ul className="space-y-1.5 border-t border-border pt-3 text-xs">
            {e.hotelRatings === 0 && (
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden />
                <span>
                  <strong>Khách sạn mới</strong>: chưa ai đánh giá, được gợi ý nhờ mô tả giống nơi bạn thích.
                </span>
              </li>
            )}
            {e.own !== null && (
              <li className="flex gap-2">
                <Star className="mt-0.5 size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                <span>Bạn đã ở đây và chấm {e.own.toFixed(1)}★.</span>
              </li>
            )}
            {e.similar && (
              <li className="flex gap-2">
                <Star className="mt-0.5 size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                <span>
                  Giống <strong>{e.similar.name ?? "một nơi"}</strong> mà bạn đã chấm {e.similar.rating.toFixed(1)}★.
                </span>
              </li>
            )}
            {e.picked && (
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
                <span>
                  {e.picked.hotelId === hotel.id ? (
                    "Bạn đã chọn khách sạn này lúc khai báo sở thích."
                  ) : (
                    <>
                      Giống <strong>{e.picked.name ?? "một nơi"}</strong> bạn đã chọn lúc khai báo sở thích.
                    </>
                  )}
                </span>
              </li>
            )}
            {matched.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
            {e.inCity === false && (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span>Ngoài các điểm đến bạn chọn, xếp sau những nơi trong điểm đến.</span>
              </li>
            )}
            {e.overBudget && (
              <li className="flex gap-2">
                <Wallet className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span>Trên ngân sách bạn đặt, xếp sau những nơi trong ngân sách.</span>
              </li>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
