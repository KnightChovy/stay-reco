"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BedDouble, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import type { AvailabilityDay } from "@stayreco/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { useActionItem, useAvailability, useRoomTypes } from "../api/partner-queries";
import {
  DateInput,
  EmptyPanel,
  ErrorPanel,
  FormField,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  SuspendedBanner,
  usePartnerHotel,
} from "../components";
import { addDays, dateRange, todayInVietnam, weekdayOf } from "../lib/dates";
import { AvailabilityDialog, type AvailabilityDraft } from "./AvailabilityDialog";

const SPANS = [14, 30, 62] as const;
const weekdayShort = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function PartnerAvailability() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended } = usePartnerHotel();

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Lịch tồn & khả dụng"
        description="Số phòng còn mở bán theo từng loại phòng và từng ngày. Booking, huỷ phòng và giữ chỗ tự cập nhật lịch; bạn chỉ cần đóng hoặc mở bán phòng trống."
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <AvailabilityWorkspace key={hotel.id} hotelId={hotel.id} />
      )}
    </div>
  );
}

function cellTone(day: AvailabilityDay) {
  if (day.totalRooms === 0 || day.onSale === 0) return "bg-danger-soft text-danger";
  if (day.onSale / day.totalRooms <= 0.2) return "bg-warning-soft text-warning";
  return "bg-success-soft text-success";
}

const isCalendarDate = (value: string | null): value is string => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);

