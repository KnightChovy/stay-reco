'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  Bed,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Hourglass,
  Loader2,
  MapPin,
  Phone,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Star,
  User,
  UserPen,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import type { Booking } from '@stayreco/shared';
import { Card } from '@/components/ui/card';
import { ActionBar, type ActionMenuItem } from '@/components/common/ActionBar';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useBooking, useBookingVoucher } from '@/features/booking/api/booking-queries';
import { VoucherQr } from '@/features/booking/components/VoucherQr';
import { BookingInvoice } from '@/features/booking/components/BookingInvoice';
import { BookingTimeline } from '@/features/booking/components/BookingTimeline';
import { StatusPill, TonePill } from '@/features/booking/components/StatusPill';
import {
  FALLBACK_HOTEL_IMAGE,
  bookingActions,
  freeCancelState,
  paymentStatusLabels,
  stayRelativeLabel,
} from '@/features/booking/lib/booking-status';
import { useReviewEligibility } from '@/features/account/api/rewards-queries';
import { SupportCard } from '@/features/account/SupportCard';
import {
  BookingBreadcrumb,
  BookingPageError,
  BookingPageLoading,
  linkButton,
} from '@/features/account/booking-detail/BookingPageParts';
import { formatDate, formatDateTime, formatMoney } from '@/features/stays/lib/format';

/** The voucher QR the front desk scans at check-in and check-out (`GET /bookings/:id/voucher`). */
function CheckInQrCard({ bookingId, checkedIn }: { bookingId: string; checkedIn: boolean }) {
  const voucherQuery = useBookingVoucher(bookingId);
  const voucher = voucherQuery.data;

  return (
    <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
      <div className="border-b border-border bg-primary p-4 text-center text-primary-foreground">
        <QrCode className="mx-auto size-6" aria-hidden />
        <h2 className="mt-1 text-sm font-bold">Mã QR check-in</h2>
        <p className="text-xs text-primary-foreground/75">
          {checkedIn ? 'Đưa mã này cho lễ tân khi trả phòng' : 'Bấm vào mã để phóng to khi đưa lễ tân quét'}
        </p>
      </div>
      <div className="p-5">
        {voucher ? (
          <VoucherQr token={voucher.qrToken} code={voucher.code} voucher={voucher} />
        ) : voucherQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Đang tạo mã QR…
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {getApiErrorMessage(voucherQuery.error, 'Không tải được mã QR. Vui lòng thử lại sau.')}
          </p>
        )}
      </div>
    </Card>
  );
}

/** Where the QR will be, while the booking still waits for its payment. */
function PendingPaymentCard({ booking }: { booking: Booking }) {
  return (
    <Card className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-5 shadow-none">
      <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <Hourglass className="size-4" aria-hidden /> Hoàn tất thanh toán để nhận mã QR
      </p>
      <p className="text-sm text-amber-900/80">
        Mã QR check-in xuất hiện ngay khi thanh toán được xác nhận.
        {booking.holdExpiresAt && (
          <>
            {' '}
            Phòng được giữ đến <strong>{formatDateTime(booking.holdExpiresAt)}</strong>.
          </>
        )}
      </p>
      <Link href={`/booking/payment?id=${booking.id}`} className={linkButton('default', 'w-full')}>
        <CreditCard className="size-4" /> Thanh toán ngay
      </Link>
    </Card>
  );
}

/** "Write a review" / "Your review", from `GET /bookings/:id/review-eligibility` rather than re-implementing its rules. */
function ReviewButton({ bookingId }: { bookingId: string }) {
  const eligibility = useReviewEligibility(bookingId).data;
  if (!eligibility || (!eligibility.canReview && !eligibility.reviewId)) return null;
  return (
    <Link href={`/account/bookings/${bookingId}/review`} className={linkButton('default', 'flex-1 md:flex-none')}>
      <Star className="size-4" /> {eligibility.canReview ? 'Viết đánh giá' : 'Xem đánh giá của bạn'}
    </Link>
  );
}

/**
 * `?reviewed=visible|hidden`, set by the review page from the saved review. Read once, then dropped from the URL so a
 * reload or a shared link does not thank the customer again.
 */
function ReviewedNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [reviewed] = useState(() => searchParams.get('reviewed'));

  useEffect(() => {
    if (searchParams.get('reviewed')) router.replace(pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  if (reviewed !== 'visible' && reviewed !== 'hidden') return null;
  return (
    <div className="mx-auto mt-4 max-w-marketplace px-4 sm:px-6">
      <p
        role="status"
        className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
      >
        <CheckCircle2 className="size-4 shrink-0" aria-hidden /> Cảm ơn bạn! Đánh giá đã được lưu
        {reviewed === 'visible'
          ? ' và hiển thị trên trang khách sạn.'
          : '. Đánh giá này đang bị ẩn sau khi bị báo cáo, nên chưa hiện trên trang khách sạn.'}
      </p>
    </div>
  );
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{children}</span>
    </div>
  );
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const bookingQuery = useBooking(params.id);
  const booking = bookingQuery.data;
  // Read once when the page opens: deadlines on this page do not need to tick.
  const [openedAt] = useState(() => Date.now());

  if (bookingQuery.isLoading) return <BookingPageLoading />;
  if (bookingQuery.error || !booking) {
    return <BookingPageError error={bookingQuery.error} onRetry={() => void bookingQuery.refetch()} />;
  }

  const { canPay, canVoucher, canCancel, canChange } = bookingActions(booking);
  const freeCancel = freeCancelState(booking.cancellation, openedAt);
  const relative = stayRelativeLabel(booking);
  const image = booking.hotel.coverImageUrl ?? FALLBACK_HOTEL_IMAGE;

  const primary =
    booking.status === 'COMPLETED' ? (
      <ReviewButton bookingId={booking.id} />
    ) : canPay ? (
      <Link href={`/booking/payment?id=${booking.id}`} className={linkButton('default', 'flex-1 md:flex-none')}>
        <CreditCard className="size-4" /> Thanh toán ngay
      </Link>
    ) : canVoucher ? (
      <Link href={`/booking/confirmation?id=${booking.id}`} className={linkButton('default', 'flex-1 md:flex-none')}>
        <QrCode className="size-4" /> Xem voucher
      </Link>
    ) : undefined;

  const menu: ActionMenuItem[] = [
    ...(canChange
      ? [
          {
            label: 'Đổi thông tin khách',
            description: 'Tên, số điện thoại, giờ đến, yêu cầu',
            icon: UserPen,
            href: `/account/bookings/${booking.id}/change`,
          },
        ]
      : []),
    ...(canCancel
      ? [
          {
            label: 'Huỷ đặt phòng',
            description: freeCancel.label,
            icon: XCircle,
            href: `/account/bookings/${booking.id}/cancel`,
            destructive: true,
          },
        ]
      : []),
  ];

  return (
    <>
      <BookingBreadcrumb
        items={[
          { label: 'Tài khoản', href: '/account/profile' },
          { label: 'Chuyến đi của tôi', href: '/account/bookings' },
          { label: `Chi tiết #${booking.code}`, active: true },
        ]}
      />

      <section className="w-full border-b border-border bg-card py-5 shadow-xs sm:py-6">
        <div className="mx-auto flex max-w-marketplace flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Chi tiết đặt phòng</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="font-mono text-2xl font-bold tracking-tight text-primary sm:text-3xl">{booking.code}</h1>
              <StatusPill booking={booking} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {relative && <span className="font-semibold text-foreground">{relative} · </span>}
              {booking.hotel.name} · {booking.nights} đêm · {booking.rooms} phòng · {booking.guests} khách
            </p>
          </div>
          <ActionBar primary={primary} menu={menu} menuLabel="Quản lý đơn" />
        </div>
      </section>

      <Suspense fallback={null}>
        <ReviewedNotice />
      </Suspense>

      <div className="mx-auto w-full max-w-marketplace px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            <Card className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-xs sm:flex-row sm:p-6">
              <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-5/12">
                <Image
                  src={image}
                  alt={booking.hotel.name}
                  fill
                  sizes="(min-width: 640px) 320px, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{booking.hotel.name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-4 text-primary" aria-hidden /> {booking.hotel.city}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <p className="flex items-center gap-1.5">
                    <Bed className="size-4 text-primary" aria-hidden />
                    {booking.items.map((item) => `${item.roomType.name} × ${item.rooms}`).join(', ')}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="size-4 text-primary" aria-hidden /> {booking.rooms} phòng · {booking.guests} khách
                  </p>
                  {booking.assignedRooms.length > 0 && (
                    <p className="flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-emerald-700" aria-hidden /> Phòng:{' '}
                      {booking.assignedRooms.map((room) => room.roomNumber).join(', ')}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3 text-sm">
                  <InfoField label="Nhận phòng">{formatDate(booking.checkIn)}</InfoField>
                  <InfoField label="Trả phòng">{formatDate(booking.checkOut)}</InfoField>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                <User className="size-4 text-primary" aria-hidden /> Thông tin khách lưu trú
              </h2>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <InfoField label="Khách nhận phòng">{booking.guestName}</InfoField>
                <InfoField label="Số điện thoại">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3.5" aria-hidden /> {booking.contactPhone}
                  </span>
                </InfoField>
                <InfoField label="Giờ đến dự kiến">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden /> {booking.arrivalTime ?? 'Chưa chọn'}
                  </span>
                </InfoField>
                <InfoField label="Yêu cầu đặc biệt">
                  <span className="font-normal text-muted-foreground">{booking.specialRequests ?? 'Không có'}</span>
                </InfoField>
              </div>
            </Card>

            <Card className="rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                <Calendar className="size-4 text-primary" aria-hidden /> Lịch sử đơn đặt phòng
              </h2>
              <BookingTimeline timeline={booking.timeline} />
            </Card>

            <Card className="rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                  <ShieldCheck className="size-4 text-emerald-700" aria-hidden /> Chính sách huỷ
                </h2>
                {canCancel && <TonePill tone={freeCancel.open ? 'success' : 'warning'}>{freeCancel.label}</TonePill>}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {booking.cancellation.freeUntil
                  ? `Miễn phí huỷ trước ${formatDateTime(booking.cancellation.freeUntil)}. Sau đó phí huỷ là ${booking.cancellation.feePercent}% tiền phòng.`
                  : `Đơn không huỷ miễn phí. Phí huỷ là ${booking.cancellation.feePercent}% tiền phòng.`}
                {booking.invoice.addOnsTotal > 0 && ' Dịch vụ đặt kèm luôn được hoàn đủ.'}
              </p>
              {booking.cancelReason && (
                <p className="mt-2 text-sm text-muted-foreground">Lý do huỷ: {booking.cancelReason}</p>
              )}
              {booking.refundRejection && (
                <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  Khách sạn từ chối hoàn tiền ({formatDateTime(booking.refundRejection.at)}): {booking.refundRejection.reason}
                </p>
              )}
            </Card>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4">
            {canVoucher && <CheckInQrCard bookingId={booking.id} checkedIn={booking.status === 'CHECKED_IN'} />}
            {canPay && <PendingPaymentCard booking={booking} />}

            {booking.refund && (
              <Card
                className={cn(
                  'space-y-2 rounded-xl border p-5 shadow-none',
                  booking.refund.status === 'REFUND_PENDING'
                    ? 'border-amber-200 bg-amber-50/70'
                    : 'border-emerald-200 bg-emerald-50/70',
                )}
              >
                <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Wallet className="size-4 text-primary" aria-hidden /> Hoàn tiền {formatMoney(booking.refund.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.refund.status === 'REFUND_PENDING'
                    ? 'Đang chờ khách sạn duyệt. Tiền về Ví StayReco ngay khi được duyệt.'
                    : `${paymentStatusLabels[booking.refund.status]}, tiền đã vào Ví StayReco của bạn.`}
                </p>
                <Link href="/account/wallet" className={linkButton('outline', 'w-full')}>
                  <Wallet className="size-4" /> Xem ví
                </Link>
              </Card>
            )}

            <Card className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-md sm:p-6">
              <h2 className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                <ReceiptText className="size-4 text-primary" aria-hidden /> Hoá đơn &amp; thanh toán
              </h2>
              <BookingInvoice booking={booking} />
            </Card>

            <SupportCard note="Đổi tên khách hoặc giờ đến ngay trong menu Quản lý đơn." />
          </aside>
        </div>
      </div>
    </>
  );
}
