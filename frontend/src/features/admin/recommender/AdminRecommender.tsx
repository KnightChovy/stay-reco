"use client";

import type { ReactNode } from "react";
import { BarChart3, BookOpenCheck, Sparkles, Target } from "lucide-react";
import type { RecommenderEvaluation } from "@stayreco/shared";
import { EmptyState, ErrorState } from "@/components/common/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PageTitle, Panel } from "../admin-primitives";
import { useRecommenderEvaluation } from "../api/admin-queries";
import { formatDateTime } from "../lib/labels";

type Method = RecommenderEvaluation["methods"][number];
type MethodKey = Method["key"];

/** Categorical slots, fixed order (validated: CVD and normal-vision separation, values always labelled). */
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a"] as const;

// Plain words for an admin who knows no formula; the technical names are only in tooltips (`term`).
const METHOD_LABELS: Record<MethodKey, { name: string; hint: string; term: string }> = {
  served: { name: "StayReco (đang dùng)", hint: "Kết hợp lịch sử đặt phòng, sở thích và khách có gu giống", term: "Two-sided shrinkage" },
  content: { name: "Chỉ theo sở thích", hint: "So mô tả khách sạn với sở thích khách khai báo", term: "Content-based (TF-IDF)" },
  cf: { name: "Chỉ theo lịch sử", hint: "Chỉ dựa vào những nơi khách đã chấm điểm", term: "Collaborative filtering (SVD++)" },
  popularity: { name: "Gợi ý chung", hint: "Ai cũng thấy cùng một danh sách được thích nhất", term: "Popularity" },
  random: { name: "Chọn bừa", hint: "Mốc thấp nhất để so sánh", term: "Random" },
};
// New guests who gave no preferences ("0-none") are not shown: onboarding is required since 2026-11-26, so a new
// guest always has answers; the few left are accounts from before, still counted in the overall figures.
const GROUP_LABELS: Record<string, string> = {
  "0-prefs": "Khách mới (đã trả lời câu hỏi sở thích)",
  "1-4": "Đã ở 1–4 lần",
  "5+": "Đã ở 5 lần trở lên",
};
const GROUP_SERIES: MethodKey[] = ["served", "popularity", "random"];

const pct = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined ? "—" : `${(value * 100).toFixed(digits)}%`;
/**
 * A share (0 to 1) read as "how many out of 10": Recall@10 0.303 reads "3/10", i.e. of 10 hotels a guest likes, the
 * top 10 finds 3. Below one in ten reads "dưới 1/10" rather than a fraction nobody pictures.
 */
const outOf10 = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return value * 10 < 0.95 ? "dưới 1/10" : `${Math.round(value * 10)}/10`;
};
/** The same with one decimal for bars, so methods a few points apart do not read the same ("1,7/10" and "2,3/10"). */
const outOf10Exact = (value: number) => `${(value * 10).toFixed(1).replace(".", ",")}/10`;
/** How many times better, one decimal, written the Vietnamese way ("2,9"). */
const times = (a: number | null | undefined, b: number | null | undefined) =>
  a && b ? (a / b).toFixed(1).replace(".", ",").replace(",0", "") : null;

/** A horizontal bar with its value written beside it as "x/10"; the row's tooltip keeps the exact share. */
function Bar({ label, value, max, color, strong }: { label: string; value: number; max: number; color: string; strong?: boolean }) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="group grid grid-cols-[minmax(0,11rem)_1fr_5rem] items-center gap-3 text-xs" title={`${label}: ${pct(value, 1)}`}>
      <span className={cn("truncate", strong ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
      <div className="h-3 rounded-r-[4px] bg-transparent">
        <div className="h-3 rounded-r-[4px] transition-opacity group-hover:opacity-80" style={{ width: `${Math.max(width, value > 0 ? 1 : 0)}%`, background: color }} />
      </div>
      <span className={cn("text-right tabular-nums", strong ? "font-bold text-foreground" : "text-foreground")}>{outOf10Exact(value)}</span>
    </div>
  );
}

