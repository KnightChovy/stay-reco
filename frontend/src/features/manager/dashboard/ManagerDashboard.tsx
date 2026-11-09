"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { managerKeys } from "../api/manager-queries";
import {
  ManagerDemoBanner,
  ManagerSystemBanner,
  ManagerTitle,
  useManagerActions,
} from "../components";
import { PendingVerifications } from "./components/PendingVerifications";
import {
  managerDashboardChartHeights,
  managerDashboardMetrics,
  managerDashboardQueue,
  managerDashboardRegions,
  managerDashboardSignalColumns,
  managerDashboardSignals,
} from "@/lib/manager-data";
import { DashboardMetricGrid } from "./components/DashboardMetricGrid";
import { DashboardOperations } from "./components/DashboardOperations";

export default function ManagerDashboard() {
  const { notify } = useManagerActions();
  const queryClient = useQueryClient();
  // Only the live block reads the API, so refreshing refetches the manager queries (sample data has nothing to fetch).
  const refreshing = useIsFetching({ queryKey: managerKeys.all }) > 0;
  const refresh = () => void queryClient.invalidateQueries({ queryKey: managerKeys.all });

  return (
    <div className="space-y-6">
      <ManagerTitle
        title="Trung tâm điều hành đối tác StayReco"
        description="Giám sát sức khỏe mạng lưới khách sạn, SLA xác minh, chất lượng dịch vụ và dòng tiền toàn nền tảng Việt Nam."
        action={
          <>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => notify("Xuất báo cáo điều hành")}
            >
              <Download />
              Xuất báo cáo
            </Button>
            <Button size="icon-lg" variant="outline" aria-label="Làm mới dữ liệu" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={refreshing ? "animate-spin" : ""} />
            </Button>
          </>
        }
      />
      {/* Live data first; everything below the banner is sample data until the Phase 6 APIs exist. */}
      <PendingVerifications />
      <ManagerDemoBanner what="Các chỉ số, biểu đồ và danh sách bên dưới" />
      <ManagerSystemBanner
        title="Hệ thống đang vận hành ổn định"
        subtitle="99,97% uptime · Đối soát thanh toán hoạt động bình thường"
        badges={[
          { label: "248 đối tác hoạt động" },
          { label: "4 hồ sơ sắp vượt SLA", variant: "warning" },
        ]}
      />
      <DashboardMetricGrid metrics={managerDashboardMetrics} />
      <DashboardOperations
        chartHeights={managerDashboardChartHeights}
        regions={managerDashboardRegions}
        queue={managerDashboardQueue}
        signalColumns={managerDashboardSignalColumns}
        signals={managerDashboardSignals}
        onNotify={notify}
      />
    </div>
  );
}
