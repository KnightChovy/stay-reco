"use client";

import type { ReactNode } from "react";
import { Check, Heart, Lightbulb, MapPin, Sparkles, Star, Users, Wallet } from "lucide-react";
import type { RecommendedHotel } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Reason = { icon: ReactNode; text: ReactNode };

/**
 * The reasons, in the customer's words, that put this hotel on their list: built from the `explanation` the
 * recommender wrote, without its numbers or its vocabulary. A customer reads "Bạn đã ở đây và chấm 4.8★" and "Đúng
 * phong cách Nghỉ dưỡng bạn chọn", the way large sites say "Because you watched…"; the shares and predicted ratings
 * stay on the admin's evaluation page.
 */
function reasonsFor(hotel: RecommendedHotel): Reason[] {
  const e = hotel.explanation;
  if (!e) return [];
  const reasons: Reason[] = [];

  if (e.own !== null) {
    reasons.push({
      icon: <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />,
      text: <>Bạn đã ở đây và chấm {e.own.toFixed(1)}★.</>,
    });
  }
  if (e.similar) {
    reasons.push({
      icon: <Heart className="size-4 text-rose-500" aria-hidden />,
      text: (
        <>
          Giống <strong>{e.similar.name ?? "một nơi"}</strong>, nơi bạn đã ở và rất thích.
        </>
      ),
    });
  }
  if (e.picked) {
    reasons.push({
      icon: <Heart className="size-4 text-rose-500" aria-hidden />,
      text:
        e.picked.hotelId === hotel.id ? (
          "Bạn đã chọn khách sạn này khi đăng ký."
        ) : (
          <>
            Giống <strong>{e.picked.name ?? "một nơi"}</strong> mà bạn đã chọn khi đăng ký.
          </>
        ),
    });
  }
  // Mostly carried by guests with the same taste, and nothing of their own to point at.
  if (e.own === null && e.weights.history >= 0.5) {
    reasons.push({
      icon: <Users className="size-4 text-primary" aria-hidden />,
      text: "Những khách có cùng sở thích với bạn rất thích nơi này.",
    });
  }
  if (e.weights.group >= 0.5) {
    reasons.push({
      icon: <Users className="size-4 text-primary" aria-hidden />,
      text: "Được những khách giống bạn đánh giá cao.",
    });
  }
  if (e.styles.length) {
    reasons.push({
      icon: <Check className="size-4 text-emerald-600" aria-hidden />,
      text: <>Đúng phong cách {e.styles.map((s) => s.toLowerCase()).join(", ")} bạn thích.</>,
    });
  }
  if (e.inCity) {
    reasons.push({
      icon: <MapPin className="size-4 text-emerald-600" aria-hidden />,
      text: <>Ở {hotel.city}, nơi bạn muốn đến.</>,
    });
  }
  if (e.hotelRatings === 0) {
    reasons.push({
      icon: <Sparkles className="size-4 text-amber-600" aria-hidden />,
      text: "Khách sạn mới trên StayReco, chưa có đánh giá.",
    });
  }
  if (e.inCity === false) {
    reasons.push({
      icon: <MapPin className="size-4 text-muted-foreground" aria-hidden />,
      text: "Ngoài những nơi bạn chọn, nhưng hợp với bạn.",
    });
  }
  if (e.overBudget) {
    reasons.push({
      icon: <Wallet className="size-4 text-muted-foreground" aria-hidden />,
      text: "Giá cao hơn ngân sách bạn đặt.",
    });
  }
  return reasons;
}

/** "Hợp với bạn" on a recommended hotel: a short list of plain reasons why it suits this customer. */
export function WhyRecommendedDialog({ hotel }: { hotel: RecommendedHotel }) {
  const reasons = reasonsFor(hotel);
  if (!reasons.length) return null;

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
        <Lightbulb className="size-3.5 text-amber-500" aria-hidden /> Hợp với bạn
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vì sao {hotel.name} hợp với bạn?</DialogTitle>
          <DialogDescription>Những lý do chúng tôi gợi ý nơi này cho riêng bạn.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 text-sm">
          {reasons.map((reason, index) => (
            <li key={index} className="flex gap-3">
              <span className="mt-0.5 shrink-0">{reason.icon}</span>
              <span className="text-foreground">{reason.text}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
