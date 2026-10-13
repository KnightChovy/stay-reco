"use client";

import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ManagerSystemBanner,
  ManagerTitle,
  useManagerActions,
} from "../components";
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
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    };
  }, []);

  const refresh = () => {
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    setRefreshing(true);
    refreshTimer.current = window.setTimeout(() => {
      setRefreshing(false);
      notify("Làm mới bảng điều hành");
      refreshTimer.current = null;
    }, 500);
  };

  return (
    <div className="space-y-6">
      <ManagerTitle
        title="Trung tâm điều hành đối tác StayReco"
        description="Giám sát sức khỏe mạng lưới khách sạn, SLA xác minh, chất lượng dịch vụ và dòng tiền toàn nền tảng Việt Nam."
        action={
          <>
            <Button
              variant="outline"
              onClick={() => notify("Xuất báo cáo điều hành")}
            >
              <Download />
              Xuất báo cáo
            </Button>
            <Button size="icon" variant="outline" aria-label="Làm mới dữ liệu" onClick={refresh}>
              <RefreshCw className={refreshing ? "animate-spin" : ""} />
            </Button>
          </>
        }
      />
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
