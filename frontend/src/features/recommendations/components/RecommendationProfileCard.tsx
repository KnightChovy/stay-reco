"use client";

import Link from "next/link";
import { Brain, EyeOff } from "lucide-react";
import type { RecommendationProfile, Recommendations } from "@stayreco/shared";
import { AMENITIES, STYLES } from "@/features/account/lib/preference-options";
import { formatMoney } from "@/features/stays/lib/format";
import { cn } from "@/lib/utils";

const styleLabel = (id: string) => STYLES.find((s) => s.id === id)?.title ?? id;
const amenityLabel = (id: string) => AMENITIES.find((a) => a.id === id)?.label ?? id;
const percent = (value: number) => `${Math.round(value * 100)}%`;

/** One share of the score as a bar: the label, the share, and what it means. */
function ShareBar({ label, hint, value, className }: { label: string; hint: string; value: number; className: string }) {
  return (
    <div className="space-y-1" title={`${label}: ${percent(value)}`}>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="font-bold tabular-nums text-foreground">{percent(value)}</span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
      >
        <div className={cn("h-full rounded-full", className)} style={{ width: `${Math.max(value * 100, value > 0 ? 2 : 0)}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/**
 * "Hệ thống hiểu bạn thế nào": what the customer's list is built from (`profile` of `GET /me/recommendations`): how
 * many stays the model knows, the share of the score from their history against their preferences (the model's own
 * weights, so a new customer reads 0% history and a regular most of it), what they said they like, and what was left
 * out of the list on purpose.
 */
export function RecommendationProfileCard({
  profile,
  source,
}: {
  profile: RecommendationProfile;
  source: Recommendations["source"];
}) {
  const { stays, weights, preferences, excluded } = profile;
  const history = weights.history;
  const content = weights.content + weights.group;
  const liked = [
    ...preferences.travelStyles.map(styleLabel),
    ...preferences.cities,
    ...preferences.roomAmenities.map(amenityLabel),
    ...(preferences.budgetPerNight ? [`dưới ${formatMoney(preferences.budgetPerNight)}/đêm`] : []),
  ];
  const left = [
    excluded.disliked > 0 && `${excluded.disliked} nơi bạn chấm dưới 3★`,
    excluded.upcoming > 0 && `${excluded.upcoming} nơi bạn đã đặt sắp ở`,
  ].filter(Boolean) as string[];

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5" aria-labelledby="reco-profile">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Brain className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="reco-profile" className="text-base font-bold text-foreground">
            Hệ thống hiểu bạn thế nào
          </h2>
          <p className="text-sm text-muted-foreground">
            {stays === 0
              ? "Bạn chưa có lượt ở nào được chấm điểm, nên danh sách dựa hoàn toàn vào sở thích bạn chọn và mô tả của khách sạn."
              : `Dựa trên ${stays} lượt ở bạn đã chấm điểm, cùng với sở thích bạn chọn.`}
            {source === "PREFERENCES" && " Mô hình đang tính riêng cho bạn, danh sách sẽ tự cập nhật sau vài giây."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ShareBar
          label="Từ lịch sử của bạn và khách cùng gu"
          hint="Những nơi bạn đã ở, và nơi khách có gu giống bạn đánh giá cao."
          value={history}
          className="bg-primary"
        />
        <ShareBar
          label="Từ sở thích và mô tả khách sạn"
          hint="Phong cách, điểm đến, tiện nghi bạn chọn, so với mô tả của từng khách sạn."
          value={content}
          className="bg-amber-500"
        />
      </div>

      <div className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Bạn thích</p>
          {liked.length ? (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {liked.map((item) => (
                <li key={item} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {item}
                </li>
              ))}
              {preferences.pickedHotels > 0 && (
                <li className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {preferences.pickedHotels} khách sạn bạn đã chọn
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Chưa chọn sở thích.{" "}
              <Link href="/account/preferences" className="font-semibold text-primary hover:underline">
                Chọn ngay
              </Link>
            </p>
          )}
        </div>
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
            <EyeOff className="size-3.5" aria-hidden /> Cố ý bỏ khỏi danh sách
          </p>
          <p className="mt-1.5 text-xs text-foreground">{left.length ? left.join(" · ") : "Không có nơi nào."}</p>
        </div>
      </div>
    </section>
  );
}
