"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Hotel } from "@stayreco/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHotel } from "../api/partner-queries";
import {
  ErrorPanel,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  StatusBadge,
  SuspendedBanner,
  useConfirmDiscard,
  usePartnerHotel,
} from "../components";
import { formatDateTime, hotelStatusLabels } from "../lib/labels";
import { HotelAmenitiesForm } from "./HotelAmenitiesForm";
import { CancellationPolicyForm } from "./CancellationPolicyForm";
import { HotelImagesManager } from "./HotelImagesManager";
import { HotelInfoForm } from "./HotelInfoForm";
import { HotelPoliciesForm } from "./HotelPoliciesForm";
import { OnboardingStrip } from "./OnboardingProgress";
import { RoomConfigForm } from "./RoomConfigForm";

const tabs = [
  { value: "info", label: "Thông tin chung" },
  { value: "amenities", label: "Tiện ích" },
  { value: "policies", label: "Chính sách" },
  { value: "cancellation", label: "Huỷ phòng" },
  { value: "room-config", label: "Cấu hình phòng" },
  { value: "images", label: "Hình ảnh" },
] as const;
type HotelTab = (typeof tabs)[number]["value"];

function isHotelTab(value: string | null): value is HotelTab {
  return tabs.some((tab) => tab.value === value);
}

export default function PartnerHotel() {
  const {
    hotels,
    hotel: summary,
    isLoading,
    error,
    refetch,
    isSuspended,
  } = usePartnerHotel();
  const hotelQuery = useHotel(summary?.id);

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Khách sạn & cơ sở"
        description="Quản lý thông tin hiển thị, tiện ích, chính sách, cấu hình phòng và hình ảnh của khách sạn."
      />
      {isSuspended && <SuspendedBanner />}

      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : hotels.length === 0 ? (
        // New hotels are added from "Hồ sơ & xác minh", where their verification starts.
        <NoHotelPanel />
      ) : hotelQuery.isLoading ? (
        <LoadingPanel rows={5} />
      ) : hotelQuery.error || !hotelQuery.data ? (
        <ErrorPanel
          error={hotelQuery.error}
          onRetry={() => void hotelQuery.refetch()}
        />
      ) : (
        <HotelDetail key={hotelQuery.data.id} hotel={hotelQuery.data} />
      )}
    </div>
  );
}

function HotelDetail({ hotel }: { hotel: Hotel }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const tab: HotelTab = isHotelTab(requested) ? requested : "info";
  const status = hotelStatusLabels[hotel.status];
  const confirmDiscard = useConfirmDiscard();

  // The tab lives in the URL so other screens can link to it (e.g. the room limit error → ?tab=room-config).
  // A tab's form unmounts when another tab opens, so unsaved edits are confirmed first.
  const setTab = (value: HotelTab) => {
    if (value === tab || !confirmDiscard()) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    // One column: the save bar of a long form stays at the bottom of the viewport with nothing below it.
    <section className="space-y-5">
      {hotel.status === "DRAFT" && <OnboardingStrip hotel={hotel} />}
      {/* Card clips its content by default, which would also pin the sticky save bar inside it. */}
      <PartnerPanel className="min-w-0 overflow-visible! p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-primary">{hotel.name}</h2>
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          <span className="text-xs text-muted-foreground">
            Tạo lúc {formatDateTime(hotel.createdAt)}
          </span>
        </div>
        <Tabs value={tab} onValueChange={(value) => setTab(value as HotelTab)}>
          <div className="overflow-x-auto pb-1">
            <TabsList>
              {tabs.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="info" className="pt-4">
            <HotelInfoForm hotel={hotel} />
          </TabsContent>
          <TabsContent value="amenities" className="pt-4">
            <HotelAmenitiesForm hotel={hotel} />
          </TabsContent>
          <TabsContent value="policies" className="pt-4">
            <HotelPoliciesForm hotel={hotel} />
          </TabsContent>
          <TabsContent value="cancellation" className="pt-4">
            <CancellationPolicyForm hotel={hotel} />
          </TabsContent>
          <TabsContent value="room-config" className="pt-4">
            <RoomConfigForm hotel={hotel} />
          </TabsContent>
          <TabsContent value="images" className="pt-4">
            <HotelImagesManager hotel={hotel} />
          </TabsContent>
        </Tabs>
      </PartnerPanel>
    </section>
  );
}
