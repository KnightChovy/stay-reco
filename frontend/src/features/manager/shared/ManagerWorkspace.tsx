"use client";

import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ManagerDemoBanner,
  ManagerQueueSummary,
  ManagerTitle,
  ManagerWorkspaceSummary,
  ManagerWorkspaceTable,
  useManagerActions,
} from "../components";
import {
  managerAdditionalRows,
  managerQueueSummary,
  managerWorkspaces,
  managerWorkspaceTableHeads,
  type ManagerWorkspaceMode,
} from "@/lib/manager-data";

export function ManagerWorkspace({ mode }: { mode: ManagerWorkspaceMode }) {
  const { notify } = useManagerActions();
  const data = managerWorkspaces[mode];
  const rows = [...data.rows, ...managerAdditionalRows[mode]];

  return (
    <div className="space-y-6">
      <ManagerTitle
        title={data.title}
        description={data.description}
        action={
          <>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => notify(`Xuất dữ liệu ${data.title}`)}
            >
              <Download />
              Xuất dữ liệu
            </Button>
            <Button className="h-9" onClick={() => notify(data.action)}>
              <Plus />
              {data.action}
            </Button>
          </>
        }
      />
      <ManagerDemoBanner />
      <ManagerWorkspaceSummary icon={data.icon} summary={data.summary} />
      <section className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <ManagerWorkspaceTable
          rows={rows}
          tableHead={managerWorkspaceTableHeads[mode]}
          onAction={(name) => notify(`Xử lý ${name}`)}
        />
        <ManagerQueueSummary
          summary={managerQueueSummary}
          onViewLog={() => notify("Xem nhật ký kiểm toán")}
        />
      </section>
    </div>
  );
}
