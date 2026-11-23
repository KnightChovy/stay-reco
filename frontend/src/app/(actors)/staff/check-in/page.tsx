'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, Lock, UserCheck } from 'lucide-react';
import type { RoomOption } from '@stayreco/shared';
import { ActionBar } from '@/components/common/ActionBar';
import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { Button } from '@/components/ui/button';
import { getApiErrorCode } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useStaffHotel } from '@/features/staff/components/StaffHotelProvider';
import { useBookingLookup, useCheckIn, useHotelBookings, useRoomOptions } from '@/features/staff/api/staff-queries';
import {
  bookingStatusLabels,
  formatCalendarDate,
  formatDateTime,
  formatMoney,
  paymentStatusLabels,
  roomStatusLabels,
} from '@/features/staff/lib/labels';
import {
  DeskHeader,
  DeskListShell,
  Field,
  LookupBar,
  StickyActionBar,
  TonePillText,
  daysBetween,
  todayDate,
} from '@/features/staff/front-desk/DeskParts';

function StaffCheckInPageContent({ initialCode }: { initialCode: string }) {
  const { hotel } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const today = todayDate();

  const [input, setInput] = useState(initialCode);
  const [lookupQuery, setLookupQuery] = useState<{ code?: string; qrToken?: string } | null>(
    initialCode ? { code: initialCode } : null,
  );
  const [chosenRooms, setChosenRooms] = useState<string[] | null>(null);

  const lookup = useBookingLookup(hotelId, lookupQuery ?? {}, !!lookupQuery);
  const booking = lookup.data;
  const arrivals = useHotelBookings(hotelId, { status: ['CONFIRMED'], checkInTo: today, pageSize: 50, sort: 'check-in-asc' });

  const canCheckIn = booking?.status === 'CONFIRMED' && booking.paymentStatus === 'PAID';
  const checkIn = useCheckIn();
  const done = booking?.status === 'CHECKED_IN';
  // Once the mutation succeeded the booking is CHECKED_IN; do not refetch room options (they would 409).
  const roomOptions = useRoomOptions(booking?.id, !!canCheckIn && !checkIn.isSuccess);

  // Each booked room type needs exactly as many rooms as it booked (BR-10).
  const quotas = new Map<string, number>((booking?.items ?? []).map((item) => [item.roomType.id, item.rooms]));
  const multiType = quotas.size > 1;
  const typeName = (id: string) => booking?.items.find((item) => item.roomType.id === id)?.roomType.name ?? '';
  const held = roomOptions.data?.held ?? [];
  const available = roomOptions.data?.available ?? [];

  // Prefer held rooms that are physically AVAILABLE (a held room may still be CLEANING), then other free rooms.
  const defaultRooms = [...quotas.entries()].flatMap(([typeId, quota]) =>
    [...held.filter((room) => room.status === 'AVAILABLE'), ...available]
      .filter((room) => room.roomTypeId === typeId)
      .slice(0, quota)
      .map((room) => room.id),
  );
  const selectedRooms = chosenRooms ?? defaultRooms;
  const countOf = (typeId: string) =>
    [...held, ...available].filter((room) => room.roomTypeId === typeId && selectedRooms.includes(room.id)).length;
  const roomsReady = !!booking && [...quotas.entries()].every(([typeId, quota]) => countOf(typeId) === quota);

  const submitLookup = (raw: string = input) => {
    const value = raw.trim();
    if (!value) return;
    setChosenRooms(null);
    checkIn.reset();
    setLookupQuery(value.includes('.') ? { qrToken: value } : { code: value });
  };

  const reset = () => {
    setInput('');
    setLookupQuery(null);
    setChosenRooms(null);
    checkIn.reset();
  };

  const toggleRoom = (room: RoomOption) => {
    if (selectedRooms.includes(room.id)) {
      setChosenRooms(selectedRooms.filter((id) => id !== room.id));
      return;
    }
    const quota = quotas.get(room.roomTypeId) ?? 0;
    if (quota === 1) {
      // One room of this type: tapping another replaces it, one tap instead of two.
      const others = selectedRooms.filter(
        (id) => ![...held, ...available].some((o) => o.id === id && o.roomTypeId === room.roomTypeId),
      );
      setChosenRooms([...others, room.id]);
      return;
    }
    if (countOf(room.roomTypeId) >= quota) return;
    setChosenRooms([...selectedRooms, room.id]);
  };

  const errorCode = checkIn.error ? getApiErrorCode(checkIn.error) : undefined;

  // Arrivals today, late ones first.
  const lateRows = (arrivals.data?.bookings ?? []).filter((row) => row.checkIn < today && row.checkOut > today);
  const todayRows = (arrivals.data?.bookings ?? []).filter((row) => row.checkIn === today);

  return (
    <div className="space-y-5">
      <DeskHeader
        icon={UserCheck}
        title="Nhận phòng"
        description="Quét QR, nhập mã đơn hoặc chọn khách trong danh sách đến hôm nay."
        hotelName={hotel?.summary.name}
      />

      <LookupBar
        value={input}
        onChange={setInput}
        onSubmit={submitLookup}
        loading={lookup.isFetching}
        placeholder="Mã đơn (SR-261031-1234) hoặc token QR"
      />

      {lookup.error && (
        <ErrorState
          title="Không tìm thấy đơn"
          error={lookup.error}
          fallback="Mã đơn hoặc token QR không hợp lệ."
          onRetry={() => void lookup.refetch()}
          action={
            <Button variant="ghost" className="h-10" onClick={reset}>
              Chọn từ danh sách
            </Button>
          }
        />
      )}

      {!lookupQuery && (
        <DeskListShell
          title="Khách đến hôm nay"
          loading={arrivals.isLoading || !hotelId}
          error={arrivals.error}
          onRetry={() => void arrivals.refetch()}
          empty={{ title: 'Chưa có khách nào chờ nhận phòng', description: 'Đơn đã xác nhận có ngày nhận phòng hôm nay sẽ hiện ở đây.' }}
          groups={[
            { title: 'Đến muộn (từ ngày trước)', rows: lateRows, tone: 'warning' },
            { title: 'Đến hôm nay', rows: todayRows, tone: 'info' },
          ]}
          renderPill={(row, group) =>
            row.paymentStatus !== 'PAID' ? (
              <TonePillText tone={paymentStatusLabels[row.paymentStatus].tone}>
                {paymentStatusLabels[row.paymentStatus].label}
              </TonePillText>
            ) : (
              <TonePillText tone={group.tone}>
                {row.checkIn < today ? `Trễ ${daysBetween(row.checkIn, today)} ngày` : 'Đã thanh toán'}
              </TonePillText>
            )
          }
          onPick={(row) => {
            setInput(row.code);
            submitLookup(row.code);
          }}
        />
      )}

      {booking && (
        <div className="mx-auto max-w-3xl space-y-4">
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5" aria-label="Thông tin đơn">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Khách nhận phòng</span>
                <p className="truncate text-xl font-bold text-foreground">{booking.guestName}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono">{booking.code}</span> · {booking.contactPhone}
                </p>
              </div>
              {booking.status === 'CONFIRMED' ? (
                <TonePillText tone={paymentStatusLabels[booking.paymentStatus].tone}>
                  {bookingStatusLabels[booking.status].label} · {paymentStatusLabels[booking.paymentStatus].label}
                </TonePillText>
              ) : (
                <TonePillText tone={bookingStatusLabels[booking.status].tone}>
                  {bookingStatusLabels[booking.status].label}
                </TonePillText>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Phòng" hint={`${booking.guests} khách`}>
                {booking.items.map((item) => `${item.rooms} × ${item.roomType.name}`).join(', ')}
              </Field>
              <Field label="Lưu trú" hint={`${booking.nights} đêm`}>
                {formatCalendarDate(booking.checkIn)} → {formatCalendarDate(booking.checkOut)}
              </Field>
              <Field label="Thanh toán" hint={booking.paidAt ? `Lúc ${formatDateTime(booking.paidAt)}` : undefined}>
                {formatMoney(booking.totalAmount)}
              </Field>
            </div>
            {(booking.arrivalTime || booking.specialRequests) && (
              <div className="mt-4 space-y-1 rounded-lg bg-muted p-3 text-sm text-foreground">
                {booking.arrivalTime && <p>Giờ đến dự kiến: <strong>{booking.arrivalTime}</strong></p>}
                {booking.specialRequests && <p>Yêu cầu: {booking.specialRequests}</p>}
              </div>
            )}
          </section>

          {done ? (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5" role="status">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-700" aria-hidden />
                <div>
                  <h2 className="text-base font-bold text-emerald-900">Đã nhận phòng</h2>
                  <p className="mt-1 text-sm text-emerald-900">
                    Phòng đã gán:{' '}
                    <strong>
                      {booking.assignedRooms.length > 0 ? booking.assignedRooms.map((room) => room.roomNumber).join(', ') : '—'}
                    </strong>
                    . Đưa chìa khoá cho khách, rồi bấm “Khách tiếp theo”.
                  </p>
                </div>
              </div>
            </section>
          ) : canCheckIn ? (
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5" aria-label="Gán phòng">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-foreground">Gán phòng</h2>
                <span className="text-sm text-muted-foreground">
                  Đã chọn <strong className="text-foreground">{selectedRooms.length}</strong>/{booking.rooms}
                </span>
              </div>
              {roomOptions.isLoading ? (
                <LoadingState rows={2} className="mt-3" label="Đang tải phòng trống…" />
              ) : roomOptions.error ? (
                <ErrorState
                  className="mt-3"
                  title="Không tải được danh sách phòng"
                  error={roomOptions.error}
                  onRetry={() => void roomOptions.refetch()}
                />
              ) : (
                <div className="mt-3 space-y-4">
                  {[...quotas.entries()].map(([typeId, quota]) => {
                    const options = [...held, ...available].filter((room) => room.roomTypeId === typeId);
                    return (
                      <div key={typeId}>
                        {multiType && (
                          <p className="mb-2 text-xs font-semibold text-muted-foreground">
                            {typeName(typeId)}: chọn {quota} phòng
                          </p>
                        )}
                        {options.length === 0 ? (
                          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                            Không còn phòng nào gán được cho hạng này.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                            {options.map((room) => {
                              const isHeld = held.some((h) => h.id === room.id);
                              const blocked = room.status !== 'AVAILABLE';
                              return (
                                <RoomChoice
                                  key={room.id}
                                  room={room}
                                  held={isHeld}
                                  selected={selectedRooms.includes(room.id)}
                                  disabled={blocked}
                                  onClick={() => toggleRoom(room)}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {held.some((room) => room.status !== 'AVAILABLE') && (
                    <p className="text-xs text-muted-foreground">
                      Phòng đang giữ cho đơn nhưng chưa sẵn sàng (đang dọn hoặc có khách) không chọn được; hãy chọn phòng
                      trống khác cùng hạng.
                    </p>
                  )}
                </div>
              )}
            </section>
          ) : (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="status">
              {booking.status === 'CONFIRMED'
                ? 'Đơn chưa thanh toán nên chưa thể nhận phòng.'
                : `Đơn đang ở trạng thái “${bookingStatusLabels[booking.status].label}”, không thể nhận phòng.`}
            </p>
          )}

          {checkIn.error && (
            <ErrorState
              title="Nhận phòng thất bại"
              error={checkIn.error}
              fallback="Không thể nhận phòng. Vui lòng thử lại."
              className="py-5"
            />
          )}
          {errorCode === 'CHECK_IN_NOT_OPEN' && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="status">
              Chưa đến ngày nhận phòng: chỉ nhận phòng được từ {formatCalendarDate(booking.checkIn)}.
            </p>
          )}
          {errorCode === 'ROOM_NOT_ASSIGNABLE' && (
            <p className="text-sm text-muted-foreground">Hãy chọn lại phòng rồi bấm “Nhận phòng”.</p>
          )}

          <StickyActionBar
            info={
              done
                ? 'Đã xong'
                : canCheckIn
                  ? roomsReady
                    ? 'Sẵn sàng nhận phòng'
                    : `Chọn đủ ${booking.rooms} phòng`
                  : undefined
            }
          >
            <ActionBar
              primary={
                done ? (
                  <Button onClick={reset} className="h-11 px-6">
                    Khách tiếp theo
                  </Button>
                ) : canCheckIn ? (
                  <Button
                    className="h-11 gap-2 px-6"
                    disabled={!roomsReady || checkIn.isPending}
                    onClick={() => checkIn.mutate({ bookingId: booking.id, roomIds: selectedRooms })}
                  >
                    {checkIn.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
                    Nhận phòng
                  </Button>
                ) : (
                  <Button variant="outline" onClick={reset} className="h-11 px-6">
                    Tìm đơn khác
                  </Button>
                )
              }
              menu={[
                { label: 'Xem chi tiết đơn', href: `/staff/bookings/${booking.id}` },
                ...(done || !canCheckIn ? [] : [{ label: 'Tìm đơn khác', description: 'Bỏ đơn này, chưa nhận phòng.', onSelect: reset }]),
              ]}
            />
          </StickyActionBar>
        </div>
      )}
    </div>
  );
}

function RoomChoice({
  room,
  held,
  selected,
  disabled,
  onClick,
}: {
  room: RoomOption;
  held: boolean;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const label = roomStatusLabels[room.status].label;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'flex min-h-14 items-center justify-between gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring',
        selected
          ? 'border-primary bg-primary/5'
          : disabled
            ? 'cursor-not-allowed border-border bg-muted opacity-70'
            : 'border-border bg-card hover:bg-muted',
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold text-foreground">Phòng {room.roomNumber}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {held ? 'Đang giữ cho đơn · ' : ''}
          {label}
        </span>
      </span>
      {disabled ? (
        <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full border',
            selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent',
          )}
          aria-hidden
        >
          <CheckCircle2 className="size-4" />
        </span>
      )}
    </button>
  );
}

/** `?code=SR-…` (from the booking list and detail) opens the booking straight away; a new code remounts the form. */
function CodeParamPage() {
  const code = useSearchParams().get('code')?.trim() ?? '';
  return <StaffCheckInPageContent key={code} initialCode={code} />;
}

export default function StaffCheckInPage() {
  return (
    <Suspense fallback={null}>
      <CodeParamPage />
    </Suspense>
  );
}
