'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BedDouble,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DoorOpen,
  KeyRound,
  Loader2,
  QrCode,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useStaffHotel } from '@/features/staff/components/StaffHotelProvider';
import {
  useBookingLookup,
  useCheckIn,
  useRoomOptions,
} from '@/features/staff/api/staff-queries';
import {
  bookingStatusLabels,
  formatCalendarDate,
  formatDateTime,
  formatMoney,
  paymentStatusLabels,
  toneClasses,
} from '@/features/staff/lib/labels';

export default function StaffCheckInPage() {
  const { hotel } = useStaffHotel();
  const hotelId = hotel?.summary.id;

  const [input, setInput] = useState('');
  const [lookupQuery, setLookupQuery] = useState<{ code?: string; qrToken?: string } | null>(null);
  const [chosenRooms, setChosenRooms] = useState<string[] | null>(null);

  const lookup = useBookingLookup(hotelId, lookupQuery ?? {}, !!lookupQuery);
  const booking = lookup.data;

  const canCheckIn =
    booking?.status === 'CONFIRMED' && booking.paymentStatus === 'PAID';
  const checkIn = useCheckIn();
  // Once the mutation succeeded the booking is CHECKED_IN; do not refetch room options (they would 409).
  const roomOptions = useRoomOptions(booking?.id, !!canCheckIn && !checkIn.isSuccess);

  // Prefer held rooms but only those that are physically AVAILABLE; a held room can be CLEANING after an earlier
  // checkout. Fill the rest from the other free rooms of the same type.
  const defaultSelectedRooms = booking
    ? [
        ...(roomOptions.data?.held.filter((room) => room.status === 'AVAILABLE').map((room) => room.id) ?? []),
        ...(roomOptions.data?.available.map((room) => room.id) ?? []),
      ].slice(0, booking.rooms)
    : [];
  const selectedRooms = chosenRooms ?? defaultSelectedRooms;
  const roomsReady = !!booking && selectedRooms.length === booking.rooms;

  const submitLookup = () => {
    const value = input.trim();
    if (!value) return;
    setChosenRooms(null);
    checkIn.reset();
    setLookupQuery(value.includes('.') ? { qrToken: value } : { code: value });
  };

  const toggleRoom = (roomId: string) => {
    if (!booking) return;
    if (selectedRooms.includes(roomId)) {
      setChosenRooms(selectedRooms.filter((id) => id !== roomId));
      return;
    }
    if (selectedRooms.length >= booking.rooms) return;
    setChosenRooms([...selectedRooms, roomId]);
  };

  const doCheckIn = () => {
    if (!booking || !roomsReady) return;
    checkIn.mutate({ bookingId: booking.id, roomIds: selectedRooms });
  };

  const errorCode = checkIn.error ? getApiErrorCode(checkIn.error) : lookup.error ? getApiErrorCode(lookup.error) : undefined;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
            <Link href="/staff/dashboard" className="hover:text-[#934a33]">
              Bàn làm việc
            </Link>
            <ChevronRight className="size-3" />
            <Link href="/staff/bookings" className="hover:text-[#934a33]">
              Đặt phòng
            </Link>
            <ChevronRight className="size-3" />
            <span className="font-medium text-slate-800">Check-in</span>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <UserCheck className="size-7 text-[#934a33]" /> Check-in &amp; gán phòng
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Tìm đơn bằng mã booking hoặc token QR trên voucher, rồi gán phòng cho khách.
          </p>
        </div>
        <Badge className="w-fit border-none bg-[#EAF0F5] px-3 py-1 text-xs font-semibold text-[#013758]">
          {hotel?.summary.name ?? 'Khách sạn của bạn'}
        </Badge>
      </div>

      <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitLookup();
              }}
              placeholder="Nhập mã đơn (SR-261031-1234) hoặc dán token QR voucher…"
              className="h-11 pl-10 text-sm"
            />
          </div>
          <Button
            onClick={submitLookup}
            disabled={!input.trim() || lookup.isLoading}
            className="h-11 gap-1.5 bg-[#934a33] px-5 text-sm font-semibold text-white hover:bg-[#7b3e2b]"
          >
            {lookup.isLoading ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
            Tìm đơn
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Có thể nhập mã không dấu gạch, ví dụ <span className="font-mono">SR2610311234</span>. Token QR lấy từ
          voucher điện tử của khách.
        </p>
      </Card>

      {lookup.error && (
        <Alert variant="destructive" className="bg-red-50 p-4">
          <AlertTitle>Không tìm thấy đơn</AlertTitle>
          <AlertDescription className="mt-1 text-xs">
            {getApiErrorMessage(lookup.error, 'Mã đơn hoặc token QR không hợp lệ.')}
          </AlertDescription>
        </Alert>
      )}

      {!lookupQuery && (
        <Card className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-none">
          <KeyRound className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Nhập mã đơn để bắt đầu check-in</p>
          <p className="mt-1 text-xs text-slate-500">
            Hệ thống chỉ cho check-in từ ngày nhận phòng đến trước ngày trả phòng.
          </p>
        </Card>
      )}

      {booking && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Đơn đặt phòng</span>
                  <p className="font-mono text-lg font-bold text-[#013758]">{booking.code}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`border text-[11px] font-semibold ${toneClasses[bookingStatusLabels[booking.status].tone]}`}>
                    {bookingStatusLabels[booking.status].label}
                  </Badge>
                  <Badge className={`border text-[11px] font-semibold ${toneClasses[paymentStatusLabels[booking.paymentStatus].tone]}`}>
                    {paymentStatusLabels[booking.paymentStatus].label}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Khách nhận phòng</span>
                  <p className="font-bold text-slate-800">{booking.guestName}</p>
                  <p className="text-xs text-slate-500">{booking.contactPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Hạng phòng</span>
                  <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <BedDouble className="size-4 text-[#934a33]" /> {booking.roomType.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {booking.rooms} phòng · {booking.guests} khách
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Lưu trú</span>
                  <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Calendar className="size-4 text-[#934a33]" /> {formatCalendarDate(booking.checkIn)} →{' '}
                    {formatCalendarDate(booking.checkOut)}
                  </p>
                  <p className="text-xs text-slate-500">{booking.nights} đêm</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Thanh toán</span>
                  <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <CreditCard className="size-4 text-[#934a33]" /> {formatMoney(booking.totalAmount)}
                  </p>
                  {booking.paidAt && (
                    <p className="text-xs text-slate-500">Lúc {formatDateTime(booking.paidAt)}</p>
                  )}
                </div>
              </div>

              {(booking.arrivalTime || booking.specialRequests) && (
                <div className="mt-4 space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  {booking.arrivalTime && <p>Giờ đến dự kiến: <strong>{booking.arrivalTime}</strong></p>}
                  {booking.specialRequests && <p>Yêu cầu: {booking.specialRequests}</p>}
                </div>
              )}
            </Card>

            {booking.status === 'CHECKED_IN' ? (
              <Card className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-none">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" />
                  <div>
                    <h2 className="text-base font-bold text-emerald-900">Khách đã check-in</h2>
                    <p className="mt-1 text-xs text-emerald-800">
                      Phòng đã gán:{' '}
                      <strong>
                        {booking.assignedRooms.length > 0
                          ? booking.assignedRooms.map((room) => room.roomNumber).join(', ')
                          : '—'}
                      </strong>
                    </p>
                    <Link href={`/staff/bookings/${booking.id}`} className="mt-3 inline-block">
                      <Button variant="outline" className="h-9 border-emerald-300 text-xs font-semibold text-emerald-800">
                        Xem chi tiết đơn
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ) : canCheckIn ? (
              <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <DoorOpen className="size-4 text-[#934a33]" /> Gán phòng
                  </h2>
                  <span className="text-xs text-slate-500">
                    Đã chọn <strong>{selectedRooms.length}</strong>/{booking.rooms} phòng
                  </span>
                </div>

                {roomOptions.isLoading ? (
                  <div className="flex items-center gap-2 py-8 text-xs text-slate-500">
                    <Loader2 className="size-4 animate-spin" /> Đang tải phòng trống…
                  </div>
                ) : roomOptions.error ? (
                  <Alert variant="destructive" className="mt-3 bg-red-50 p-3">
                    <AlertDescription className="text-xs">
                      {getApiErrorMessage(roomOptions.error, 'Không tải được danh sách phòng.')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="mt-3 space-y-4">
                    {roomOptions.data?.held.some((room) => room.status !== 'AVAILABLE') && (
                      <p className="rounded-lg bg-amber-50 p-3 text-[11px] text-amber-800">
                        Một số phòng đang giữ cho đơn chưa sẵn sàng (đang dọn/có khách). Hãy chọn phòng trống khác
                        cùng hạng bên dưới.
                      </p>
                    )}
                    {roomOptions.data?.held.length ? (
                      <div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Phòng đang giữ cho đơn
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {roomOptions.data.held.map((room) => (
                            <RoomChoice
                              key={room.id}
                              room={room}
                              selected={selectedRooms.includes(room.id)}
                              disabled={room.status !== 'AVAILABLE'}
                              onClick={() => toggleRoom(room.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {roomOptions.data?.available.length ? (
                      <div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Phòng khác cùng hạng còn trống
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {roomOptions.data.available.map((room) => {
                            const selected = selectedRooms.includes(room.id);
                            const full = selectedRooms.length >= booking.rooms && !selected;
                            return (
                              <RoomChoice
                                key={room.id}
                                room={room}
                                selected={selected}
                                disabled={full}
                                onClick={() => toggleRoom(room.id)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {!roomOptions.data?.held.length && !roomOptions.data?.available.length && (
                      <p className="py-6 text-center text-xs text-slate-500">
                        Không còn phòng nào có thể gán cho đơn này.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:col-span-5">
            <Card className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-5 shadow-md">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <ShieldCheck className="size-4 text-emerald-600" /> Điều kiện check-in
              </h2>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className={`mt-0.5 size-3.5 shrink-0 ${booking.status === 'CONFIRMED' ? 'text-emerald-600' : 'text-slate-300'}`} />
                  Đơn ở trạng thái <strong>Đã xác nhận</strong>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className={`mt-0.5 size-3.5 shrink-0 ${booking.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-slate-300'}`} />
                  Hóa đơn đã thanh toán
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  Trong thời gian nhận phòng: {formatCalendarDate(booking.checkIn)} → trước{' '}
                  {formatCalendarDate(booking.checkOut)}
                </li>
              </ul>

              {!canCheckIn && booking.status === 'CONFIRMED' && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  {booking.paymentStatus !== 'PAID'
                    ? 'Đơn chưa thanh toán nên chưa thể check-in.'
                    : 'Đơn chưa đủ điều kiện check-in tại thời điểm này.'}
                </p>
              )}

              {booking.status !== 'CONFIRMED' && booking.status !== 'CHECKED_IN' && (
                <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  Đơn đang ở trạng thái <strong>{bookingStatusLabels[booking.status].label}</strong>, không thể
                  check-in.
                </p>
              )}

              {checkIn.error && (
                <Alert variant="destructive" className="bg-red-50 p-3">
                  <AlertTitle className="text-xs">Check-in thất bại</AlertTitle>
                  <AlertDescription className="mt-1 text-xs">
                    {getApiErrorMessage(checkIn.error, 'Không thể check-in. Vui lòng thử lại.')}
                    {errorCode === 'ROOM_NOT_ASSIGNABLE' && ' Chọn lại phòng bên trái.'}
                  </AlertDescription>
                </Alert>
              )}

              {canCheckIn && (
                <Button
                  onClick={doCheckIn}
                  disabled={!roomsReady || checkIn.isPending}
                  className="h-11 w-full gap-2 bg-[#934a33] text-sm font-bold text-white hover:bg-[#7b3e2b]"
                >
                  {checkIn.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserCheck className="size-4" />
                  )}
                  Hoàn tất check-in
                </Button>
              )}

              {canCheckIn && !roomsReady && (
                <p className="text-center text-[11px] text-amber-700">
                  Chọn đủ {booking.rooms} phòng để check-in.
                </p>
              )}

              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500">
                <Users className="size-3.5 shrink-0" />
                Gán đúng {booking.rooms} phòng cùng hạng. Có thể đổi phòng đang giữ sang phòng trống khác.
              </div>

              <Link href="/staff/bookings" className="block">
                <Button variant="outline" className="h-9 w-full text-xs font-semibold">
                  Về danh sách đặt phòng
                </Button>
              </Link>
            </Card>

            {errorCode === 'CHECK_IN_NOT_OPEN' && (
              <Card className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 shadow-none">
                <p className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="size-4" /> Chưa đến giờ check-in
                </p>
                <p className="mt-1">
                  Chỉ check-in được từ {formatCalendarDate(booking.checkIn)}. Nếu khách đến sớm, hãy đợi đến ngày
                  nhận phòng.
                </p>
              </Card>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function RoomChoice({
  room,
  selected,
  disabled,
  onClick,
}: {
  room: { id: string; roomNumber: string; status: string };
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between rounded-lg border p-3 text-left text-xs transition-colors ${
        selected
          ? 'border-[#934a33] bg-[#F5EBE5]'
          : disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
            : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <span>
        <span className="block font-bold text-slate-800">Phòng {room.roomNumber}</span>
        <span className="text-[11px] text-slate-500">
          {room.status === 'AVAILABLE' ? 'Sẵn sàng' : room.status === 'CLEANING' ? 'Đang dọn' : room.status}
        </span>
      </span>
      <span
        className={`flex size-5 items-center justify-center rounded-full border ${
          selected ? 'border-[#934a33] bg-[#934a33] text-white' : 'border-slate-300 text-transparent'
        }`}
      >
        <CheckCircle2 className="size-3.5" />
      </span>
    </button>
  );
}
