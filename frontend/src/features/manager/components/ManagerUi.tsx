"use client";

import type { ReactNode } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getManagerErrorMessage } from "../api/manager-queries";
import { toneClasses, type StatusTone } from "../lib/labels";
import { ManagerPanel } from "./ManagerPanel";

export function StatusBadge({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold", toneClasses[tone], className)}>
      {children}
    </span>
  );
}

export function ErrorPanel({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <ManagerPanel className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
      <TriangleAlert className="shrink-0 text-danger" size={20} />
      <p className="flex-1 text-sm text-muted-foreground">{getManagerErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          Thử lại
        </Button>
      )}
    </ManagerPanel>
  );
}
