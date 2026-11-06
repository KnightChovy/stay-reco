import type { ReactNode } from "react";

/** The hotel is picked in the header (PartnerShell), so the title only names the screen. */
export function PartnerTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="max-w-4xl text-[clamp(1.6rem,2.3vw,2.15rem)] font-bold leading-[1.18] tracking-[-0.025em] text-primary">
          {title}
        </h1>
        <p className="mt-2.5 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </section>
  );
}
