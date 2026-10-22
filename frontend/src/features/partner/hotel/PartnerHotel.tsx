"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import type { Hotel } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHotel } from "../api/partner-queries";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  PartnerPanel,
  PartnerTitle,
  StatusBadge,
  SuspendedBanner,
  usePartnerHotel,
} from "../components";
import { formatDateTime, hotelStatusLabels } from "../lib/labels";
import { HotelAmenitiesForm } from "./HotelAmenitiesForm";
import { HotelImagesManager } from "./HotelImagesManager";
import { HotelInfoForm } from "./HotelInfoForm";
import { HotelPoliciesForm } from "./HotelPoliciesForm";
import { HotelSetupChecklist } from "./HotelSetupChecklist";
import { RoomConfigForm } from "./RoomConfigForm";

const tabs = [
  { value: "info", label: "Thông tin chung" },
  { value: "amenities", label: "Tiện ích" },
  { value: "policies", label: "Chính sách" },
  { value: "room-config", label: "Cấu hình phòng" },
  { value: "images", label: "Hình ảnh" },
] as const;
type HotelTab = (typeof tabs)[number]["value"];

function isHotelTab(value: string | null): value is HotelTab {
  return tabs.some((tab) => tab.value === value);
}

export default function PartnerHotel() {
  const { hotels, hotel: summary, isLoading, error, refetch, canEdit, isSuspended } = usePartnerHotel();
  const [createOpen, setCreateOpen] = useState(false);
  const hotelQuery = useHotel(summary?.id);

  const createAction = canEdit && (
    <Button onClick={() => setCreateOpen(true)}>
      <Plus />
      Thêm khách sạn
    </Button>
  );

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Khách sạn & cơ sở"
        description="Quản lý thông tin hiển thị, tiện ích, chính sách, cấu hình phòng và hình ảnh của khách sạn."
        action={hotels.length > 0 ? createAction : undefined}
      />
      {isSuspended && <SuspendedBanner />}

      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : hotels.length === 0 ? (
        <EmptyPanel
          icon={Building2}
          title="Bắt đầu với khách sạn đầu tiên"
          description="Khách sạn mới được tạo ở trạng thái bản nháp. Sau khi hoàn thiện thông tin, phòng và hình ảnh, bạn gửi hồ sơ xác minh để mở bán."
          action={createAction}
        />
      ) : hotelQuery.isLoading ? (
        <LoadingPanel rows={5} />
      ) : hotelQuery.error || !hotelQuery.data ? (
        <ErrorPanel error={hotelQuery.error} onRetry={() => void hotelQuery.refetch()} />
      ) : (
        <HotelDetail key={hotelQuery.data.id} hotel={hotelQuery.data} />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo khách sạn mới</DialogTitle>
            <DialogDescription>
              Khách sạn được lưu ở trạng thái bản nháp; bạn có thể bổ sung thông tin trước khi gửi xác minh.
            </DialogDescription>
          </DialogHeader>
          {createOpen && <HotelInfoForm onSaved={() => setCreateOpen(false)} />}
        </DialogContent>
      </Dialog>
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

  // The tab lives in the URL so other screens can link to it (e.g. the room limit error → ?tab=room-config).
  const setTab = (value: HotelTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <PartnerPanel className="min-w-0 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-primary">{hotel.name}</h2>
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          <span className="text-xs text-muted-foreground">Tạo lúc {formatDateTime(hotel.createdAt)}</span>
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
          <TabsContent value="room-config" className="pt-4">
            <RoomConfigForm hotel={hotel} />
          </TabsContent>
          <TabsContent value="images" className="pt-4">
            <HotelImagesManager hotel={hotel} />
          </TabsContent>
        </Tabs>
      </PartnerPanel>
      <HotelAside hotel={hotel} />
    </section>
  );
}

function HotelAside({ hotel }: { hotel: Hotel }) {
  return (
    <aside className="space-y-5">
      <HotelSetupChecklist hotel={hotel} />
      {hotel.status === "DRAFT" && (
        <PartnerPanel className="bg-primary p-5 text-primary-foreground">
          <h2 className="font-bold">Sẵn sàng mở bán?</h2>
          <p className="mt-2 text-sm text-primary-foreground/75">
            Khách sạn chỉ hiển thị với khách sau khi StayReco duyệt hồ sơ xác minh.
          </p>
          <Link
            href="/partner/verification"
            className="mt-4 inline-flex h-8 w-full items-center justify-center rounded-lg bg-card text-sm font-semibold text-primary hover:bg-card/90"
          >
            Gửi hồ sơ xác minh
          </Link>
        </PartnerPanel>
      )}
    </aside>
  );
}
