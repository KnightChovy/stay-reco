import type { ReactNode } from "react";

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
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span>An Nhiên Riverside</span>
          <span aria-hidden="true">/</span>
          <span className="text-primary">Partner Workspace</span>
        </div>
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
