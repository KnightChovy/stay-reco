"use client";

import { useState } from "react";
import { DoorOpen, UserX } from "lucide-react";
import type { Booking, RoomOption } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation, useRoomOptions } from "../api/partner-queries";
import { ConfirmDialog, ErrorPanel } from "../components";
import { todayInVietnam } from "../lib/dates";
import { formatDate } from "../lib/labels";

export function frontDeskQueries(hotelId: string, bookingId: string) {
  return [
    partnerKeys.bookingsOf(hotelId),
    partnerKeys.booking(bookingId),
    partnerKeys.availabilityOf(hotelId),
    partnerKeys.roomsOf(hotelId),
    partnerKeys.statsOf(hotelId),
  ];
}

export function CheckInPanel({ booking, hotelId, onDone }: { booking: Booking; hotelId: string; onDone: () => void }) {
  const today = todayInVietnam();
  const checkInOpen = today >= booking.checkIn && today < booking.checkOut;
  const noShowAllowed = today > booking.checkIn;
  const [confirm, setConfirm] = useState<"check-in" | "no-show">();
  const [choosing, setChoosing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState<string>();
  const options = useRoomOptions(booking.id, checkInOpen);

  const checkIn = usePartnerMutation(
    (roomIds: string[] | undefined) => partnerService.checkInBooking(booking.id, roomIds ? { roomIds } : {}),
    {
      invalidate: () => frontDeskQueries(hotelId, booking.id),
      successMessage: (result) =>
        `Đã nhận phòng booking ${result.code}: phòng ${result.assignedRooms.map((room) => room.roomNumber).join(", ")}.`,
      onSuccess: onDone,
    },
  );
  const noShow = usePartnerMutation(() => partnerService.markNoShow(booking.id), {
    invalidate: () => frontDeskQueries(hotelId, booking.id),
    successMessage: (result) => `Đã đánh dấu khách không đến cho booking ${result.code}.`,
    onSuccess: onDone,
  });

  if (!checkInOpen && !noShowAllowed) {
    return (
      <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
        Nhận phòng mở từ ngày {formatDate(booking.checkIn)}.
      </p>
    );
  }

  const held = options.data?.held ?? [];
  const all = [...held, ...(options.data?.available ?? [])];

  function startChoosing() {
    setSelected(held.map((room) => room.id));
    setSelectionError(undefined);
    setChoosing(true);
  }

  function toggle(room: RoomOption) {
    setSelected((current) =>
      current.includes(room.id) ? current.filter((id) => id !== room.id) : [...current, room.id],
    );
  }

  function requestCheckIn() {
    if (choosing) {
      const wrong = booking.items.find(
        (item) => all.filter((room) => room.roomTypeId === item.roomType.id && selected.includes(room.id)).length !== item.rooms,
      );
      if (wrong) {
        setSelectionError(`Chọn đúng ${wrong.rooms} phòng ${wrong.roomType.name}.`);
        return;
      }
    }
    setSelectionError(undefined);
    setConfirm("check-in");
  }

  const pending = checkIn.isPending || noShow.isPending;

  return (
    <div className="space-y-3 rounded-xl bg-info-soft p-4 text-sm">
      <p className="font-semibold text-info">
        {checkInOpen ? "Khách có thể nhận phòng" : "Đã qua ngày nhận phòng"}
      </p>

      {checkInOpen &&
        (options.isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : options.error ? (
          <ErrorPanel error={options.error} onRetry={() => void options.refetch()} />
        ) : choosing ? (
          <div className="space-y-3">
            {booking.items.map((item) => (
              <fieldset key={item.roomType.id} className="space-y-1.5">
                <legend className="text-xs font-semibold text-foreground">
                  {item.roomType.name}: chọn {item.rooms} phòng
                </legend>
                <div className="flex flex-wrap gap-2">
                  {all
                    .filter((room) => room.roomTypeId === item.roomType.id)
                    .map((room) => (
                      <label
                        key={room.id}
                        className="flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs"
                      >
                        <Checkbox checked={selected.includes(room.id)} onCheckedChange={() => toggle(room)} />
                        {room.roomNumber}
                        {held.some((h) => h.id === room.id) && <span className="text-muted-foreground">(đang giữ)</span>}
                      </label>
                    ))}
                </div>
              </fieldset>
            ))}
            {selectionError && (
              <p role="alert" className="text-xs text-danger">
                {selectionError}
              </p>
            )}
          </div>
        ) : (
          <p className="text-foreground">
            Phòng đang giữ: <strong>{held.map((room) => room.roomNumber).join(", ") || "—"}</strong>
            {options.data && options.data.available.length > 0 && (
              <button type="button" onClick={startChoosing} className="ml-2 text-xs font-semibold text-primary underline">
                Đổi phòng khác
              </button>
            )}
          </p>
        ))}

      <div className="flex flex-wrap gap-2">
        {checkInOpen && (
          <Button onClick={requestCheckIn} disabled={!options.data || pending}>
            <DoorOpen />
            Nhận phòng
          </Button>
        )}
        {noShowAllowed && (
          <Button variant="outline" onClick={() => setConfirm("no-show")} disabled={pending}>
            <UserX />
            Khách không đến
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirm === "check-in"}
        onOpenChange={(open) => !open && setConfirm(undefined)}
        title={`Nhận phòng booking ${booking.code}?`}
        description="Booking chuyển sang Đang lưu trú và các phòng chuyển sang Đang có khách."
        confirmLabel="Nhận phòng"
        pending={checkIn.isPending}
        onConfirm={() => checkIn.mutate(choosing ? selected : undefined)}
      />
      <ConfirmDialog
        open={confirm === "no-show"}
        onOpenChange={(open) => !open && setConfirm(undefined)}
        title={`Đánh dấu khách không đến cho ${booking.code}?`}
        description="Các đêm từ hôm nay được mở bán lại, khách sạn giữ tiền đã thanh toán. Không thể hoàn tác."
        confirmLabel="Khách không đến"
        destructive
        pending={noShow.isPending}
        onConfirm={() => noShow.mutate()}
      />
    </div>
  );
}
