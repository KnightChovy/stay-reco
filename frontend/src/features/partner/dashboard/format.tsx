import { format } from "date-fns";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { Metric, RateMetric } from "@stayreco/shared";
import { cn } from "@/lib/utils";

/**
 * Formatting of the dashboard figures. The backend computes every figure (docs/api/partner-dashboard.md §1): these
 * helpers only format them, and `null` ("cannot be computed") is shown as "—".
 */

const numberFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const compactFormat = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });

export function formatNumber(value: number | null | undefined) {
  return value == null ? "—" : numberFormat.format(value);
}

/** Rates come as 0–100 with 1 decimal. */
export function formatPercent(value: number | null | undefined) {
  return value == null ? "—" : `${numberFormat.format(value)}%`;
}

/** Chart axes: "1,3 T" rather than the full amount. */
export function formatCompact(value: number) {
  return compactFormat.format(value);
}

/** ISO timestamp → "HH:mm" in the viewer's time zone. */
export function formatTime(iso: string | null | undefined) {
  return iso ? format(new Date(iso), "HH:mm") : "—";
}

/** "YYYY-MM-DD" → "dd/MM". */
export function formatShortDate(date: string) {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

/**
 * The change against the previous period: percent for amounts, counts and averages, percentage points for rates.
 * Coloured by meaning, not by sign: with `good="down"` (cancellations, refunds) a decrease is green. Nothing is
 * rendered without a comparison (previous 0 or null), so a "—" value is not followed by a second "—".
 */
export function Delta({ metric, good = "up" }: { metric: Metric | RateMetric; good?: "up" | "down" }) {
  const isRate = "deltaPoints" in metric;
  const delta = isRate ? metric.deltaPoints : metric.deltaPercent;
  if (delta == null) return null;

  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const tone = delta === 0 ? "text-muted-foreground" : delta > 0 === (good === "up") ? "text-success" : "text-danger";

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums", tone)}>
      <Icon size={12} aria-hidden />
      <span className="sr-only">{delta > 0 ? "Tăng" : delta < 0 ? "Giảm" : "Không đổi"}</span>
      {numberFormat.format(Math.abs(delta))}
      {isRate ? " điểm" : "%"}
    </span>
  );
}