/** Two plain bars for the long-tail bands, which are shares of slots, not hits: written as percentages. */
function ShareBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="grid grid-cols-[minmax(0,11rem)_1fr_5rem] items-center gap-3 text-xs" title={`${label}: ${pct(value, 1)}`}>
      <span className="truncate text-muted-foreground">{label}</span>
      <div className="h-3 rounded-r-[4px]" style={{ width: `${Math.max(width, value > 0 ? 1 : 0)}%`, background: color }} />
      <span className="text-right tabular-nums text-foreground">{pct(value)}</span>
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: item.color }} aria-hidden /> {item.label}
        </li>
      ))}
    </ul>
  );
}

function Headline({ icon: Icon, label, value, hint, term }: { icon: typeof Target; label: string; value: string; hint: ReactNode; term?: string }) {
  return (
    <Panel className="gap-0 p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground" title={term}>
        <Icon className="size-4 text-primary" aria-hidden /> {label}
      </p>
      <p className="mt-2 text-[32px] font-bold leading-10 tabular-nums text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Panel>
  );
}

function Section({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <Panel className="gap-4 p-5">
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </Panel>
  );
}

/**
 * The evidence that the recommender recommends well (`GET /admin/recommender/evaluation`), for someone who only looks
 * at the screen: the served method against simpler ones on the same held-out stays, by how much the model knows about
 * a guest (cold start), where its top 10 goes by how reviewed the hotels are (long tail), and real bookings.
 */
export default function AdminRecommender() {
  const query = useRecommenderEvaluation();
  const data = query.data;

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Hệ thống gợi ý"
        title="Gợi ý có đúng không?"
        description="Hệ thống gợi ý có đoán đúng nơi khách thích không, và tốt hơn những cách gợi ý đơn giản bao nhiêu."
      />
      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : !data?.run ? (
        <EmptyState icon={BarChart3} title="Chưa có số liệu" description="Hệ thống gợi ý chưa chạy lần nào. Số liệu sẽ có sau lần chạy đầu tiên." />
      ) : (
        <Evaluation data={data} />
      )}
    </div>
  );
}

