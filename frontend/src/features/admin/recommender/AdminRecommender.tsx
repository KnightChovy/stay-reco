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

const METHOD_LABELS: Record<MethodKey, { name: string; hint: string }> = {
  served: { name: "StayReco (đang chạy)", hint: "Lịch sử + sở thích + nhóm khách, trộn theo lượng dữ liệu" },
  content: { name: "Chỉ nội dung", hint: "Chỉ so mô tả khách sạn với sở thích" },
  cf: { name: "Chỉ lịch sử (SVD++)", hint: "Chỉ dựa vào điểm khách đã chấm" },
  popularity: { name: "Phổ biến", hint: "Ai cũng thấy cùng một danh sách" },
  random: { name: "Ngẫu nhiên", hint: "Mức nền: không biết gì về khách" },
};
const GROUP_LABELS: Record<string, string> = {
  "0-prefs": "Khách mới, có khai báo sở thích",
  "0-none": "Khách mới, không khai báo gì",
  "1-4": "Đã ở 1–4 lần",
  "5+": "Đã ở 5 lần trở lên",
};
const GROUP_SERIES: MethodKey[] = ["served", "popularity", "random"];

const pct = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined ? "—" : `${(value * 100).toFixed(digits)}%`;

/** A horizontal bar with its value written beside it; the row is its own hover target. */
function Bar({ label, value, max, color, strong }: { label: ReactNode; value: number; max: number; color: string; strong?: boolean }) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="group grid grid-cols-[minmax(0,11rem)_1fr_3.5rem] items-center gap-3 text-xs" title={`${typeof label === "string" ? label : ""} ${pct(value, 1)}`}>
      <span className={cn("truncate", strong ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
      <div className="h-3 rounded-r-[4px] bg-transparent">
        <div className="h-3 rounded-r-[4px] transition-opacity group-hover:opacity-80" style={{ width: `${Math.max(width, value > 0 ? 1 : 0)}%`, background: color }} />
      </div>
      <span className={cn("text-right tabular-nums", strong ? "font-bold text-foreground" : "text-foreground")}>{pct(value, 1)}</span>
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

function Headline({ icon: Icon, label, value, hint }: { icon: typeof Target; label: string; value: string; hint: ReactNode }) {
  return (
    <Panel className="gap-0 p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
        title="Đánh giá mô hình gợi ý"
        description="Mỗi lần train, hệ thống giấu bớt những nơi khách thật sự đã ở rồi kiểm tra mô hình có đoán ra không, so với các cách gợi ý đơn giản hơn."
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
        <EmptyState icon={BarChart3} title="Mô hình chưa train lần nào" description="Chạy recommender/train.py để có số liệu." />
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
  const times = served?.recall && popular?.recall ? served.recall / popular.recall : null;
  const maxRecall = Math.max(...data.methods.map((m) => m.recall ?? 0));
  const maxNdcg = Math.max(...data.methods.map((m) => m.ndcg ?? 0));
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
        Lần train {formatDateTime(data.run!.finishedAt)} · {data.run!.customers.toLocaleString("vi-VN")} khách có danh sách
        riêng · {data.run!.hotels} khách sạn
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Headline
          icon={Target}
          label="Đoán trúng nơi khách thích"
          value={pct(served?.recall)}
          hint={
            <>
              Phổ biến: {pct(popular?.recall)} · ngẫu nhiên: {pct(random?.recall)}
              {times && <strong className="text-foreground"> · gấp {times.toFixed(1)} lần phổ biến</strong>}
            </>
          }
        />
        <Headline
          icon={BarChart3}
          label="Xếp đúng lên đầu (NDCG@10)"
          value={served?.ndcg?.toFixed(3) ?? "—"}
          hint={`Phổ biến: ${popular?.ndcg?.toFixed(3) ?? "—"} · ngẫu nhiên: ${random?.ndcg?.toFixed(3) ?? "—"}`}
        />
        <Headline
          icon={Sparkles}
          label="Khách sạn mới được gợi ý"
          value={pct(served?.coldstartCoverage)}
          hint={`Khách sạn chưa ai đánh giá vẫn lên top 10 · chỉ lịch sử: ${pct(by.cf?.coldstartCoverage)}`}
        />
        <Headline
          icon={BookOpenCheck}
          label="Booking từ gợi ý (30 ngày)"
          value={`${data.bookings.fromRecommendations}/${data.bookings.total}`}
          hint={
            data.bookings.medianRank !== null
              ? `Khách sạn được đặt thường đứng hạng ${data.bookings.medianRank} trong gợi ý`
              : "Chưa có booking nào bấm từ gợi ý"
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section
          title="Gợi ý trúng bao nhiêu nơi khách thật sự thích"
          description="Recall@10: trong những khách sạn khách đã chấm từ 4★ (bị giấu khi train), bao nhiêu phần nằm trong top 10 gợi ý."
        >
          <div className="space-y-2.5">
            {data.methods.map((m) => (
              <Bar key={m.key} label={METHOD_LABELS[m.key].name} value={m.recall ?? 0} max={maxRecall} color={SERIES[0]} strong={m.key === "served"} />
            ))}
          </div>
        </Section>
        <Section
          title="Nơi khách thích có nằm đầu danh sách không"
          description="NDCG@10: càng cao khi những nơi khách thích càng đứng gần đầu top 10."
        >
          <div className="space-y-2.5">
            {data.methods.map((m) => (
              <div key={m.key} className="grid grid-cols-[minmax(0,11rem)_1fr_3.5rem] items-center gap-3 text-xs" title={`${METHOD_LABELS[m.key].name}: ${m.ndcg?.toFixed(3)}`}>
                <span className={cn("truncate", m.key === "served" ? "font-semibold text-foreground" : "text-muted-foreground")}>
                  {METHOD_LABELS[m.key].name}
                </span>
                <div className="h-3 rounded-r-[4px]" style={{ width: `${maxNdcg ? ((m.ndcg ?? 0) / maxNdcg) * 100 : 0}%`, background: SERIES[0] }} />
                <span className={cn("text-right tabular-nums", m.key === "served" && "font-bold")}>{m.ndcg?.toFixed(3) ?? "—"}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section
        title="Theo lượng dữ liệu về khách (cold start)"
        description="Recall@10 theo nhóm khách. Khách mới có khai báo sở thích ở popup vẫn được gợi ý trúng hơn hẳn; khách mới không khai báo gì thì không cách nào đoán được."
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
        title="Long-tail: gợi ý có dồn vào vài khách sạn nổi tiếng không"
        description={
          <>
            Khách sạn chia 5 nhóm theo số đánh giá. So phần lượt đánh giá của mỗi nhóm với phần suất top 10 mà danh sách đang
            chạy dành cho nhóm đó. Độ phủ: {pct(served?.coverage)} khách sạn lọt top 10 của ít nhất một khách (phổ biến:{" "}
            {pct(popular?.coverage)}); {pct(served?.tailShare)} suất dành cho khách sạn ngoài 20% nổi tiếng nhất.
          </>
        }
      >
        <Legend
          items={[
            { label: "% lượt đánh giá", color: SERIES[0] },
            { label: "% suất trong top 10 gợi ý", color: SERIES[1] },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.longTail.map((band) => (
            <div key={band.band} className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                {band.band === 1 ? "Nổi tiếng nhất" : band.band === data.longTail.length ? "Ít đánh giá nhất" : `Nhóm ${band.band}`}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({band.hotels} khách sạn, {band.minReviews}–{band.maxReviews} đánh giá)
                </span>
              </p>
              <div className="space-y-[2px]">
                <Bar label="Lượt đánh giá" value={band.reviewShare} max={maxShare} color={SERIES[0]} />
                <Bar label="Suất gợi ý" value={band.slotShare} max={maxShare} color={SERIES[1]} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Bảng số đầy đủ"
        description={
          data.split
            ? `Train ${data.split.train.toLocaleString("vi-VN")} đánh giá, kiểm tra trên ${data.split.test.toLocaleString("vi-VN")} đánh giá bị giấu của ${data.split.rankedUsers} khách; ${data.split.hiddenHotels} khách sạn bị giấu toàn bộ đánh giá (giả làm khách sạn mới); xếp hạng trên toàn bộ ${data.split.catalog} khách sạn, top ${data.split.k}, "thích" = chấm từ ${data.split.threshold}★.`
            : "Lần train này có quá ít đánh giá để kiểm tra."
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-semibold">Phương pháp</th>
                <th className="px-2 py-2 text-right font-semibold">RMSE ↓</th>
                <th className="px-2 py-2 text-right font-semibold">P@10</th>
                <th className="px-2 py-2 text-right font-semibold">R@10</th>
                <th className="px-2 py-2 text-right font-semibold">NDCG@10</th>
                <th className="px-2 py-2 text-right font-semibold">KS mới lên gợi ý</th>
                <th className="px-2 py-2 text-right font-semibold">Độ phủ</th>
                <th className="py-2 pl-2 text-right font-semibold">Suất long-tail</th>
              </tr>
            </thead>
            <tbody>
              {data.methods.map((m) => (
                <tr key={m.key} className={cn("border-b border-border last:border-0", m.key === "served" && "bg-primary/5 font-semibold")}>
                  <td className="py-2 pr-3">
                    <p className="text-foreground">{METHOD_LABELS[m.key].name}</p>
                    <p className="font-normal text-muted-foreground">{METHOD_LABELS[m.key].hint}</p>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{m.rmse?.toFixed(3) ?? "—"}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{m.precision?.toFixed(3) ?? "—"}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{m.recall?.toFixed(3) ?? "—"}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{m.ndcg?.toFixed(3) ?? "—"}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{pct(m.coldstartCoverage)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{pct(m.coverage)}</td>
                  <td className="py-2 pl-2 text-right tabular-nums">{pct(m.tailShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