function AvailabilityWorkspace({ hotelId }: { hotelId: string }) {
  const { canEdit } = usePartnerHotel();
  // `?from=` comes from the dashboard's "ngày hết phòng do đóng bán" item: open on its first date, over 30 days so
  // every date of the item (all within the next 30) is on screen.
  const searchParams = useSearchParams();
  const linkedFrom = searchParams.get("from");
  const [from, setFrom] = useState(() => (isCalendarDate(linkedFrom) ? linkedFrom : todayInVietnam()));
  const [span, setSpan] = useState<(typeof SPANS)[number]>(isCalendarDate(linkedFrom) ? 30 : 14);
  const soldOut = useActionItem(hotelId, "NO_AVAILABILITY_DATES");
  const soldOutDates = useMemo(() => new Set(soldOut?.params.dates), [soldOut]);
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [draft, setDraft] = useState<AvailabilityDraft>();
  const to = addDays(from, span - 1);
  const dates = useMemo(() => dateRange(from, to), [from, to]);

  const roomTypesQuery = useRoomTypes(hotelId);
  const availabilityQuery = useAvailability(hotelId, from, to);
  const byKey = useMemo(
    () => new Map((availabilityQuery.data ?? []).map((day) => [`${day.roomTypeId}|${day.date}`, day])),
    [availabilityQuery.data],
  );

  if (roomTypesQuery.isLoading) return <LoadingPanel />;
  if (roomTypesQuery.error) return <ErrorPanel error={roomTypesQuery.error} onRetry={() => void roomTypesQuery.refetch()} />;
  const roomTypes = roomTypesQuery.data ?? [];
  if (roomTypes.length === 0) {
    return (
      <EmptyPanel
        icon={BedDouble}
        title="Chưa có loại phòng"
        description="Lịch khả dụng tính theo từng loại phòng. Hãy tạo loại phòng và phòng ở Kho phòng trước."
        action={
          <Link href="/partner/rooms" className={buttonVariants()}>
            <BedDouble />
            Tạo loại phòng
          </Link>
        }
      />
    );
  }
  const visibleTypes = roomTypes.filter((type) => !roomTypeFilter || type.id === roomTypeFilter);

  return (
    <PartnerPanel className="overflow-hidden p-0">
      <div className="flex flex-wrap items-end gap-3 border-b px-5 py-4">
        <FormField label="Từ ngày">
          <DateInput value={from} onChange={(value) => value && setFrom(value)} className="min-w-40" />
        </FormField>
        <FormField label="Hiển thị">
          <NativeSelect value={span} onChange={(event) => setSpan(Number(event.target.value) as (typeof SPANS)[number])}>
            {SPANS.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {value} ngày
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Loại phòng">
          <NativeSelect value={roomTypeFilter} onChange={(event) => setRoomTypeFilter(event.target.value)}>
            <NativeSelectOption value="">Tất cả</NativeSelectOption>
            {roomTypes.map((type) => (
              <NativeSelectOption key={type.id} value={type.id}>
                {type.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" aria-label="Khoảng trước" onClick={() => setFrom(addDays(from, -span))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" onClick={() => setFrom(todayInVietnam())}>
            Hôm nay
          </Button>
          <Button variant="outline" size="icon" aria-label="Khoảng sau" onClick={() => setFrom(addDays(from, span))}>
            <ChevronRight />
          </Button>
        </div>
        {canEdit && (
          <Button
            className="ml-auto"
            onClick={() => setDraft({ roomTypeId: roomTypeFilter || roomTypes[0].id, from, to })}
          >
            <SlidersHorizontal />
            Điều chỉnh mở bán
          </Button>
        )}
      </div>

      {availabilityQuery.error ? (
        <div className="p-5">
          <ErrorPanel error={availabilityQuery.error} onRetry={() => void availabilityQuery.refetch()} />
        </div>
      ) : (
        <div className={cn("overflow-x-auto", availabilityQuery.isFetching && "opacity-70")} aria-busy={availabilityQuery.isFetching}>
          <table className="w-max min-w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-44 border-b bg-card px-4 py-2 text-left font-semibold text-muted-foreground">
                  Loại phòng
                </th>
                {dates.map((date) => {
                  const weekday = weekdayOf(date);
                  const isSoldOut = soldOutDates.has(date);
                  return (
                    <th
                      key={date}
                      title={isSoldOut ? "Hết phòng do đóng bán" : undefined}
                      className={cn(
                        "min-w-14 border-b px-1 py-2 text-center font-semibold",
                        weekday === 0 || weekday === 6 ? "text-brand-accent" : "text-muted-foreground",
                        isSoldOut && "bg-danger-soft",
                      )}
                    >
                      <span className="block">{weekdayShort[weekday]}</span>
                      <span className="block text-foreground">{date.slice(8, 10)}/{date.slice(5, 7)}</span>
                      {isSoldOut && <span className="sr-only">, hết phòng do đóng bán</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleTypes.map((type) => (
                <tr key={type.id}>
                  <th scope="row" className="sticky left-0 z-10 border-b bg-card px-4 py-2 text-left">
                    <strong className="block text-sm text-primary">{type.name}</strong>
                    <span className="font-normal text-muted-foreground">{type.roomCount} phòng</span>
                  </th>
                  {dates.map((date) => {
                    const day = byKey.get(`${type.id}|${date}`);
                    if (!day) {
                      return (
                        <td key={date} className="border-b p-1 text-center text-muted-foreground">
                          {availabilityQuery.isLoading ? "…" : "—"}
                        </td>
                      );
                    }
                    const detail = `${day.onSale} mở bán / ${day.totalRooms} phòng · ${day.booked} đã đặt · ${day.held} giữ chỗ · ${day.closed} đóng`;
                    return (
                      <td key={date} className="border-b p-1">
                        <button
                          type="button"
                          title={detail}
                          aria-label={`${type.name}, ${date}: ${detail}`}
                          disabled={!canEdit}
                          onClick={() => setDraft({ roomTypeId: type.id, from: date, to: date, onSale: day.onSale })}
                          className={cn(
                            "grid h-12 w-full place-items-center rounded-lg font-bold transition-shadow enabled:hover:ring-2 enabled:hover:ring-primary/40 disabled:cursor-default",
                            cellTone(day),
                          )}
                        >
                          <span className="text-sm leading-none">{day.onSale}</span>
                          <span className="text-[10px] font-normal opacity-80">
                            {day.booked + day.held > 0 ? `${day.booked + day.held} đặt` : ""}
                            {day.closed > 0 ? ` · ${day.closed} đóng` : ""}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-4 border-t px-5 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-success-soft ring-1 ring-success/30" /> Còn nhiều phòng
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-warning-soft ring-1 ring-warning/30" /> Còn ≤ 20%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-danger-soft ring-1 ring-danger/30" /> Hết phòng / đóng bán
        </span>
        <span>Số lớn: phòng còn mở bán. Giữ chỗ được giải phóng tối đa 1 phút sau khi hết hạn.</span>
      </div>

      <AvailabilityDialog
        draft={draft}
        onOpenChange={(open) => !open && setDraft(undefined)}
        hotelId={hotelId}
        roomTypes={roomTypes}
      />
    </PartnerPanel>
  );
}
