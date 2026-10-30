"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BedDouble,
  Building2,
  CalendarCheck,
  ReceiptText,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Hotel } from "@stayreco/shared";
import {
  useHotel,
  useHotelBookings,
  useHotelStaff,
  useRefundQueueCount,
  useRooms,
  useRoomTypes,
  useVerificationRequests,
} from "../api/partner-queries";
import {
  ErrorPanel,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  StatusBadge,
  SuspendedBanner,
  usePartnerHotel,
} from "../components";
import { HotelSetupChecklist } from "../hotel/HotelSetupChecklist";
import { todayInVietnam } from "../lib/dates";
import { formatDateTime, hotelStatusLabels, verificationStatusLabels } from "../lib/labels";

export default function PartnerDashboard() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended } = usePartnerHotel();

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Tổng quan"
        description="Tình trạng khách sạn, kho phòng, nhân viên và hồ sơ xác minh của cơ sở đang quản lý."
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <DashboardContent key={hotel.id} hotelId={hotel.id} />
      )}
    </div>
  );
}

function DashboardContent({ hotelId }: { hotelId: string }) {
  const { hotels, selectHotel } = usePartnerHotel();
  const hotelQuery = useHotel(hotelId);

  if (hotelQuery.isLoading) return <LoadingPanel rows={4} />;
  if (hotelQuery.error || !hotelQuery.data) {
    return <ErrorPanel error={hotelQuery.error} onRetry={() => void hotelQuery.refetch()} />;
  }
  const hotel = hotelQuery.data;

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">
        <HotelCard hotel={hotel} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <BookingMetrics hotelId={hotel.id} />
          <RoomMetrics hotel={hotel} />
          <StaffMetric hotelId={hotel.id} />
          <VerificationMetric hotelId={hotel.id} />
        </div>
        {hotels.length > 1 && (
          <PartnerPanel className="overflow-hidden">
            <h2 className="border-b px-5 py-4 font-bold text-primary">Khách sạn của bạn ({hotels.length})</h2>
            <ul className="divide-y">
              {hotels.map((item) => {
                const status = hotelStatusLabels[item.status];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectHotel(item.id)}
                      aria-current={item.id === hotel.id ? "true" : undefined}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted aria-[current]:bg-primary/5"
                    >
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm text-primary">{item.name}</strong>
                        <span className="text-xs text-muted-foreground">{item.city}</span>
                      </span>
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    </button>
                  </li>
                );
              })}
            </ul>
          </PartnerPanel>
        )}
      </div>
      <aside>
        <HotelSetupChecklist hotel={hotel} />
      </aside>
    </section>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const status = hotelStatusLabels[hotel.status];
  const cover = hotel.images.find((image) => image.isCover) ?? hotel.images[0];

  return (
    <PartnerPanel className="flex flex-col overflow-hidden p-0 sm:flex-row">
      <div className="relative aspect-video bg-muted sm:aspect-auto sm:w-64 sm:shrink-0">
        {cover ? (
          <Image src={cover.url} alt={hotel.name} fill sizes="(min-width: 640px) 256px, 100vw" className="object-cover" />
        ) : (
          <span className="grid h-full min-h-32 place-items-center text-muted-foreground">
            <Building2 size={28} />
          </span>
        )}
      </div>
      <div className="flex-1 space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-primary">{hotel.name}</h2>
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        </div>
        <p className="text-sm text-muted-foreground">
          {hotel.address}, {hotel.city}
          {hotel.starRating ? ` · ${hotel.starRating} sao` : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          Nhận phòng {hotel.checkInTime ?? "—"} · Trả phòng {hotel.checkOutTime ?? "—"} · {hotel.amenities.length} tiện
          ích · {hotel.images.length} ảnh
        </p>
        <Link href="/partner/hotel" className="inline-block text-sm font-semibold text-primary hover:underline">
          Quản lý thông tin khách sạn
        </Link>
      </div>
    </PartnerPanel>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  href,
  isLoading,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  href: string;
  isLoading?: boolean;
}) {
  return (
    <Link href={href} className="block rounded-xl transition-shadow hover:shadow-md">
      <PartnerPanel className="h-full p-4">
        <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon size={18} />
        </span>
        <p className="mt-3 text-xs font-semibold text-muted-foreground">{label}</p>
        <strong className="mt-1 block text-xl text-primary">{isLoading ? "…" : value}</strong>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </PartnerPanel>
    </Link>
  );
}

