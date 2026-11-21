"use client";

import { useState } from "react";
import { BedDouble, CheckCircle2, Loader2, Lock, RefreshCw, Sparkles, UserRound, type LucideIcon } from "lucide-react";
import type { Room, RoomStatus } from "@stayreco/shared";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useCleanRoom, useRoomTypes, useRooms } from "@/features/staff/api/staff-queries";
import { useStaffHotel } from "@/features/staff/components/StaffHotelProvider";
import { roomStatusLabels, toneClasses } from "@/features/staff/lib/labels";

const STATUS_ORDER: RoomStatus[] = ["CLEANING", "AVAILABLE", "OCCUPIED", "MAINTENANCE"];

const STATUS_ICON: Record<RoomStatus, LucideIcon> = {
  CLEANING: Sparkles,
  AVAILABLE: CheckCircle2,
  OCCUPIED: UserRound,
  MAINTENANCE: Lock,
};

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BedDouble className="size-6 text-primary" aria-hidden /> Tình trạng phòng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Phòng khách vừa trả chuyển sang “Đang dọn”; bấm “Đã dọn xong” khi phòng sẵn sàng đón khách mới. Khoá phòng
            bảo trì do chủ khách sạn thực hiện.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-10 shrink-0 gap-1.5"
          onClick={() => void roomsQuery.refetch()}
          disabled={roomsQuery.isFetching}
        >
          <RefreshCw className={cn("size-4", roomsQuery.isFetching && "animate-spin")} aria-hidden /> Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="group" aria-label="Lọc theo trạng thái">
        {counts.map(({ value, count }) => {
          const label = roomStatusLabels[value];
          const Icon = STATUS_ICON[value];
          const active = status === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(active ? "all" : value)}
              aria-pressed={active}
              className={cn(
                "flex min-h-16 items-center justify-between gap-3 rounded-xl border bg-card p-3 text-left transition hover:bg-muted",
                active ? "border-primary ring-2 ring-primary/25" : "border-border",
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border", toneClasses[label.tone])}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="truncate text-sm font-semibold text-foreground">{label.label}</span>
              </span>
              <span className="text-2xl font-bold text-foreground">{loading ? "…" : count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Lọc theo hạng phòng">
          {[{ id: "all", name: "Tất cả hạng" }, ...(roomTypes.data ?? [])].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setRoomTypeId(type.id)}
              aria-pressed={roomTypeId === type.id}
              className={cn(
                "h-10 shrink-0 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition",
                roomTypeId === type.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70",
              )}
            >
              {type.name}
            </button>
          ))}
        </div>
        <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
          {visible.length}/{total} phòng
        </span>
      </div>

      {cleanRoom.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {getApiErrorMessage(cleanRoom.error, "Không cập nhật được phòng.")}
        </p>
      )}

      {roomsQuery.error ? (
        <ErrorState title="Không tải được danh sách phòng" error={roomsQuery.error} onRetry={() => void roomsQuery.refetch()} />
      ) : loading ? (
        <LoadingState rows={4} label="Đang tải phòng…" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="Không có phòng nào khớp bộ lọc"
          action={
            status !== "all" || roomTypeId !== "all" ? (
              <Button
                variant="outline"
                className="h-10"
                onClick={() => {
                  setStatus("all");
                  setRoomTypeId("all");
                }}
              >
                Xoá bộ lọc
              </Button>
            ) : undefined
          }
        />
      ) : (
        floors.map((floor) => (
          <section key={floor ?? "none"} className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {floor == null ? "Chưa ghi tầng" : `Tầng ${floor}`}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {visible
                .filter((room) => room.floor === floor)
                .map((room) => {
                  const label = roomStatusLabels[room.status];
                  const Icon = STATUS_ICON[room.status];
                  return (
                    <article
                      key={room.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-lg font-bold text-foreground">{room.roomNumber}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground" title={typeName(room.roomTypeId)}>
                          {typeName(room.roomTypeId)}
                        </p>
                        <span
                          className={cn(
                            "mt-2 inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full border px-2 text-xs font-semibold",
                            toneClasses[label.tone],
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden /> {label.label}
                        </span>
                        {room.notes && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{room.notes}</p>}
                      </div>
                      {room.status === "CLEANING" && (
                        <Button
                          variant="outline"
                          className="h-10 gap-1.5"
                          onClick={() => markCleaned(room)}
                          disabled={cleanRoom.isPending}
                          aria-label={`Đánh dấu phòng ${room.roomNumber} đã dọn xong`}
                        >
                          {cleaningId === room.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Sparkles className="size-4" />
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
