"use client";

import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PartnerPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Card className={`bg-card shadow-card ${className}`}>{children}</Card>;
}
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
export function PartnerNotice({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <output className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-success/20 bg-card p-4 text-sm shadow-dialog">
      <Check size={18} className="text-success" />
      <span className="flex-1">{message}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onClose}
        aria-label="Đóng thông báo"
      >
        <X size={15} />
      </Button>
    </output>
  );
}
