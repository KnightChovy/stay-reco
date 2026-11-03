"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { partnerKeys, useHotel, useTodayStats } from "../api/partner-queries";
import {
  ErrorPanel,
  LoadingPanel,
  NoHotelPanel,
  PartnerTitle,
  SuspendedBanner,
  usePartnerHotel,
} from "../components";
import { HotelSetupChecklist } from "../hotel/HotelSetupChecklist";
import { ActionItems } from "./ActionItems";
import { formatTime } from "./format";
import { OccupancyHeatmap } from "./OccupancyHeatmap";
import { PeriodStats } from "./PeriodStats";
import { TodaySummary, UpcomingArrivals } from "./TodayStats";

const vietnamHour = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "numeric",
  hourCycle: "h23",
});

/** By the hour in Asia/Ho_Chi_Minh, like every "today" of the dashboard. */
function greeting() {
  const hour = Number(vietnamHour.format(new Date()));
  if (hour >= 5 && hour < 11) return "Chào buổi sáng";
  if (hour >= 11 && hour < 13) return "Chào buổi trưa";
  if (hour >= 13 && hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** Partner dashboard (docs/api/partner-dashboard.md): every figure comes from the stats endpoints. */
export default function PartnerDashboard() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended } =
    usePartnerHotel();
  const userName = useAuthStore((state) => state.user?.name);

  return (
    <div className="space-y-6">
      <PartnerTitle
        title={userName ? `${greeting()}, ${userName}!` : `${greeting()}!`}
        description={
          hotel
            ? `Chúc bạn một ngày làm việc hiệu quả. Đây là tình hình hôm nay của ${hotel.name}.`
            : "Chúc bạn một ngày làm việc hiệu quả."
        }
        action={
          hotel && (
            <>
              <RefreshStats hotelId={hotel.id} />
              {/* The export holds money figures, so it is owner only like the KPIs. */}
              {hotel.myRole === "OWNER" && <ExportExcelButton />}
            </>
          )
        }
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <DashboardContent
          key={hotel.id}
          hotelId={hotel.id}
          isOwner={hotel.myRole === "OWNER"}
        />
      )}
    </div>
  );
}

/** "Cập nhật lúc HH:mm" from `generatedAt` (figures are computed on each request) and a button to refetch them all. */
function RefreshStats({ hotelId }: { hotelId: string }) {
  const queryClient = useQueryClient();
  const today = useTodayStats(hotelId);
  const fetching =
    useIsFetching({ queryKey: partnerKeys.statsOf(hotelId) }) > 0;

  return (
    <div className="flex items-center gap-3">
      {today.data && (
        <span className="text-xs text-muted-foreground">
          Cập nhật lúc {formatTime(today.data.generatedAt)}
        </span>
      )}
      <Button
        className={"cursor-pointer"}
        variant="outline"
        size="sm"
        disabled={fetching}
        onClick={() =>
          void queryClient.invalidateQueries({
            queryKey: partnerKeys.statsOf(hotelId),
          })
        }
      >
        <RefreshCw className={fetching ? "animate-spin" : undefined} />
        Làm mới
      </Button>
    </div>
  );
}

/**
 * Placeholder until the backend publishes the dashboard Excel export: the button is shown but disabled.
 * TODO: wire it to the export endpoint once it is in docs/api/partner-dashboard.md.
 */
function ExportExcelButton() {
  return (
    // A disabled button gets no pointer events, so the hint sits on a wrapper.
    <span title="Tính năng xuất Excel sẽ có khi backend hoàn thành API">
      <Button size="sm" disabled>
        <FileSpreadsheet />
        Xuất Excel
      </Button>
    </span>
  );
}

function DashboardContent({
  hotelId,
  isOwner,
}: {
  hotelId: string;
  isOwner: boolean;
}) {
  const hotelQuery = useHotel(hotelId);
  const hotel = hotelQuery.data;

  return (
    <div className="space-y-6">
      {/* ① What needs the partner now; the onboarding checklist stays next to it until the hotel is submitted. */}
      {hotel?.status === "DRAFT" ? (
        <section className="grid gap-6 xl:grid-cols-[1fr_300px]">
          <ActionItems hotelId={hotelId} />
          <HotelSetupChecklist hotel={hotel} />
        </section>
      ) : (
        <ActionItems hotelId={hotelId} />
      )}

      <TodaySummary hotelId={hotelId} />

      {/* Money and period KPIs are owner only: the API answers 403 to staff. */}
      {isOwner && <PeriodStats hotelId={hotelId} />}

      <section className="grid items-start gap-6 xl:grid-cols-2">
        <OccupancyHeatmap hotelId={hotelId} />
        <UpcomingArrivals hotelId={hotelId} />
      </section>
    </div>
  );
}
