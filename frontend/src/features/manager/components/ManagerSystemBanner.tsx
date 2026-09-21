"use client";

import { ShieldCheck, type LucideIcon } from "lucide-react";

export type ManagerSystemBannerBadge = {
  label: string;
  variant?: "default" | "warning";
};

export type ManagerSystemBannerProps = {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  badges?: ManagerSystemBannerBadge[];
};

export function ManagerSystemBanner({
  title,
  subtitle,
  icon: Icon = ShieldCheck,
  badges = [],
}: ManagerSystemBannerProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-primary p-5 text-primary-foreground lg:flex-row lg:items-center">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-white/12">
          <Icon size={21} />
        </span>
        <div>
          <strong className="block">{title}</strong>
          <span className="text-xs text-primary-foreground/70">{subtitle}</span>
        </div>
      </div>
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className={`rounded-full px-3 py-1.5 text-xs ${
                badge.variant === "warning"
                  ? "bg-warning/80"
                  : "bg-white/10"
              }`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