function Evaluation({ data }: { data: RecommenderEvaluation }) {
  const by = Object.fromEntries(data.methods.map((m) => [m.key, m])) as Partial<Record<MethodKey, Method>>;
  const served = by.served;
  const popular = by.popularity;
  const random = by.random;
  const better = times(served?.recall, popular?.recall);
  const higher = times(served?.ndcg, popular?.ndcg);
  const maxRecall = Math.max(...data.methods.map((m) => m.recall ?? 0));
  // Cold start first: a new guest who answered onboarding, then one who did not, then guests with stays.
  const groups = Object.keys(GROUP_LABELS).filter((group) => served?.byGroup.some((g) => g.group === group));
  const maxGroup = Math.max(
    ...GROUP_SERIES.flatMap((key) => (by[key]?.byGroup ?? []).map((g) => g.recall)),
    0,
  );
  const maxShare = Math.max(...data.longTail.flatMap((b) => [b.reviewShare, b.slotShare]), 0);

  return (
    <>
      <p className="text-xs text-muted-foreground">
        Cập nhật lần cuối {formatDateTime(data.run!.finishedAt)} · {data.run!.customers.toLocaleString("vi-VN")} khách có
        danh sách gợi ý riêng · {data.run!.hotels} khách sạn
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Headline
          icon={Target}
          label="Gợi ý có trúng không"
          term={`Recall@10 = ${pct(served?.recall, 1)}`}
          value={outOf10(served?.recall)}
          hint={`Cứ 10 nơi khách thích, hệ thống đoán trúng ${outOf10(served?.recall).replace("/10", "")} nơi trong 10 gợi ý đầu tiên.`}
        />
        <Headline
          icon={BarChart3}
          label="So với cách đơn giản"
          term={`Recall@10: ${pct(served?.recall, 1)} so với ${pct(popular?.recall, 1)}`}
          value={better ? `Gấp ${better} lần` : "—"}
          hint={`Trúng nhiều hơn gợi ý cùng một danh sách cho mọi khách (${outOf10(popular?.recall)}) · chọn bừa: ${outOf10(random?.recall)}.`}
        />
        <Headline
          icon={Sparkles}
          label="Khách sạn mới được gợi ý"
          term={`Cold-start item coverage = ${pct(served?.coldstartCoverage, 1)}`}
          value={outOf10(served?.coldstartCoverage)}
          hint={`Cứ 10 khách sạn chưa có đánh giá nào, ${outOf10(served?.coldstartCoverage).replace("/10", "")} nơi vẫn được gợi ý cho khách hợp gu · nếu chỉ theo lịch sử: ${outOf10(by.cf?.coldstartCoverage)}.`}
        />
        <Headline
          icon={BookOpenCheck}
          label="Đặt phòng từ gợi ý (30 ngày)"
          value={`${data.bookings.fromRecommendations}/${data.bookings.total}`}
          hint={
            data.bookings.medianRank !== null
              ? `Khách sạn được đặt thường đứng thứ ${data.bookings.medianRank} trong danh sách gợi ý`
              : "Chưa có lượt đặt phòng nào đến từ gợi ý"
          }
        />
      </div>

      <Section
        title="Cứ 10 nơi khách thích, mỗi cách gợi ý đoán trúng mấy nơi"
        description={
          higher ? (
            <span title={`NDCG@10: ${served?.ndcg?.toFixed(3)} so với ${popular?.ndcg?.toFixed(3)}`}>
              Khi đoán trúng, StayReco cũng đưa nơi khách thích lên gần đầu danh sách hơn: tốt gấp {higher} lần gợi ý chung.
            </span>
          ) : (
            "Càng nhiều càng tốt."
          )
        }
      >
        <div className="space-y-2.5">
          {data.methods.map((m) => (
            <Bar key={m.key} label={METHOD_LABELS[m.key].name} value={m.recall ?? 0} max={maxRecall} color={SERIES[0]} strong={m.key === "served"} />
          ))}
        </div>
      </Section>

      <Section
        title="Theo từng nhóm khách"
        description="Khách càng ở nhiều, gợi ý càng trúng. Khách mới chưa ở lần nào, nhờ trả lời câu hỏi sở thích, vẫn được gợi ý trúng hơn gợi ý chung."
      >
        <Legend items={GROUP_SERIES.map((key, i) => ({ label: METHOD_LABELS[key].name, color: SERIES[i] }))} />
        <div className="grid gap-5 md:grid-cols-2">
          {groups.map((group) => (
            <div key={group} className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {GROUP_LABELS[group] ?? group}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({served?.byGroup.find((g) => g.group === group)?.users ?? 0} khách)
                </span>
              </p>
              <div className="space-y-[2px]">
                {GROUP_SERIES.map((key, i) => {
                  const value = by[key]?.byGroup.find((g) => g.group === group)?.recall;
                  return value === undefined ? null : (
                    <Bar key={key} label={METHOD_LABELS[key].name} value={value} max={maxGroup} color={SERIES[i]} strong={key === "served"} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Gợi ý có dồn vào vài khách sạn nổi tiếng không"
        description={
          <>
            Gợi ý có chia cho nhiều khách sạn hay chỉ dồn vào vài nơi nổi tiếng. {pct(served?.coverage)} khách sạn được gợi ý
            cho ít nhất một khách (gợi ý chung: {pct(popular?.coverage)}).
          </>
        }
      >
        <Legend
          items={[
            { label: "Phần đánh giá", color: SERIES[0] },
            { label: "Phần chỗ trong gợi ý", color: SERIES[1] },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.longTail.map((band) => (
            <div key={band.band} className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                {band.band === 1 ? "Nhiều đánh giá nhất" : band.band === data.longTail.length ? "Ít đánh giá nhất" : `Nhóm ${band.band}`}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({band.hotels} khách sạn, {band.minReviews}–{band.maxReviews} đánh giá)
                </span>
              </p>
              <div className="space-y-[2px]">
                <ShareBar label="Phần đánh giá" value={band.reviewShare} max={maxShare} color={SERIES[0]} />
                <ShareBar label="Phần chỗ trong gợi ý" value={band.slotShare} max={maxShare} color={SERIES[1]} />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
