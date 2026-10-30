"use client";

import { Check, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ManagerNoticeTone = "success" | "error";

export function ManagerNotice({
  message,
  tone = "success",
  onClose,
}: {
  message: string;
  tone?: ManagerNoticeTone;
  onClose: () => void;
}) {
  return (
    <output
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl border bg-card p-4 text-sm shadow-dialog",
        tone === "error" ? "border-danger/25" : "border-success/20",
      )}
    >
      {tone === "error" ? (
        <TriangleAlert size={18} className="shrink-0 text-danger" />
      ) : (
        <Check size={18} className="shrink-0 text-success" />
      )}
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
