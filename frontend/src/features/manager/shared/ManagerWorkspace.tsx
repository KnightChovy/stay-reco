"use client";

import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
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
              onClick={() => notify(`Xuất dữ liệu ${data.title}`)}
            >
              <Download />
              Xuất dữ liệu
            </Button>
            <Button onClick={() => notify(data.action)}>
              <Plus />
              {data.action}
            </Button>
          </>
        }
      />
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
