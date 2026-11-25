'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, LogOut, Sparkles } from 'lucide-react';
import { ActionBar } from '@/components/common/ActionBar';
import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api-error';
import { useStaffHotel } from '@/features/staff/components/StaffHotelProvider';
import {
  useBookingLookup,
  useCheckOut,
  useCheckOutQuote,
  useCleanRoom,
  useHotelBookings,
} from '@/features/staff/api/staff-queries';
import {
  bookingStatusLabels,
  formatCalendarDate,
  formatDateTime,
  formatMoney,
  paymentStatusLabels,
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

function StaffCheckOutPageContent({ initialCode }: { initialCode: string }) {
  const { hotel } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const today = todayDate();

  const [input, setInput] = useState(initialCode);
  const [lookupQuery, setLookupQuery] = useState<{ code?: string; qrToken?: string } | null>(
    initialCode ? { code: initialCode } : null,
  );
  const [adjusting, setAdjusting] = useState(false);
  const [lateFeeAmount, setLateFeeAmount] = useState('');
  const [lateFeeReason, setLateFeeReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cleanedRooms, setCleanedRooms] = useState<string[]>([]);

  const lookup = useBookingLookup(hotelId, lookupQuery ?? {}, !!lookupQuery);
  const booking = lookup.data;
  const stays = useHotelBookings(hotelId, { status: ['CHECKED_IN'], pageSize: 100, sort: 'check-in-asc' });
  const canCheckOut = booking?.status === 'CHECKED_IN';
  const checkOut = useCheckOut();
  // After a successful check-out the quote endpoint only accepts CHECKED_IN; stop refetching it (409).
  const quote = useCheckOutQuote(booking?.id, !!canCheckOut && !checkOut.isSuccess);
  const cleanRoom = useCleanRoom();

  const computedFee = quote.data?.lateFee?.amount ?? 0;
  const enteredFee = Number(lateFeeAmount);
  const reasonMissing = adjusting && lateFeeAmount.trim() !== '' && lateFeeReason.trim() === '';
  const amountInvalid =
    adjusting &&
    lateFeeAmount.trim() !== '' &&
    !(Number.isFinite(enteredFee) && enteredFee >= 0 && enteredFee <= computedFee);
  // An adjustment is sent only when an amount is typed; it then needs a reason.
  const hasAdjustment = adjusting && lateFeeAmount.trim() !== '';
  const adjustmentValid = !hasAdjustment || (!reasonMissing && !amountInvalid);

  const submitLookup = (raw: string = input) => {
    const value = raw.trim();
    if (!value) return;
    setLookupQuery(value.includes('.') ? { qrToken: value } : { code: value });
    clearForm();
    checkOut.reset();
  };
  const clearForm = () => {
    setAdjusting(false);
    setLateFeeAmount('');
    setLateFeeReason('');
    setCleanedRooms([]);
    setConfirmOpen(false);
  };
  const reset = () => {
    setInput('');
    setLookupQuery(null);
    clearForm();
    checkOut.reset();
  };

  const doCheckOut = () => {
    if (!booking || !canCheckOut || !adjustmentValid) return;
    checkOut.mutate(
      {
        bookingId: booking.id,
        lateFee: hasAdjustment ? { amount: Math.round(enteredFee), reason: lateFeeReason.trim() } : undefined,
      },
      { onSettled: () => setConfirmOpen(false) },
    );
  };

  const fieldErrors = checkOut.error ? getApiFieldErrors(checkOut.error) : {};
  const done = booking?.status === 'COMPLETED';

  // Overdue first, then those leaving today.
  const departing = (stays.data?.bookings ?? []).slice().sort((a, b) => a.checkOut.localeCompare(b.checkOut));
  const overdue = departing.filter((row) => row.checkOut < today);
  const leavingToday = departing.filter((row) => row.checkOut === today);
  const staying = departing.length - overdue.length - leavingToday.length;

  const owes = !!quote.data && (computedFee > 0 || quote.data.addOnsDue > 0);

  return (
    <div className="space-y-5">
      <DeskHeader
        icon={LogOut}
        title="Trả phòng"
        description="Chọn khách đang lưu trú, thu các khoản tại quầy rồi xác nhận trả phòng."
        hotelName={hotel?.summary.name}
      />

      <LookupBar
        value={input}
        onChange={setInput}
        onSubmit={submitLookup}
        loading={lookup.isFetching}
        placeholder="Mã đơn đang lưu trú (SR-261031-1234) hoặc token QR"
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
          title="Khách sắp trả phòng"
          loading={stays.isLoading || !hotelId}
          error={stays.error}
          onRetry={() => void stays.refetch()}
          empty={{ title: 'Không có khách nào cần trả phòng hôm nay', description: 'Khách quá hạn và khách trả phòng hôm nay sẽ hiện ở đây.' }}
          groups={[
            { title: 'Quá hạn trả phòng', rows: overdue, tone: 'danger' },
            { title: 'Trả phòng hôm nay', rows: leavingToday, tone: 'info' },
          ]}
          renderPill={(row, group) => (
            <TonePillText tone={group.tone}>
              {row.checkOut < today ? `Quá ${daysBetween(row.checkOut, today)} ngày` : 'Hôm nay'}
            </TonePillText>
          )}
          onPick={(row) => {
            setInput(row.code);
            submitLookup(row.code);
          }}
          footer={
            staying > 0 ? (
              <p className="text-xs text-muted-foreground">
                Còn {staying} đơn đang lưu trú chưa đến ngày trả phòng; nhập mã đơn nếu khách trả sớm.
              </p>
            ) : undefined
          }
        />
      )}

      {booking && (
        <div className="mx-auto max-w-3xl space-y-4">
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5" aria-label="Thông tin đơn">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Khách lưu trú</span>
                <p className="truncate text-xl font-bold text-foreground">{booking.guestName}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono">{booking.code}</span> · {booking.contactPhone}
                </p>
              </div>
              <TonePillText tone={bookingStatusLabels[booking.status].tone}>
                {bookingStatusLabels[booking.status].label}
              </TonePillText>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Phòng" hint={booking.items.map((item) => item.roomType.name).join(', ')}>
                {booking.assignedRooms.length > 0
                  ? booking.assignedRooms.map((room) => room.roomNumber).join(', ')
                  : `${booking.rooms} phòng`}
              </Field>
              <Field label="Lưu trú" hint={`${booking.nights} đêm`}>
                {formatCalendarDate(booking.checkIn)} → {formatCalendarDate(booking.checkOut)}
              </Field>
              <Field label="Đã thanh toán" hint={paymentStatusLabels[booking.paymentStatus].label}>
                {formatMoney(booking.totalAmount)}
              </Field>
            </div>
          </section>

          {done ? (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5" role="status">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-700" aria-hidden />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-emerald-900">Đã trả phòng</h2>
                  <p className="mt-1 text-sm text-emerald-900">
                    Đơn đã hoàn tất, phòng chuyển sang “Đang dọn”. Bước tiếp theo: báo buồng phòng dọn, rồi đánh dấu đã dọn.
                  </p>
                  {booking.lateCheckout && (
                    <p className="mt-3 rounded-lg bg-card p-3 text-sm text-foreground">
                      Trả muộn {booking.lateCheckout.minutesLate} phút · phí đã thu tại quầy{' '}
                      <strong>{formatMoney(booking.lateCheckout.fee)}</strong>
                      {booking.lateCheckout.computedFee !== booking.lateCheckout.fee &&
                        ` (phí gốc ${formatMoney(booking.lateCheckout.computedFee)}${
                          booking.lateCheckout.reason ? `, lý do giảm: ${booking.lateCheckout.reason}` : ''
                        })`}
                    </p>
                  )}
                  {booking.assignedRooms.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {booking.assignedRooms.map((room) => {
                        const cleaned = cleanedRooms.includes(room.id);
                        return (
                          <li key={room.id} className="flex items-center justify-between gap-3 rounded-lg bg-card p-2 pl-3">
                            <span className="text-sm font-semibold text-foreground">Phòng {room.roomNumber}</span>
                            {cleaned ? (
                              <span className="flex items-center gap-1.5 pr-2 text-sm font-semibold text-emerald-700">
                                <CheckCircle2 className="size-4" aria-hidden /> Đã dọn
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                className="h-10 gap-1.5"
                                disabled={cleanRoom.isPending}
                                onClick={() =>
                                  cleanRoom.mutate(room.id, {
                                    onSuccess: () => setCleanedRooms((ids) => [...ids, room.id]),
                                  })
                                }
                              >
                                <Sparkles className="size-4" /> Đã dọn xong
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {cleanRoom.error && (
                    <p className="mt-2 text-sm text-destructive" role="alert">
                      {getApiErrorMessage(cleanRoom.error, 'Không cập nhật được trạng thái phòng.')}
                    </p>
                  )}
                </div>
              </div>
            </section>
          ) : canCheckOut ? (
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5" aria-label="Thu tại quầy">
              {quote.isLoading ? (
                <LoadingState rows={2} label="Đang tính phí trả phòng…" />
              ) : quote.error ? (
                <ErrorState
                  title="Không tải được thông tin trả phòng"
                  error={quote.error}
                  onRetry={() => void quote.refetch()}
                />
              ) : quote.data ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thu tại quầy</h2>
                    {owes ? (
                      <dl className="mt-2 space-y-2">
                        {quote.data.lateFee && (
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-sm text-foreground">
                              Phí trả muộn ({quote.data.minutesLate} phút, {quote.data.lateFee.percent}% giá đêm)
                            </dt>
                            <dd className="text-2xl font-bold text-foreground">{formatMoney(quote.data.lateFee.amount)}</dd>
                          </div>
                        )}
                        {quote.data.addOnsDue > 0 && (
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-sm text-foreground">Dịch vụ phát sinh</dt>
                            <dd className="text-2xl font-bold text-foreground">{formatMoney(quote.data.addOnsDue)}</dd>
                          </div>
                        )}
                      </dl>
                    ) : (
                      <p className="mt-1 text-base font-semibold text-emerald-700">Không phải thu thêm khoản nào.</p>
                    )}
                    {owes && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Thu trực tiếp tại quầy lễ tân, không trừ vào ví StayReco.
                      </p>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Giờ trả phòng</dt>
                      <dd className="font-semibold text-foreground">{formatDateTime(quote.data.scheduledAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Khách đã thanh toán</dt>
                      <dd className="font-semibold text-foreground">{formatMoney(quote.data.amountPaid)}</dd>
                    </div>
                  </dl>

                  {quote.data.early && (
                    <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                      Trả phòng sớm: {quote.data.releasedNights.length} đêm còn lại được giải phóng và không hoàn tiền.
                    </p>
                  )}

                  {quote.data.lateFee && adjusting && (
                    <div className="space-y-3 rounded-lg border border-border p-3">
                      <p className="text-sm font-semibold text-foreground">Giảm phí trả muộn</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Phí thu sau khi giảm (tối đa {formatMoney(computedFee)})
                          </span>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={computedFee}
                            value={lateFeeAmount}
                            onChange={(event) => setLateFeeAmount(event.target.value)}
                            aria-invalid={amountInvalid}
                            className="h-10 text-sm"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-xs font-semibold text-muted-foreground">Lý do (bắt buộc)</span>
                          <Input
                            value={lateFeeReason}
                            onChange={(event) => setLateFeeReason(event.target.value)}
                            aria-invalid={reasonMissing}
                            className="h-10 text-sm"
                          />
                        </label>
                      </div>
                      {amountInvalid && (
                        <p className="text-xs text-destructive">Nhập số từ 0 đến {formatMoney(computedFee)}.</p>
                      )}
                      {reasonMissing && <p className="text-xs text-destructive">Cần nhập lý do khi giảm phí.</p>}
                      {fieldErrors['lateFee.amount'] && (
                        <p className="text-xs text-destructive">{fieldErrors['lateFee.amount']}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          ) : (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="status">
              Đơn đang ở trạng thái “{bookingStatusLabels[booking.status].label}”. Chỉ đơn “Đang lưu trú” mới trả phòng được.
            </p>
          )}

          {checkOut.error && !confirmOpen && (
            <ErrorState
              title="Trả phòng thất bại"
              error={checkOut.error}
              fallback="Không thể trả phòng. Vui lòng thử lại."
              className="py-5"
            />
          )}

          <StickyActionBar info={canCheckOut && quote.data && owes ? 'Nhớ thu tiền tại quầy trước khi trả phòng' : undefined}>
            <ActionBar
              primary={
                done || !canCheckOut ? (
                  <Button onClick={reset} className="h-11 px-6">
                    Khách tiếp theo
                  </Button>
                ) : (
                  <Button
                    className="h-11 gap-2 px-6"
                    disabled={checkOut.isPending || quote.isLoading || !!quote.error || !adjustmentValid}
                    onClick={() => setConfirmOpen(true)}
                  >
                    <LogOut className="size-4" /> Trả phòng
                  </Button>
                )
              }
              menu={[
                ...(canCheckOut && quote.data?.lateFee && !adjusting
                  ? [
                      {
                        label: 'Giảm phí trả muộn',
                        description: 'Nhập số tiền mới và lý do.',
                        onSelect: () => setAdjusting(true),
                      },
                    ]
                  : []),
                ...(canCheckOut && adjusting
                  ? [
                      {
                        label: 'Bỏ giảm phí',
                        description: 'Thu đủ phí trả muộn theo hệ thống.',
                        onSelect: () => {
                          setAdjusting(false);
                          setLateFeeAmount('');
                          setLateFeeReason('');
                        },
                      },
                    ]
                  : []),
                { label: 'Xem chi tiết đơn', href: `/staff/bookings/${booking.id}` },
                ...(done || !canCheckOut ? [] : [{ label: 'Tìm đơn khác', onSelect: reset }]),
              ]}
            />
          </StickyActionBar>

          <Dialog open={confirmOpen} onOpenChange={(open) => !checkOut.isPending && setConfirmOpen(open)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Trả phòng cho {booking.guestName}?</DialogTitle>
                <DialogDescription>
                  Đơn {booking.code} chuyển sang “Đã trả phòng”, phòng{' '}
                  {booking.assignedRooms.map((room) => room.roomNumber).join(', ')} chuyển sang “Đang dọn” và hoa hồng
                  được ghi nhận. Không hoàn tác được.
                </DialogDescription>
              </DialogHeader>
              {owes && quote.data && (
                <div className="space-y-1 rounded-lg bg-muted p-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Đã thu tại quầy?</p>
                  {quote.data.lateFee && (
                    <p>
                      Phí trả muộn:{' '}
                      <strong>{hasAdjustment ? formatMoney(Math.round(enteredFee)) : formatMoney(quote.data.lateFee.amount)}</strong>
                    </p>
                  )}
                  {quote.data.addOnsDue > 0 && (
                    <p>
                      Dịch vụ phát sinh: <strong>{formatMoney(quote.data.addOnsDue)}</strong>
                    </p>
                  )}
                </div>
              )}
              {checkOut.error && (
                <p className="text-sm text-destructive" role="alert">
                  {getApiErrorMessage(checkOut.error, 'Không thể trả phòng. Vui lòng thử lại.')}
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" className="h-10" disabled={checkOut.isPending} onClick={() => setConfirmOpen(false)}>
                  Huỷ
                </Button>
                <Button className="h-10 gap-2" disabled={checkOut.isPending} onClick={doCheckOut}>
                  {checkOut.isPending && <Loader2 className="size-4 animate-spin" />}
                  Trả phòng
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

/** `?code=SR-…` (from the booking list and detail) opens the booking straight away; a new code remounts the form. */
function CodeParamPage() {
  const code = useSearchParams().get('code')?.trim() ?? '';
  return <StaffCheckOutPageContent key={code} initialCode={code} />;
}

export default function StaffCheckOutPage() {
  return (
    <Suspense fallback={null}>
      <CodeParamPage />
    </Suspense>
  );
}
