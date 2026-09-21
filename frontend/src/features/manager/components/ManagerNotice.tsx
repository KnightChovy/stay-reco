"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ManagerNotice({
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
