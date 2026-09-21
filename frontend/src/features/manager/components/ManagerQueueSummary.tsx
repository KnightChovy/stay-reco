"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManagerPanel } from "./ManagerPanel";

export type ManagerQueueSummaryProps = {
  summary: Array<[label: string, value: string, tone: string]>;
  onViewLog: () => void;
};

export function ManagerQueueSummary({
  summary,
  onViewLog,
}: ManagerQueueSummaryProps) {
  return (
    <aside className="space-y-5">
      <ManagerPanel className="p-5">
        <h2 className="font-bold text-primary">Tổng quan hàng đợi</h2>
        <div className="mt-5 space-y-4">
          {summary.map(([label, value, tone]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl bg-muted p-3"
            >
              <span className="text-sm">{label}</span>
              <strong className={tone}>{value}</strong>
            </div>
          ))}
        </div>
      </ManagerPanel>
      <ManagerPanel className="p-5">
        <AlertTriangle className="text-warning" size={20} />
        <h2 className="mt-3 font-bold text-primary">Quy tắc điều hành</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Mọi thay đổi trạng thái phải có ghi chú, người phụ trách và dấu
          thời gian để đảm bảo truy vết.
        </p>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={onViewLog}
        >
          Xem nhật ký
        </Button>
      </ManagerPanel>
    </aside>
  );
}
