import {
  ManagerQueuePanel,
  ManagerRegionChart,
  ManagerSignalTable,
} from "../../components";
import type { ManagerDashboardSignal } from "@/lib/manager-data";

type DashboardOperationsProps = {
  chartHeights: number[];
  regions: Array<[region: string, value: string, change: string]>;
  queue: Array<[title: string, detail: string, action: string]>;
  signalColumns: string[];
  signals: ManagerDashboardSignal[];
  onNotify: (message: string) => void;
};

export function DashboardOperations({
  chartHeights,
  regions,
  queue,
  signalColumns,
  signals,
  onNotify,
}: DashboardOperationsProps) {
  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[1.6fr_.85fr]">
        <ManagerRegionChart chartHeights={chartHeights} regions={regions} />
        <ManagerQueuePanel
          items={queue}
          urgentCount={3}
          onAction={(action, title) => onNotify(`${action}: ${title}`)}
        />
      </section>
      <ManagerSignalTable signals={signals} columns={signalColumns} />
    </>
  );
}
