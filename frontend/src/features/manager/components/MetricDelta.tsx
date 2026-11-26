import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const deltaFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

export function MetricDelta({
  value,
  good = "up",
  unit = "%",
}: {
  value: number | null;
  good?: "up" | "down";
  unit?: "%" | " điểm";
}) {
  if (value == null) return null;
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  const tone = value === 0 ? "text-muted-foreground" : value > 0 === (good === "up") ? "text-success" : "text-danger";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums", tone)}>
      <Icon size={12} aria-hidden />
      <span className="sr-only">{value > 0 ? "Tăng" : value < 0 ? "Giảm" : "Không đổi"}</span>
      {deltaFormat.format(Math.abs(value))}
      {unit}
    </span>
  );
}
