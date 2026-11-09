"use client";

import { useState } from "react";
import Link from "next/link";
import { BedDouble, CheckCircle2, ChevronRight, Loader2, RefreshCw, Sparkles } from "lucide-react";
import type { Room, RoomStatus } from "@stayreco/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useCleanRoom, useRoomTypes, useRooms } from "@/features/staff/api/staff-queries";
import { useStaffHotel } from "@/features/staff/components/StaffHotelProvider";
import { roomStatusLabels, toneClasses } from "@/features/staff/lib/labels";

const STATUS_ORDER: RoomStatus[] = ["CLEANING", "AVAILABLE", "OCCUPIED", "MAINTENANCE"];

/**
 * Housekeeping board: every room of the hotel (`GET /hotels/:id/rooms`) by floor, and "cleaned" for rooms a guest has
 * left (`POST /rooms/:id/clean`, FRONT_DESK). Locking a room for maintenance stays with the partner.
 */
export default function StaffRoomsPage() {
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const [status, setStatus] = useState<RoomStatus | "all">("all");
  const [roomTypeId, setRoomTypeId] = useState<string>("all");

  // At most 100 rooms per page; one page covers the hotels StayReco serves today.
  const roomsQuery = useRooms(hotelId, { pageSize: 100, sort: "room-number-asc" });
  const roomTypes = useRoomTypes(hotelId);
  const cleanRoom = useCleanRoom();
  const [cleaningId, setCleaningId] = useState<string | null>(null);

  const rooms = roomsQuery.data?.rooms ?? [];
  const total = roomsQuery.data?.meta?.total ?? rooms.length;
  const typeName = (id: string) => roomTypes.data?.find((type) => type.id === id)?.name ?? "—";
  const counts = STATUS_ORDER.map((value) => ({ value, count: rooms.filter((room) => room.status === value).length }));
  const visible = rooms.filter(
    (room) => (status === "all" || room.status === status) && (roomTypeId === "all" || room.roomTypeId === roomTypeId),
  );
  const floors = Array.from(new Set(visible.map((room) => room.floor))).sort((a, b) => (a ?? -1) - (b ?? -1));
  const loading = hotelLoading || roomsQuery.isLoading;

  const markCleaned = (room: Room) => {
    setCleaningId(room.id);
    cleanRoom.mutate(room.id, { onSettled: () => setCleaningId(null) });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
            <Link href="/staff/dashboard" className="hover:text-[#934a33]">Bàn làm việc</Link>
            <ChevronRight className="size-3" />
            <span className="font-medium text-slate-800">Tình trạng phòng</span>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <BedDouble className="size-7 text-[#934a33]" /> Tình trạng phòng
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Phòng khách vừa trả chuyển sang <strong>Đang dọn</strong>; bấm “Đã dọn xong” khi phòng sẵn sàng đón khách
            mới (cần quyền FRONT_DESK). Khoá phòng bảo trì do chủ khách sạn thực hiện.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 self-start text-xs sm:self-auto"
          onClick={() => void roomsQuery.refetch()}
          disabled={roomsQuery.isFetching}
        >
          <RefreshCw className={cn("size-3.5", roomsQuery.isFetching && "animate-spin")} /> Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {counts.map(({ value, count }) => {
          const label = roomStatusLabels[value];
          const active = status === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(active ? "all" : value)}
              aria-pressed={active}
              className={cn(
                "rounded-xl border bg-white p-4 text-left shadow-2xs transition hover:border-slate-300",
                active ? "border-[#934a33] ring-2 ring-[#934a33]/20" : "border-slate-200",
              )}
            >
              <span className="text-[11px] font-semibold uppercase text-slate-500">{label.label}</span>
              <span className="mt-1 block text-2xl font-bold text-slate-900">{loading ? "…" : count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500">Hạng phòng:</span>
        {[{ id: "all", name: "Tất cả" }, ...(roomTypes.data ?? [])].map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setRoomTypeId(type.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 font-semibold transition",
              roomTypeId === type.id ? "bg-[#934a33] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {type.name}
          </button>
        ))}
        <span className="ml-auto text-slate-500">
          {visible.length}/{total} phòng
        </span>
      </div>

      {cleanRoom.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {getApiErrorMessage(cleanRoom.error, "Không cập nhật được phòng.")}
        </p>
      )}

      {roomsQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Không tải được danh sách phòng</AlertTitle>
          <AlertDescription className="mt-1 flex flex-col items-start gap-3">
            <span>{getApiErrorMessage(roomsQuery.error, "Vui lòng thử lại sau.")}</span>
            <Button size="sm" variant="outline" onClick={() => void roomsQuery.refetch()}>
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-10 text-center">
          <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-500" />
          <p className="text-sm font-semibold text-slate-800">Không có phòng nào khớp bộ lọc</p>
        </div>
      ) : (
        floors.map((floor) => (
          <section key={floor ?? "none"} className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {floor == null ? "Chưa ghi tầng" : `Tầng ${floor}`}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {visible
                .filter((room) => room.floor === floor)
                .map((room) => {
                  const label = roomStatusLabels[room.status];
                  return (
                    <article
                      key={room.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-lg font-bold text-slate-900">{room.roomNumber}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              toneClasses[label.tone],
                            )}
                          >
                            {label.label}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-slate-500" title={typeName(room.roomTypeId)}>
                          {typeName(room.roomTypeId)}
                        </p>
                        {room.notes && <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">{room.notes}</p>}
                      </div>
                      {room.status === "CLEANING" && (
                        <Button
                          size="sm"
                          className="h-8 gap-1 bg-[#934a33] text-[11px] text-white hover:bg-[#7b3e2b]"
                          onClick={() => markCleaned(room)}
                          disabled={cleanRoom.isPending}
                        >
                          {cleaningId === room.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="size-3.5" />
                          )}
                          Đã dọn xong
                        </Button>
                      )}
                    </article>
                  );
                })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
