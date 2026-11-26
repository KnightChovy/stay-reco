import { Check } from "lucide-react";
import { STYLES } from "@/features/account/lib/preference-options";
import { cn } from "@/lib/utils";

/**
 * The travel styles of a hotel (`styles` of a search result or a recommendation), as small badges: what the
 * recommender ranked it as, read from the hotel's own text. A style the customer chose is marked, so a list that fits
 * them shows it at a glance. Nothing is drawn for a hotel whose text says too little.
 */
export function StyleBadges({
  styles,
  chosen = [],
  className,
}: {
  styles: string[] | undefined;
  chosen?: string[];
  className?: string;
}) {
  if (!styles?.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Phong cách của khách sạn">
      {styles.map((id) => {
        const style = STYLES.find((s) => s.id === id);
        if (!style) return null;
        const Icon = style.icon;
        const mine = chosen.includes(id);
        return (
          <li
            key={id}
            title={mine ? `${style.title}: đúng phong cách bạn chọn` : style.title}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
              mine ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-border bg-muted text-muted-foreground",
            )}
          >
            {mine ? <Check className="size-3" aria-hidden /> : <Icon className="size-3" aria-hidden />}
            {style.title}
            {mine && <span className="sr-only"> (đúng phong cách bạn chọn)</span>}
          </li>
        );
      })}
    </ul>
  );
}
