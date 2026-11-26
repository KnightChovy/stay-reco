"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Users } from "lucide-react";
import type { RecommendedHotel } from "@stayreco/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { StyleBadges } from "@/features/stays/components/StyleBadges";
import * as service from "@/services/recommendations.service";
import { recommendationKeys } from "../api/recommendation-queries";

const SHOWN = 5;

function Column({
  title,
  hint,
  icon: Icon,
  items,
  shared,
  personal,
  chosenStyles,
}: {
  title: string;
  hint: string;
  icon: typeof Users;
  items: RecommendedHotel[];
  shared: Set<string>;
  personal: boolean;
  chosenStyles: string[];
}) {
  return (
    <div className={cn("rounded-2xl border p-4", personal ? "border-primary/40 bg-primary/5" : "border-border bg-card")}>
      <p className="flex items-center gap-2 text-sm font-bold text-foreground">
        <Icon className={cn("size-4", personal ? "text-primary" : "text-muted-foreground")} aria-hidden /> {title}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      <ol className="mt-3 space-y-2">
        {items.slice(0, SHOWN).map((hotel, index) => (
          <li key={hotel.id} className="flex items-start gap-2.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-foreground">
              {index + 1}
            </span>
            <div className="min-w-0">
              <Link href={`/hotels/${hotel.id}`} className="block truncate text-sm font-semibold text-foreground hover:text-primary">
                {hotel.name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {hotel.city}
                {!shared.has(hotel.id) && personal && <span className="font-semibold text-primary"> · chỉ có trong danh sách của bạn</span>}
              </p>
              <StyleBadges styles={hotel.styles} chosen={chosenStyles} className="mt-1" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * The customer's list beside the one everyone signed out sees, top 5 each: what the model changes for this person
 * is what differs between the two columns.
 */
export function ComparePopular({ mine, chosenStyles = [] }: { mine: RecommendedHotel[]; chosenStyles?: string[] }) {
  const params = { limit: SHOWN };
  const popular = useQuery({
    queryKey: recommendationKeys.list(undefined, params),
    queryFn: () => service.getRecommendations(params, false),
    staleTime: 5 * 60 * 1000,
  });
  const theirs = popular.data?.items ?? [];
  const mineTop = mine.slice(0, SHOWN);
  const shared = new Set(theirs.filter((h) => mineTop.some((m) => m.id === h.id)).map((h) => h.id));
  const differ = mineTop.filter((h) => !shared.has(h.id)).length;

  return (
    <section className="space-y-3" aria-label="So sánh với danh sách phổ biến">
      {popular.isLoading ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : (
        <>
          <p className="text-sm text-foreground">
            <strong>
              {differ}/{mineTop.length}
            </strong>{" "}
            khách sạn đầu danh sách của bạn khác với danh sách phổ biến mà ai cũng thấy.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <Column
              title="Dành cho bạn"
              hint="Xếp theo lịch sử và sở thích của riêng bạn."
              icon={Sparkles}
              items={mineTop}
              shared={shared}
              personal
              chosenStyles={chosenStyles}
            />
            <Column
              title="Danh sách phổ biến"
              hint="Khách chưa đăng nhập thấy danh sách này: khách sạn được đánh giá cao nói chung."
              icon={Users}
              items={theirs}
              shared={shared}
              personal={false}
              chosenStyles={chosenStyles}
            />
          </div>
        </>
      )}
    </section>
  );
}
