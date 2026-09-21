"use client";

import type { LucideIcon } from "lucide-react";
import { ManagerPanel } from "./ManagerPanel";

const toneColors = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-brand-accent-soft text-brand-accent",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
} as const;

export type ManagerMetricCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: keyof typeof toneColors;
};

export function ManagerMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: ManagerMetricCardProps) {
  return (
    <ManagerPanel className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-kpi font-bold tracking-tight text-primary">
            {value}
          </p>
        </div>
        <span
          className={`grid size-10 place-items-center rounded-xl ${toneColors[tone]}`}
        >
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">{hint}</p>
    </ManagerPanel>
  );
}
