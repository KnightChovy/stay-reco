'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { AlertTriangle, BedDouble, Calendar, CheckCircle2, Clock, Info, Loader2, MapPin, Phone, ShieldCheck, User, UserCog } from 'lucide-react';
import { changeRequestSchema, type Booking, type ChangeRequestInput } from '@stayreco/shared';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/common/StateViews';
import { getApiErrorCode, getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useBooking, useRequestBookingChange } from '@/features/booking/api/booking-queries';
import { FALLBACK_HOTEL_IMAGE, bookingActions } from '@/features/booking/lib/booking-status';
import { SupportCard } from '@/features/account/SupportCard';
import {
  BookingBreadcrumb,
  BookingPageError,
  BookingPageLoading,
  linkButton,
} from '@/features/account/booking-detail/BookingPageParts';
import { formatDate, formatDateTime, formatMoney } from '@/features/stays/lib/format';

const SPECIAL_REQUESTS_MAX = 500;

/** The fields of a change request, as the hotel will read them. */
function ChangeSummary({ changes }: { changes: ChangeRequestInput }) {
  return (
    <dl className="space-y-1 rounded-lg bg-card p-3 text-sm">
      {changes.guestName && (
        <div className="flex gap-1">
          <dt className="text-muted-foreground">Họ tên:</dt> <dd className="font-semibold">{changes.guestName}</dd>
        </div>
      )}
      {changes.contactPhone && (
        <div className="flex gap-1">
          <dt className="text-muted-foreground">Số điện thoại:</dt> <dd className="font-semibold">{changes.contactPhone}</dd>
        </div>
      )}
      {changes.arrivalTime !== undefined && (
        <div className="flex gap-1">
          <dt className="text-muted-foreground">Giờ đến:</dt> <dd className="font-semibold">{changes.arrivalTime ?? 'Xoá'}</dd>
        </div>
      )}
      {changes.specialRequests !== undefined && (
        <div className="flex gap-1">
          <dt className="text-muted-foreground">Yêu cầu:</dt> <dd className="font-semibold">{changes.specialRequests ?? 'Xoá'}</dd>
        </div>
      )}
    </dl>
  );
}

