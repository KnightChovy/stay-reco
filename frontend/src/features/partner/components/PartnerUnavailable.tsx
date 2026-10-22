import { Construction, type LucideIcon } from "lucide-react";
import { PartnerPanel } from "./PartnerPanel";
import { PartnerTitle } from "./PartnerTitle";

/**
 * Screen for a partner feature whose backend API does not exist yet. It states the phase that will deliver it
 * (docs/phases) instead of showing sample figures that could be mistaken for real data.
 */
export function PartnerUnavailable({
  title,
  description,
  phase,
  icon: Icon = Construction,
  upcoming,
}: {
  title: string;
  description: string;
  /** e.g. "Phase 3: Hotel operations". */
  phase: string;
  icon?: LucideIcon;
  /** What the screen will show once the API is available. */
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
          <h2 className="font-bold text-primary">Tính năng chưa có dữ liệu</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Backend chưa cung cấp API cho màn hình này. Dữ liệu sẽ hiển thị khi <strong>{phase}</strong> được triển khai.
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
