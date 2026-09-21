import { ManagerMetricCard } from "../../components";
import type { ManagerDashboardMetric } from "@/lib/manager-data";

type DashboardMetricGridProps = {
  metrics: ManagerDashboardMetric[];
};

export function DashboardMetricGrid({ metrics }: DashboardMetricGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <ManagerMetricCard key={metric.label} {...metric} />
      ))}
    </section>
  );
}