export default function ChangeBookingPage() {
  const params = useParams<{ id: string }>();
  const bookingQuery = useBooking(params.id);
  const booking = bookingQuery.data;
  // Kept here, not in the form: once the request is in, the refetched booking shows it as pending and the form is
  // replaced, so the confirmation must outlive the form.
  const [justSent, setJustSent] = useState<ChangeRequestInput | null>(null);

  if (bookingQuery.isLoading) return <BookingPageLoading label="Đang tải đơn đặt phòng…" />;
  if (bookingQuery.error || !booking) {
    return <BookingPageError error={bookingQuery.error} onRetry={() => void bookingQuery.refetch()} />;
  }

  const pendingRequest = booking.changeRequest?.status === 'PENDING';
  const { canChange } = bookingActions(booking);
  const detailHref = `/account/bookings/${booking.id}`;

  return (
    <>
      <BookingBreadcrumb
        items={[
          { label: 'Tài khoản', href: '/account/profile' },
          { label: 'Chuyến đi của tôi', href: '/account/bookings' },
          { label: `Chi tiết #${booking.code}`, href: detailHref },
          { label: 'Đổi thông tin khách', active: true },
        ]}
      />

      <div className="mx-auto w-full max-w-marketplace px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Đổi thông tin khách</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Đổi họ tên, số điện thoại, giờ đến và yêu cầu đặc biệt. Khách sạn duyệt trước khi thông tin được cập nhật.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            {justSent ? (
              <Card role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-none">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-7 shrink-0 text-emerald-600" aria-hidden />
                  <div className="min-w-0 space-y-3">
                    <div>
                      <h2 className="text-lg font-bold text-emerald-900">Đã gửi yêu cầu đổi thông tin</h2>
                      <p className="mt-1 text-sm text-emerald-800">
                        Khách sạn sẽ xem và phản hồi. Bạn nhận email và thông báo khi yêu cầu được duyệt hoặc bị từ chối.
                      </p>
                    </div>
                    <ChangeSummary changes={justSent} />
                    <Link href={detailHref} className={linkButton('default')}>
                      Về chi tiết đơn
                    </Link>
                  </div>
                </div>
              </Card>
            ) : pendingRequest && booking.changeRequest ? (
              <Card className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-5 shadow-none">
                <h2 className="flex items-center gap-2 text-base font-bold text-amber-900">
                  <Clock className="size-4" aria-hidden /> Đang chờ khách sạn duyệt
                </h2>
                <p className="text-sm text-amber-900/80">
                  Yêu cầu gửi lúc {formatDateTime(booking.changeRequest.requestedAt)}. Bạn chưa thể gửi yêu cầu mới cho
                  đến khi khách sạn phản hồi.
                </p>
                <ChangeSummary changes={booking.changeRequest.changes} />
              </Card>
            ) : canChange ? (
              <ChangeForm key={booking.id} booking={booking} onSent={setJustSent} />
            ) : (
              <EmptyState
                icon={Info}
                title="Không thể đổi thông tin"
                description={
                  booking.paymentStatus === 'REFUND_PENDING'
                    ? 'Đơn đang chờ khách sạn xử lý yêu cầu huỷ và hoàn tiền.'
                    : booking.status === 'CHECKED_IN'
                      ? 'Bạn đang lưu trú: hãy báo trực tiếp cho lễ tân.'
                      : 'Chỉ đơn đã xác nhận và đã thanh toán, chưa nhận phòng, mới đổi được thông tin khách.'
                }
              />
            )}

            {booking.changeRequest && booking.changeRequest.status !== 'PENDING' && !justSent && (
              <Card className="rounded-xl border border-border bg-card p-5 shadow-xs">
                <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  {booking.changeRequest.status === 'ACCEPTED' ? (
                    <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                  ) : (
                    <AlertTriangle className="size-4 text-red-600" aria-hidden />
                  )}
                  Yêu cầu gần nhất: {booking.changeRequest.status === 'ACCEPTED' ? 'Đã được duyệt' : 'Bị từ chối'}
                </h2>
                {booking.changeRequest.reason && (
                  <p className="mt-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    Lý do: {booking.changeRequest.reason}
                  </p>
                )}
              </Card>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
            <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
              <div className="border-b border-border bg-muted p-5">
                <h2 className="text-base font-bold tracking-tight text-foreground">Đơn đặt phòng</h2>
                <p className="font-mono text-sm font-bold text-primary">{booking.code}</p>
              </div>
              <div className="space-y-3 p-5 text-sm">
                <div className="flex items-start gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={booking.hotel.coverImageUrl ?? FALLBACK_HOTEL_IMAGE}
                      alt={booking.hotel.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-foreground">{booking.hotel.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden /> {booking.hotel.city}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-primary">
                      <BedDouble className="size-3.5" aria-hidden />
                      {booking.items.map((item) => item.roomType.name).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 rounded-lg bg-muted p-3">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="size-4 text-primary" aria-hidden /> {formatDate(booking.checkIn)} →{' '}
                    {formatDate(booking.checkOut)}
                  </p>
                  <p className="text-muted-foreground">
                    {booking.nights} đêm · {booking.rooms} phòng · {booking.guests} khách
                  </p>
                  <p className="font-semibold text-primary">{formatMoney(booking.totalAmount)}</p>
                </div>
                <div className="space-y-1 text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <User className="size-4" aria-hidden /> {booking.guestName}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="size-4" aria-hidden /> {booking.contactPhone}
                  </p>
                </div>
                <p className="flex items-start gap-1.5 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  Khách sạn nhận email và duyệt yêu cầu. Thông tin chỉ đổi sau khi được duyệt.
                </p>
              </div>
            </Card>
            <SupportCard />
          </aside>
        </div>
      </div>
    </>
  );
}

function ChangeForm({ booking, onSent }: { booking: Booking; onSent: (changes: ChangeRequestInput) => void }) {
  const [guestName, setGuestName] = useState(booking.guestName);
  const [contactPhone, setContactPhone] = useState(booking.contactPhone);
  const [arrivalTime, setArrivalTime] = useState(booking.arrivalTime ?? '');
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const request = useRequestBookingChange();

  /** Puts the cursor on the first field the customer has to fix. */
  const focusFirst = (fieldErrors: FieldErrors) => {
    const first = ['guestName', 'contactPhone', 'arrivalTime', 'specialRequests'].find((field) => fieldErrors[field]);
    if (first) document.getElementById(first)?.focus();
  };

  const submit = () => {
    setFormError(null);

    const input: ChangeRequestInput = {};
    if (guestName.trim() !== booking.guestName) input.guestName = guestName.trim();
    if (contactPhone.trim() !== booking.contactPhone) input.contactPhone = contactPhone.trim();
    const arrival = arrivalTime.trim() || null;
    if (arrival !== booking.arrivalTime) input.arrivalTime = arrival;
    const requests = specialRequests.trim() || null;
    if (requests !== booking.specialRequests) input.specialRequests = requests;

    const fieldErrors: FieldErrors = {};
    if (!guestName.trim()) fieldErrors.guestName = 'Vui lòng nhập họ tên khách.';
    if (Object.keys(input).length === 0 && !fieldErrors.guestName) {
      setErrors({});
      setFormError('Bạn chưa thay đổi thông tin nào.');
      return;
    }
    const checked = validateWith(changeRequestSchema, input);
    Object.assign(fieldErrors, checked.errors ?? {}, fieldErrors);
    if (fieldErrors.contactPhone) fieldErrors.contactPhone = 'Số điện thoại không hợp lệ (8–20 chữ số).';
    if (Object.keys(fieldErrors).length > 0 || !checked.data) {
      setErrors(fieldErrors);
      focusFirst(fieldErrors);
      return;
    }
    setErrors({});

    request.mutate(
      { bookingId: booking.id, input: checked.data },
      {
        onSuccess: () => onSent(checked.data),
        onError: (err) => {
          const code = getApiErrorCode(err);
          if (code === 'CHANGE_REQUEST_PENDING') {
            setFormError('Đơn đã có một yêu cầu đang chờ khách sạn duyệt.');
            return;
          }
          if (code === 'REFUND_DECISION_PENDING') {
            setFormError('Đơn đang chờ xử lý hoàn tiền, chưa thể đổi thông tin.');
            return;
          }
          if (code === 'BOOKING_STATUS_CONFLICT') {
            setFormError('Trạng thái đơn đã thay đổi. Vui lòng tải lại trang.');
            return;
          }
          const serverErrors = getApiFieldErrors(err);
          setErrors(serverErrors);
          focusFirst(serverErrors);
          setFormError(getApiErrorMessage(err, 'Không gửi được yêu cầu. Vui lòng thử lại.'));
        },
      },
    );
  };

  const fieldError = (field: string) =>
    errors[field] ? (
      <p id={`${field}-error`} className="text-sm text-red-600">
        {errors[field]}
      </p>
    ) : null;

  return (
    <Card className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UserCog className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-bold text-foreground">Thông tin mới</h2>
          <p className="text-sm text-muted-foreground">Sửa trường cần đổi, giữ nguyên phần còn lại.</p>
        </div>
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="space-y-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="guestName" className="text-sm font-semibold">
              Họ và tên khách nhận phòng
            </Label>
            <Input
              id="guestName"
              value={guestName}
              autoComplete="name"
              aria-invalid={!!errors.guestName}
              aria-describedby={errors.guestName ? 'guestName-error' : undefined}
              onChange={(event) => setGuestName(event.target.value)}
              className="h-11 text-base sm:text-sm"
            />
            {fieldError('guestName')}
          </div>
          <div className="space-y-1">
            <Label htmlFor="contactPhone" className="text-sm font-semibold">
              Số điện thoại
            </Label>
            <Input
              id="contactPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={contactPhone}
              aria-invalid={!!errors.contactPhone}
              aria-describedby={errors.contactPhone ? 'contactPhone-error' : undefined}
              onChange={(event) => setContactPhone(event.target.value)}
              className="h-11 text-base sm:text-sm"
            />
            {fieldError('contactPhone')}
          </div>
          <div className="space-y-1">
            <Label htmlFor="arrivalTime" className="text-sm font-semibold">
              Giờ đến dự kiến
            </Label>
            <Input
              id="arrivalTime"
              type="time"
              value={arrivalTime}
              aria-invalid={!!errors.arrivalTime}
              aria-describedby={errors.arrivalTime ? 'arrivalTime-error' : undefined}
              onChange={(event) => setArrivalTime(event.target.value)}
              className="h-11 text-base sm:text-sm"
            />
            {fieldError('arrivalTime')}
          </div>
          <div className="space-y-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="specialRequests" className="text-sm font-semibold">
                Yêu cầu đặc biệt
              </Label>
              <span id="specialRequests-count" className="text-xs text-muted-foreground">
                {specialRequests.length}/{SPECIAL_REQUESTS_MAX}
              </span>
            </div>
            <textarea
              id="specialRequests"
              rows={3}
              value={specialRequests}
              maxLength={SPECIAL_REQUESTS_MAX}
              aria-invalid={!!errors.specialRequests}
              aria-describedby={cn('specialRequests-count', errors.specialRequests && 'specialRequests-error')}
              onChange={(event) => setSpecialRequests(event.target.value)}
              className="w-full resize-none rounded-lg border border-input bg-background p-3 text-base focus:ring-2 focus:ring-ring focus:outline-none sm:text-sm"
              placeholder="Để trống nếu muốn xoá yêu cầu cũ…"
            />
            {fieldError('specialRequests')}
          </div>
        </div>

        <p className="flex items-start gap-1.5 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          Ngày nhận/trả phòng, hạng phòng và số khách không đổi được ở đây. Nếu cần, hãy huỷ và đặt lại.
        </p>

        {formError && (
          <Alert variant="destructive" className="bg-red-50 p-3">
            <AlertTitle className="text-sm">Không gửi được yêu cầu</AlertTitle>
            <AlertDescription className="mt-1 text-sm">{formError}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 border-t border-border pt-4">
          <Button type="submit" disabled={request.isPending} className="h-10 gap-2 px-5">
            {request.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserCog className="size-4" />}
            Gửi yêu cầu
          </Button>
          <Link href={`/account/bookings/${booking.id}`} className={linkButton('ghost')}>
            Quay lại
          </Link>
        </div>
      </form>
    </Card>
  );
}
