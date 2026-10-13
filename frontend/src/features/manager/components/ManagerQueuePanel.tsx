"use client";

import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManagerPanel } from "./ManagerPanel";

export type ManagerQueuePanelProps = {
  items: Array<[title: string, detail: string, action: string]>;
  urgentCount: number;
  onAction: (action: string, title: string) => void;
};

export function ManagerQueuePanel({
  items,
  urgentCount,
  onAction,
}: ManagerQueuePanelProps) {
  return (
    <ManagerPanel className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-primary">Hàng đợi ưu tiên</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Xử lý theo SLA gần nhất
          </p>
        </div>
        <span className="rounded-full bg-danger-soft px-2 py-1 text-[10px] font-bold text-danger">
          {urgentCount} khẩn cấp
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {items.map(([title, detail, action], index) => (
          <div key={title} className="rounded-xl bg-muted p-4">
            <div className="flex gap-3">
              <span
                className={`mt-1 size-2.5 shrink-0 rounded-full ${index === 0 ? "bg-warning" : index === 1 ? "bg-danger" : "bg-primary"}`}
              />
              <div>
                <strong className="text-sm text-primary">{title}</strong>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {detail}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction(action, title)}
                  className="mt-3 text-xs font-semibold text-primary"
                >
                  {action} <ArrowUpRight size={13} className="inline" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ManagerPanel>
  );
}
