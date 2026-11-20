import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

/** Nothing to show yet: what is missing and, when there is one, the next step. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** A request failed: the server's own words when it sent any, and a retry. */
export function ErrorState({
  title = "Không tải được dữ liệu",
  error,
  fallback = "Kiểm tra kết nối mạng rồi thử lại.",
  onRetry,
  action,
  className,
}: {
  title?: string;
  error?: unknown;
  fallback?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50/60 px-5 py-8 text-center", className)}
    >
      <AlertTriangle className="size-8 text-red-500" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {error ? getApiErrorMessage(error, fallback) : fallback}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="h-10 gap-1.5">
            <RefreshCw className="size-4" /> Thử lại
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}

/** Placeholder rows shaped like the content that is coming. */
export function LoadingState({ rows = 3, className, label = "Đang tải…" }: { rows?: number; className?: string; label?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}
