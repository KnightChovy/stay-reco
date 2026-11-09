'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BedDouble,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Loader2,
  LogOut,
  QrCode,
  Search,
  Sparkles,
  Wallet,
  ScanLine,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api-error';
import { QrScannerDialog } from '@/features/staff/components/QrScannerDialog';
import { useStaffHotel } from '@/features/staff/components/StaffHotelProvider';
import {
  useBookingLookup,
  useCheckOut,
  useCheckOutQuote,
  useCleanRoom,
} from '@/features/staff/api/staff-queries';
import {
  bookingStatusLabels,
  formatCalendarDate,
  formatDateTime,
  formatMoney,
  paymentStatusLabels,
  toneClasses,
} from '@/features/staff/lib/labels';

export default function StaffCheckOutPage() {
  const { hotel } = useStaffHotel();
  const hotelId = hotel?.summary.id;

  const [input, setInput] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState<{ code?: string; qrToken?: string } | null>(null);
  const [lateFeeAmount, setLateFeeAmount] = useState('');
  const [lateFeeReason, setLateFeeReason] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [cleanedRooms, setCleanedRooms] = useState<string[]>([]);

  const lookup = useBookingLookup(hotelId, lookupQuery ?? {}, !!lookupQuery);
  const booking = lookup.data;
  const canCheckOut = booking?.status === 'CHECKED_IN';
  const checkOut = useCheckOut();
  // After a successful check-out the quote endpoint only accepts CHECKED_IN; stop refetching it (409).
  const quote = useCheckOutQuote(booking?.id, !!canCheckOut && !checkOut.isSuccess);
  const cleanRoom = useCleanRoom();

  const computedFee = quote.data?.lateFee?.amount ?? 0;
  const enteredFee = Number(lateFeeAmount);
  const hasAdjustment = lateFeeAmount.trim() !== '' || lateFeeReason.trim() !== '';
  const adjustmentValid =
    !hasAdjustment ||
    (lateFeeAmount.trim() !== '' &&
      lateFeeReason.trim() !== '' &&
      Number.isFinite(enteredFee) &&
      enteredFee >= 0 &&
      enteredFee <= computedFee);

  const submitLookup = (raw: string = input) => {
    const value = raw.trim();
    if (!value) return;
    setLookupQuery(value.includes('.') ? { qrToken: value } : { code: value });
    setLateFeeAmount('');
    setLateFeeReason('');
    setLocalError(null);
    setCleanedRooms([]);
    checkOut.reset();
  };

  const doCheckOut = () => {
    if (!booking || !canCheckOut) return;
    setLocalError(null);

    if (hasAdjustment && !adjustmentValid) {
      setLocalError(
        computedFee > 0
          ? `Phí trả muộn đã nhập không hợp lệ: phải từ 0 đến ${formatMoney(computedFee)} và có lý do.`
          : 'Đơn này không có phí trả muộn để điều chỉnh.',
      );
      return;
    }

    checkOut.mutate({
      bookingId: booking.id,
      lateFee: hasAdjustment
        ? { amount: Math.round(enteredFee), reason: lateFeeReason.trim() }
        : undefined,
    });
  };

  const fieldErrors = checkOut.error ? getApiFieldErrors(checkOut.error) : {};

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
            <span className="font-medium text-slate-800">Check-out</span>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <LogOut className="size-7 text-[#934a33]" /> Check-out &amp; quyết toán
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Tìm đơn đang lưu trú, xem phí trả muộn (nếu có) rồi xác nhận trả phòng.
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
              placeholder="Nhập mã đơn đang lưu trú (SR-261031-1234) hoặc quét QR voucher…"
              className="h-11 pl-10 text-sm"
            />
          </div>
          <Button
            onClick={() => submitLookup()}
            disabled={!input.trim() || lookup.isLoading}
            className="h-11 gap-1.5 bg-[#934a33] px-5 text-sm font-semibold text-white hover:bg-[#7b3e2b]"
          >
            {lookup.isLoading ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
            Tìm đơn
          </Button>
          <Button
            variant="outline"
            onClick={() => setScannerOpen(true)}
            className="h-11 gap-1.5 border-[#934a33]/40 px-5 text-sm font-semibold text-[#934a33] hover:bg-[#934a33]/5"
          >
            <ScanLine className="size-4" /> Quét QR
          </Button>
        </div>
        <QrScannerDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onResult={(token) => {
            setInput(token);
            submitLookup(token);
          }}
        />
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
          <LogOut className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Nhập mã đơn để bắt đầu check-out</p>
          <p className="mt-1 text-xs text-slate-500">Chỉ đơn đang ở trạng thái “Đang lưu trú” mới check-out được.</p>
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
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Khách lưu trú</span>
                  <p className="font-bold text-slate-800">{booking.guestName}</p>
                  <p className="text-xs text-slate-500">{booking.contactPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Phòng</span>
                  <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <BedDouble className="size-4 text-[#934a33]" /> {booking.roomType.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {booking.assignedRooms.length > 0
                      ? `Phòng ${booking.assignedRooms.map((room) => room.roomNumber).join(', ')}`
                      : `${booking.rooms} phòng`}
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
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Đã thanh toán</span>
                  <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <CreditCard className="size-4 text-[#934a33]" /> {formatMoney(booking.totalAmount)}
                  </p>
                  {booking.paidAt && <p className="text-xs text-slate-500">Lúc {formatDateTime(booking.paidAt)}</p>}
                </div>
              </div>
            </Card>

            {booking.status === 'COMPLETED' ? (
              <Card className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-none">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" />
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-emerald-900">Đã check-out</h2>
                    <p className="mt-1 text-xs text-emerald-800">
                      Đơn đã hoàn tất. Phòng đang ở trạng thái <strong>Đang dọn</strong>.
                    </p>

                    {booking.lateCheckout && (
                      <div className="mt-3 rounded-lg bg-white/70 p-3 text-xs text-emerald-900">
                        <p className="font-semibold">
                          Trả muộn {booking.lateCheckout.minutesLate} phút · phí {formatMoney(booking.lateCheckout.fee)}
                        </p>
                        {booking.lateCheckout.computedFee !== booking.lateCheckout.fee && (
                          <p className="text-[11px]">
                            Phí gốc {formatMoney(booking.lateCheckout.computedFee)}
                            {booking.lateCheckout.reason ? ` · lý do giảm: ${booking.lateCheckout.reason}` : ''}
                          </p>
                        )}
                      </div>
                    )}

                    {booking.assignedRooms.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                          Đánh dấu phòng đã dọn
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {booking.assignedRooms.map((room) => {
                            const cleaned = cleanedRooms.includes(room.id);
                            return (
                              <Button
                                key={room.id}
                                size="sm"
                                variant="outline"
                                disabled={cleaned || cleanRoom.isPending}
                                onClick={() =>
                                  cleanRoom.mutate(room.id, {
                                    onSuccess: () => setCleanedRooms((ids) => [...ids, room.id]),
                                  })
                                }
                                className="h-8 gap-1.5 border-emerald-300 bg-white text-xs font-semibold text-emerald-800"
                              >
                                <Sparkles className="size-3.5" />
                                Phòng {room.roomNumber} {cleaned ? 'đã dọn' : 'đã dọn xong?'}
                              </Button>
                            );
                          })}
                        </div>
                        {cleanRoom.error && (
                          <p className="text-[11px] text-red-600">
                            {getApiErrorMessage(cleanRoom.error, 'Không cập nhật được trạng thái phòng.')}
                          </p>
                        )}
                      </div>
                    )}

                    <Link href={`/staff/bookings/${booking.id}`} className="mt-4 inline-block">
                      <Button variant="outline" className="h-9 border-emerald-300 text-xs font-semibold text-emerald-800">
                        Xem chi tiết đơn
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ) : canCheckOut ? (
              <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <h2 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-bold text-slate-800">
                  <Wallet className="size-4 text-[#934a33]" /> Quyết toán khi trả phòng
                </h2>

                {quote.isLoading ? (
                  <div className="flex items-center gap-2 py-8 text-xs text-slate-500">
                    <Loader2 className="size-4 animate-spin" /> Đang tính phí check-out…
                  </div>
                ) : quote.error ? (
                  <Alert variant="destructive" className="mt-3 bg-red-50 p-3">
                    <AlertDescription className="text-xs">
                      {getApiErrorMessage(quote.error, 'Không tải được thông tin check-out.')}
                    </AlertDescription>
                  </Alert>
                ) : quote.data ? (
                  <div className="mt-3 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                      <div>
                        <span className="block text-[10px] font-semibold uppercase text-slate-400">Giờ trả phòng</span>
                        <span className="font-semibold text-slate-800">{formatDateTime(quote.data.scheduledAt)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold uppercase text-slate-400">Đã thanh toán</span>
                        <span className="font-semibold text-slate-800">{formatMoney(quote.data.amountPaid)}</span>
                      </div>
                      {quote.data.minutesLate > 0 && (
                        <div>
                          <span className="block text-[10px] font-semibold uppercase text-slate-400">Trả muộn</span>
                          <span className="font-semibold text-amber-700">{quote.data.minutesLate} phút</span>
                        </div>
                      )}
                      {quote.data.early && (
                        <div>
                          <span className="block text-[10px] font-semibold uppercase text-slate-400">Trả sớm</span>
                          <span className="font-semibold text-amber-700">
                            Giải phóng {quote.data.releasedNights.length} đêm
                          </span>
                        </div>
                      )}
                    </div>

                    {quote.data.lateFee ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                        <p className="font-semibold">
                          Phí trả muộn: {formatMoney(quote.data.lateFee.amount)} ({quote.data.lateFee.percent}% ×{' '}
                          {formatMoney(quote.data.lateFee.nightPrice)})
                        </p>
                        <p className="mt-1 text-[11px]">Thu tại quầy lễ tân, không trừ vào ví StayReco.</p>
                      </div>
                    ) : (
                      <p className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
                        Không có phí trả muộn cho lần check-out này.
                      </p>
                    )}

                    {quote.data.early && (
                      <p className="rounded-lg bg-slate-50 p-3 text-slate-600">
                        Trả phòng trước ngày dự kiến: các đêm còn lại được giải phóng và không hoàn tiền.
                      </p>
                    )}

                    {quote.data.lateFee && (
                      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                        <p className="text-[11px] font-semibold text-slate-600">
                          Giảm phí trả muộn (không bắt buộc, tối đa {formatMoney(computedFee)})
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input
                            type="number"
                            min={0}
                            max={computedFee}
                            value={lateFeeAmount}
                            onChange={(event) => setLateFeeAmount(event.target.value)}
                            placeholder={`0 – ${computedFee}`}
                            className="h-9 text-xs"
                          />
                          <Input
                            value={lateFeeReason}
                            onChange={(event) => setLateFeeReason(event.target.value)}
                            placeholder="Lý do giảm phí…"
                            className="h-9 text-xs"
                          />
                        </div>
                        {hasAdjustment && !adjustmentValid && (
                          <p className="text-[11px] text-red-600">
                            Nhập số tiền từ 0 đến {formatMoney(computedFee)} và lý do.
                          </p>
                        )}
                        {fieldErrors['lateFee.amount'] && (
                          <p className="text-[11px] text-red-600">{fieldErrors['lateFee.amount']}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </Card>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:col-span-5">
            <Card className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-5 shadow-md">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <LogOut className="size-4 text-[#934a33]" /> Xác nhận trả phòng
              </h2>

              {booking.status !== 'CHECKED_IN' && booking.status !== 'COMPLETED' && (
                <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  Đơn đang ở trạng thái <strong>{bookingStatusLabels[booking.status].label}</strong>. Chỉ đơn “Đang
                  lưu trú” mới check-out được.
                </p>
              )}

              {canCheckOut && (
                <>
                  <p className="text-xs text-slate-600">
                    Sau khi xác nhận, đơn chuyển sang <strong>Đã trả phòng</strong>, phòng chuyển sang{' '}
                    <strong>Đang dọn</strong> và hoa hồng được ghi nhận.
                  </p>

                  {(checkOut.error || localError) && (
                    <Alert variant="destructive" className="bg-red-50 p-3">
                      <AlertTitle className="text-xs">Check-out thất bại</AlertTitle>
                      <AlertDescription className="mt-1 text-xs">
                        {localError ??
                          getApiErrorMessage(checkOut.error, 'Không thể check-out. Vui lòng thử lại.')}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={doCheckOut}
                    disabled={checkOut.isPending || quote.isLoading || !!quote.error}
                    className="h-11 w-full gap-2 bg-[#934a33] text-sm font-bold text-white hover:bg-[#7b3e2b]"
                  >
                    {checkOut.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                    Xác nhận check-out
                  </Button>
                </>
              )}

              <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500">
                <Clock className="mt-0.5 size-3.5 shrink-0" />
                Phí trả muộn được tính theo chính sách khách sạn và thu trực tiếp tại quầy.
              </div>

              <Link href="/staff/bookings" className="block">
                <Button variant="outline" className="h-9 w-full text-xs font-semibold">
                  Về danh sách đặt phòng
                </Button>
              </Link>
            </Card>

            {booking.status === 'CHECKED_IN' && !quote.isLoading && !quote.data?.lateFee && (
              <Card className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 shadow-none">
                <p className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="size-4" /> Không phát sinh phí trả muộn
                </p>
                <p className="mt-1">Khách trả phòng đúng hạn hoặc trong thời gian ân hạn.</p>
              </Card>
            )}

            {booking.status === 'CHECKED_IN' && quote.data?.early && (
              <Card className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 shadow-none">
                <p className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="size-4" /> Trả phòng sớm
                </p>
                <p className="mt-1">
                  {quote.data.releasedNights.length} đêm còn lại sẽ được giải phóng, không hoàn tiền theo chính sách.
                </p>
              </Card>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
