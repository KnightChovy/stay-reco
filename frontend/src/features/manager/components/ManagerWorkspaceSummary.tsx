"use client";

import { CheckCircle2, TimerReset, type LucideIcon } from "lucide-react";
import { ManagerPanel } from "./ManagerPanel";

export type ManagerWorkspaceSummaryProps = {
  icon: LucideIcon;
  summary: string;
};

export function ManagerWorkspaceSummary({
  icon: Icon,
  summary,
}: ManagerWorkspaceSummaryProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <ManagerPanel className="p-5">
        <div className="flex justify-between">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon size={20} />
          </span>
          <span className="text-xs font-semibold text-success">↑ 8,4%</span>
        </div>
        <strong className="mt-4 block text-2xl text-primary">
          {summary}
        </strong>
        <p className="mt-2 text-xs text-muted-foreground">
          So với chu kỳ vận hành trước
        </p>
      </ManagerPanel>
      <ManagerPanel className="p-5">
        <TimerReset className="text-warning" size={20} />
        <strong className="mt-4 block text-2xl text-primary">
          2 giờ 18 phút
        </strong>
        <p className="mt-2 text-xs text-muted-foreground">
          Thời gian xử lý trung bình · trong SLA
        </p>
      </ManagerPanel>
      <ManagerPanel className="p-5">
        <CheckCircle2 className="text-success" size={20} />
        <strong className="mt-4 block text-2xl text-primary">96,8%</strong>
        <p className="mt-2 text-xs text-muted-foreground">
          Tỷ lệ hoàn thành không cần mở lại
        </p>
      </ManagerPanel>
    </section>
  );
}
