"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const SCORE_LABELS: Record<number, string> = {
  1: "Kém",
  2: "Trung bình",
  3: "Khá",
  4: "Tốt",
  5: "Tuyệt hảo",
};

/** Read-only stars for a 1.0–5.0 score; a fractional star is drawn partly filled. */
export function StarDisplay({ value, className, size = "size-4" }: { value: number; className?: string; size?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value.toFixed(1)} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, value - (star - 1)));
        return (
          <span key={star} className="relative inline-flex">
            <Star className={cn(size, "text-slate-300")} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn(size, "fill-amber-400 text-amber-400")} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** Whole-star picker, keyboard friendly: each star is a radio of the group. */
export function StarInput({
  value,
  onChange,
  label,
  disabled,
}: {
  value: number | undefined;
  onChange: (score: number) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = value !== undefined && star <= value;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} sao: ${SCORE_LABELS[star]}`}
              disabled={disabled}
              onClick={() => onChange(star)}
              className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Star className={cn("size-6", active ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
            </button>
          );
        })}
      </div>
      <span className="min-w-20 text-xs font-semibold text-muted-foreground">
        {value !== undefined ? SCORE_LABELS[Math.round(value)] : "Chưa chấm"}
      </span>
    </div>
  );
}