function RoomMetrics({ hotel }: { hotel: Hotel }) {
  const roomTypes = useRoomTypes(hotel.id);
  // Only `meta.total` is needed, so one row per page is enough.
  const available = useRooms(hotel.id, { status: "AVAILABLE", page: 1, pageSize: 1 });
  const locked = useRooms(hotel.id, { status: "MAINTENANCE", page: 1, pageSize: 1 });
  const roomCount = (roomTypes.data ?? []).reduce((sum, type) => sum + type.roomCount, 0);
  const totalRooms = hotel.roomConfig?.totalRooms;

  return (
    <>
      <Metric
        icon={BedDouble}
        label="Phòng đã tạo"
        value={totalRooms ? `${roomCount}/${totalRooms}` : roomCount}
        hint={`${roomTypes.data?.length ?? 0} loại phòng`}
        href="/partner/rooms"
        isLoading={roomTypes.isLoading}
      />
      <Metric
        icon={BedDouble}
        label="Phòng sẵn sàng"
        value={available.data?.meta.total ?? 0}
        hint={`${locked.data?.meta.total ?? 0} phòng đang khoá`}
        href="/partner/rooms"
        isLoading={available.isLoading || locked.isLoading}
      />
    </>
  );
}

function StaffMetric({ hotelId }: { hotelId: string }) {
  const staff = useHotelStaff(hotelId);
  const members = staff.data ?? [];
  const active = members.filter((member) => member.status === "ACTIVE").length;
  const invited = members.filter((member) => member.status === "INVITED").length;

  return (
    <Metric
      icon={UsersRound}
      label="Nhân viên hoạt động"
      value={active}
      hint={`${invited} lời mời đang chờ`}
      href="/partner/staff"
      isLoading={staff.isLoading}
    />
  );
}

function BookingMetrics({ hotelId }: { hotelId: string }) {
  const today = todayInVietnam();
  // Only `meta.total` is needed, so one row per page is enough.
  const arrivals = useHotelBookings(hotelId, {
    checkInFrom: today,
    checkInTo: today,
    status: ["CONFIRMED", "CHECKED_IN"],
    page: 1,
    pageSize: 1,
  });
  const refunds = useRefundQueueCount(hotelId);

  return (
    <>
      <Metric
        icon={CalendarCheck}
        label="Nhận phòng hôm nay"
        value={arrivals.data?.meta.total ?? 0}
        hint="Booking đã xác nhận hoặc đã check-in"
        href="/partner/bookings"
        isLoading={arrivals.isLoading}
      />
      <Metric
        icon={ReceiptText}
        label="Chờ hoàn tiền"
        value={refunds.count}
        hint={refunds.count > 0 ? "Cần bạn duyệt hoặc từ chối" : "Không có yêu cầu nào"}
        href="/partner/bookings"
        isLoading={refunds.isLoading}
      />
    </>
  );
}

function VerificationMetric({ hotelId }: { hotelId: string }) {
  const requests = useVerificationRequests(hotelId);
  const latest = requests.data?.[0];

  return (
    <Metric
      icon={ShieldCheck}
      label="Hồ sơ xác minh"
      value={latest ? verificationStatusLabels[latest.status].label : "Chưa gửi"}
      hint={latest ? `Gửi ${formatDateTime(latest.submittedAt)}` : undefined}
      href="/partner/verification"
      isLoading={requests.isLoading}
    />
  );
}
