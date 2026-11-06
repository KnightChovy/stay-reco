import { Construction, type LucideIcon } from "lucide-react";
import { PartnerPanel } from "./PartnerPanel";
import { PartnerTitle } from "./PartnerTitle";

/**
 * Screen for a partner feature that is not built yet, shown instead of sample figures that could be mistaken for real
 * data. The sidebar marks these routes "Sắp có", so this page is only reached by a direct link.
 */
export function PartnerUnavailable({
  title,
  description,
  icon: Icon = Construction,
  upcoming,
}: {
  title: string;
  description: string;
  /** Internal roadmap reference (docs/phases), e.g. "Phase 4". Never shown: partners do not know our phases. */
  phase: string;
  icon?: LucideIcon;
  /** What the partner will be able to do, written as benefits. */
  upcoming: string[];
}) {
  return (
    <div className="space-y-6">
      <PartnerTitle title={title} description={description} />
      <PartnerPanel className="flex flex-col items-center gap-4 px-5 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon size={22} />
        </span>
        <div className="space-y-2">
          <span className="inline-flex rounded-full bg-brand-accent-soft px-2.5 py-1 text-xs font-semibold text-brand-accent">
            Sắp ra mắt
          </span>
          <h2 className="font-bold text-primary">Tính năng đang được hoàn thiện</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Chúng tôi sẽ thông báo cho bạn ngay khi tính năng này sẵn sàng. Khi đó bạn có thể:
          </p>
        </div>
        <ul className="grid max-w-md gap-2 text-left text-sm text-muted-foreground">
          {upcoming.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-primary">
                •
              </span>
              {item}
            </li>
          ))}
        </ul>
      </PartnerPanel>
    </div>
  );
}
