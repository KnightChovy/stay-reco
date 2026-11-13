"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Lock, RotateCcw, Wallet } from "lucide-react";
import type { ContentStatus, ScheduleStatus, SocialPlatform } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toneClasses } from "../lib/labels";
import {
  contentStatusLabels,
  formatUsd,
  platformClasses,
  platformLabels,
  scheduleStatusLabels,
} from "../lib/marketing-labels";
import { getMarketingErrorMessage, isMissingMarketingPermission } from "../lib/marketing-errors";
import { useAiBudget } from "../api/marketing-queries";

export function MarketingHeader({
  title,
  icon,
  description,
  crumbs = [],
  actions,
}: {
  title: string;
  icon: ReactNode;
  description?: ReactNode;
  crumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <nav className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500" aria-label="Breadcrumb">
          <Link href="/staff/dashboard" className="hover:text-[#934a33]">
            Bàn làm việc
          </Link>
          {[{ label: "Marketing", href: "/staff/marketing/content" }, ...crumbs].map((crumb, index, list) => (
            <span key={crumb.label} className="flex items-center gap-2">
              <ChevronRight className="size-3" />
              {crumb.href && index < list.length - 1 ? (
                <Link href={crumb.href} className="hover:text-[#934a33]">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-slate-800">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          {icon} {title}
        </h1>
        {description && <p className="mt-1 max-w-3xl text-xs text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold", className)}>
      {children}
    </span>
  );
}

export function ContentStatusPill({ status }: { status: ContentStatus }) {
  const label = contentStatusLabels[status];
  return <Pill className={toneClasses[label.tone]}>{label.label}</Pill>;
}

export function ScheduleStatusPill({ status }: { status: ScheduleStatus }) {
  const label = scheduleStatusLabels[status];
  return <Pill className={toneClasses[label.tone]}>{label.label}</Pill>;
}

export function PlatformPill({ platform }: { platform: SocialPlatform }) {
  return <Pill className={platformClasses[platform]}>{platformLabels[platform]}</Pill>;
}

/** Whole-screen state for an error: a missing MARKETING permission is told apart from a failed request. */
export function MarketingErrorPanel({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const forbidden = isMissingMarketingPermission(error);
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
      {forbidden ? <Lock className="size-8 text-[#934a33]" /> : <AlertTriangle className="size-8 text-amber-500" />}
      <p className="text-sm font-semibold text-slate-800">
        {forbidden ? "Bạn chưa có quyền Marketing" : "Không tải được dữ liệu"}
      </p>
      <p className="max-w-md text-xs text-slate-500">{getMarketingErrorMessage(error)}</p>
      {!forbidden && onRetry && (
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onRetry}>
          <RotateCcw className="size-3.5" /> Thử lại
        </Button>
      )}
    </div>
  );
}

/** The hotel's AI spend for the calendar month against its cap (`GET /hotels/:id/ai-budget`). */
export function AiBudgetCard({ hotelId, className }: { hotelId: string | undefined; className?: string }) {
  const budget = useAiBudget(hotelId).data;
  const used = budget && budget.limitUsd > 0 ? Math.min(100, (budget.spentUsd / budget.limitUsd) * 100) : 0;
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-2xs", className)}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-500">
        <Wallet className="size-3.5 text-[#934a33]" /> Ngân sách AI tháng này
      </p>
      {budget ? (
        <>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatUsd(budget.remainingUsd)} <span className="text-xs font-medium text-slate-500">còn lại</span>
          </p>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Ngân sách AI đã dùng"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(used)}
          >
            <div
              className={cn("h-full rounded-full", used >= 90 ? "bg-red-500" : "bg-[#934a33]")}
              style={{ width: `${used}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Đã dùng {formatUsd(budget.spentUsd)} / {formatUsd(budget.limitUsd)} · mỗi bài nháp khoảng $0.0005
          </p>
        </>
      ) : (
        <p className="mt-1 text-xs text-slate-400">—</p>
      )}
    </div>
  );
}
