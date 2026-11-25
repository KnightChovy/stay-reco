"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Lock, Wallet } from "lucide-react";
import type { ContentStatus, ScheduleStatus, SocialPlatform } from "@stayreco/shared";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/common/StateViews";
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
        <nav className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/staff/dashboard" className="hover:text-primary">
            Bàn làm việc
          </Link>
          {[{ label: "Marketing", href: "/staff/marketing/content" }, ...crumbs].map((crumb, index, list) => (
            <span key={crumb.label} className="flex items-center gap-2">
              <ChevronRight className="size-3" aria-hidden />
              {crumb.href && index < list.length - 1 ? (
                <Link href={crumb.href} className="hover:text-primary">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          {icon} <span className="min-w-0 truncate">{title}</span>
        </h1>
        {description && <p className="mt-1 max-w-3xl text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold",
        className,
      )}
    >
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
  if (isMissingMarketingPermission(error)) {
    return (
      <EmptyState icon={Lock} title="Bạn chưa có quyền Marketing" description={getMarketingErrorMessage(error)} />
    );
  }
  return <ErrorState error={error} onRetry={onRetry} />;
}

/** Remaining AI budget; `undefined` while it loads or when the budget cannot be read. */
export function useAiBudgetState(hotelId: string | undefined) {
  const budget = useAiBudget(hotelId).data;
  return { budget, exhausted: !!budget && budget.remainingUsd <= 0 };
}

/** One line of budget next to a button that spends it. */
export function AiBudgetNote({ hotelId, cost, className }: { hotelId: string | undefined; cost: string; className?: string }) {
  const { budget, exhausted } = useAiBudgetState(hotelId);
  return (
    <p className={cn("flex items-center gap-1.5 text-xs", exhausted ? "font-semibold text-destructive" : "text-muted-foreground", className)}>
      <Wallet className="size-3.5 shrink-0" aria-hidden />
      {exhausted
        ? "Đã hết ngân sách AI tháng này, chưa thể dùng AI đến đầu tháng sau."
        : budget
          ? `Mỗi lần khoảng ${cost} · còn ${formatUsd(budget.remainingUsd)} ngân sách AI tháng này.`
          : `Mỗi lần khoảng ${cost}, trừ vào ngân sách AI hằng tháng.`}
    </p>
  );
}

/** The hotel's AI spend for the calendar month against its cap (`GET /hotels/:id/ai-budget`). */
export function AiBudgetCard({ hotelId, className }: { hotelId: string | undefined; className?: string }) {
  const budget = useAiBudget(hotelId).data;
  const used = budget && budget.limitUsd > 0 ? Math.min(100, (budget.spentUsd / budget.limitUsd) * 100) : 0;
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 shadow-2xs", className)}>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
        <Wallet className="size-3.5 text-primary" aria-hidden /> Ngân sách AI tháng này
      </p>
      {budget ? (
        <>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatUsd(budget.remainingUsd)} <span className="text-xs font-medium text-muted-foreground">còn lại</span>
          </p>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Ngân sách AI đã dùng"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(used)}
          >
            <div
              className={cn("h-full rounded-full", used >= 90 ? "bg-destructive" : "bg-primary")}
              style={{ width: `${used}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Đã dùng {formatUsd(budget.spentUsd)} / {formatUsd(budget.limitUsd)} · bài nháp khoảng $0.0005, ảnh AI khoảng
            $0.07
          </p>
          {budget.remainingUsd <= 0 && (
            <p className="mt-1 text-xs font-semibold text-destructive">Đã hết ngân sách, AI tạm dừng đến đầu tháng sau.</p>
          )}
        </>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">Chưa đọc được ngân sách.</p>
      )}
    </div>
  );
}

/** A destructive step asks first: says what is lost, keeps the dialog open while it runs. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-10" disabled={pending}>
            Giữ lại
          </AlertDialogCancel>
          <Button variant="destructive" className="h-10 gap-1.5" disabled={pending} onClick={onConfirm}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
