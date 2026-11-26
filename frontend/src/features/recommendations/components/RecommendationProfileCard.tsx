"use client";

import Link from "next/link";
import { EyeOff, Sparkles, TriangleAlert } from "lucide-react";
import type { RecommendationProfile, RecommendationQuery, Recommendations } from "@stayreco/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { AMENITIES, STYLES } from "@/features/account/lib/preference-options";
import { formatMoney } from "@/features/stays/lib/format";
import { cn } from "@/lib/utils";

const styleLabel = (id: string) => STYLES.find((s) => s.id === id)?.title ?? id;
const amenityLabel = (id: string) => AMENITIES.find((a) => a.id === id)?.label ?? id;

/**
 * "Hệ thống hiểu bạn thế nào": what the customer's list is built from (`profile` of `GET /me/recommendations`): how
 * many stays the model knows, the share of the score from their history against their preferences (the model's own
 * weights, so a new customer reads 0% history and a regular most of it), what they said they like, and what was left
 * out of the list on purpose.
 */
export function RecommendationProfileCard({
  profile,
  source,
  onShowStyle,
}: {
  profile: RecommendationProfile;
  source: Recommendations["source"];
  /** Shows only hotels of this style (the "Xem khách sạn đúng gu" button). */
  onShowStyle?: (style: NonNullable<RecommendationQuery["style"]>) => void;
}) {
  const { stays, weights, preferences, excluded, budgetConflict } = profile;
  // In words, not shares: what the list leans on. A new customer has only their answers; a regular mostly their trips.
  const basis =
    stays === 0
      ? "Bạn chưa có chuyến đi nào trên StayReco, nên gợi ý dựa trên những gì bạn chọn khi đăng ký."
      : weights.history >= 0.5
        ? `Gợi ý chủ yếu dựa trên ${stays} chuyến đi bạn đã đánh giá, và những khách có cùng sở thích với bạn.`
        : `Gợi ý dựa trên ${stays} chuyến đi bạn đã đánh giá và những gì bạn chọn khi đăng ký.`;
  const liked = [
    ...preferences.travelStyles.map(styleLabel),
    ...preferences.cities,
    ...preferences.roomAmenities.map(amenityLabel),
    ...(preferences.budgetPerNight ? [`dưới ${formatMoney(preferences.budgetPerNight)}/đêm`] : []),
  ];
  const left = [
    excluded.disliked > 0 && `${excluded.disliked} nơi bạn không hài lòng`,
    excluded.upcoming > 0 && `${excluded.upcoming} nơi bạn sắp đến ở`,
  ].filter(Boolean) as string[];

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5" aria-labelledby="reco-profile">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="reco-profile" className="text-base font-bold text-foreground">
            Vì sao bạn thấy những gợi ý này
          </h2>
          <p className="text-sm text-muted-foreground">
            {basis}
            {source === "PREFERENCES" && " Danh sách sẽ được cập nhật thêm sau vài giây."}
          </p>
        </div>
      </div>

      {budgetConflict && (
        <div role="status" className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="flex gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            <span>
              {budgetConflict.cheapest === null ? (
                <>
                  Chưa có khách sạn <strong>{budgetConflict.styles.map(styleLabel).join(", ")}</strong>
                  {budgetConflict.cities.length ? ` ở ${budgetConflict.cities.join(", ")}` : ""}.
                </>
              ) : (
                <>
                  Không có khách sạn <strong>{budgetConflict.styles.map(styleLabel).join(", ")}</strong> nào dưới{" "}
                  <strong>{formatMoney(budgetConflict.budgetPerNight)}/đêm</strong>
                  {budgetConflict.cities.length ? ` ở ${budgetConflict.cities.join(", ")}` : ""}. Rẻ nhất từ{" "}
                  <strong>{formatMoney(budgetConflict.cheapest)}</strong>.
                </>
              )}{" "}
              Vì vậy chúng tôi đang ưu tiên những nơi vừa túi tiền của bạn.
            </span>
          </p>
          <div className="flex flex-wrap gap-2 pl-6">
            {budgetConflict.cheapest !== null && onShowStyle && (
              <Button
                className="h-10"
                onClick={() => onShowStyle(budgetConflict.styles[0] as NonNullable<RecommendationQuery["style"]>)}
              >
                Xem khách sạn đúng gu
              </Button>
            )}
            <Link href="/account/preferences" className={cn(buttonVariants({ variant: "outline" }), "h-10 bg-card")}>
              Sửa ngân sách
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Bạn đã chọn</p>
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
              Bạn chưa chọn gì.{" "}
              <Link href="/account/preferences" className="font-semibold text-primary hover:underline">
                Chọn ngay
              </Link>
            </p>
          )}
        </div>
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
            <EyeOff className="size-3.5" aria-hidden /> Không gợi ý lại
          </p>
          <p className="mt-1.5 text-xs text-foreground">{left.length ? left.join(" · ") : "Không có."}</p>
        </div>
      </div>
    </section>
  );
}
