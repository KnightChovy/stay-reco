"use client";

import { Check, Info, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** `info` is for outcomes that are neither a success nor a failure, e.g. a sample action that stores nothing. */
export type ManagerNoticeTone = "success" | "error" | "info";

const toneStyles = {
  success: { icon: Check, border: "border-success/20", iconClass: "text-success" },
  error: { icon: TriangleAlert, border: "border-danger/25", iconClass: "text-danger" },
  info: { icon: Info, border: "border-brand-accent/30", iconClass: "text-brand-accent" },
} as const;

export function ManagerNotice({
  message,
  tone = "success",
  onClose,
}: {
  message: string;
  tone?: ManagerNoticeTone;
  onClose: () => void;
}) {
  const style = toneStyles[tone];
  const Icon = style.icon;
  return (
    <output
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl border bg-card p-4 text-sm shadow-dialog",
        style.border,
      )}
    >
      <Icon size={18} className={cn("shrink-0", style.iconClass)} />
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
