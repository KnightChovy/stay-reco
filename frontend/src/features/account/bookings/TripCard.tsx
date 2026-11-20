'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Copy, Eye, MapPin, QrCode, RotateCcw, Star, UserPen, Wallet, XCircle } from 'lucide-react';
import type { BookingSummary } from '@stayreco/shared';
import { ActionMenu, type ActionMenuItem } from '@/components/common/ActionBar';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { notify } from '@/features/account/AccountShell';
import { CopyCodeButton } from '@/features/booking/components/VoucherQr';
import { StatusPill } from '@/features/booking/components/StatusPill';
import { FALLBACK_HOTEL_IMAGE, bookingActions, stayRelativeLabel } from '@/features/booking/lib/booking-status';
import { formatDate, formatMoney } from '@/features/stays/lib/format';

const primaryButton = cn(buttonVariants({ variant: 'default' }), 'h-10 gap-1.5 px-4 whitespace-nowrap');

/** The one next step a trip offers; everything else goes in the card's "⋯" menu. */
function primaryAction(booking: BookingSummary) {
  const actions = bookingActions(booking);
  if (actions.canPay) return { label: 'Thanh toán ngay', href: `/booking/payment?id=${booking.id}`, icon: Wallet };
  if (actions.canVoucher) return { label: 'Xem voucher', href: `/booking/confirmation?id=${booking.id}`, icon: QrCode };
  if (booking.status === 'COMPLETED') return { label: 'Đánh giá', href: `/account/bookings/${booking.id}/review`, icon: Star };
  return { label: 'Đặt lại', href: `/hotels/${booking.hotel.id}`, icon: RotateCcw };
}

function menuItems(booking: BookingSummary): ActionMenuItem[] {
  const actions = bookingActions(booking);
  const items: ActionMenuItem[] = [
    { label: 'Xem chi tiết đơn', description: 'Hoá đơn, lịch sử và chính sách huỷ', href: `/account/bookings/${booking.id}`, icon: Eye },
    {
      label: 'Sao chép mã đặt phòng',
      description: booking.code,
      icon: Copy,
      onSelect: () => {
        void navigator.clipboard
          ?.writeText(booking.code)
          .then(() => notify.success('Đã sao chép mã đặt phòng', booking.code))
          .catch(() => notify.error('Không sao chép được', 'Hãy chép mã thủ công.'));
      },
    },
  ];
  if (actions.canChange) {
    items.push({
      label: 'Đổi thông tin khách',
      description: 'Tên, số điện thoại, giờ đến, yêu cầu',
      href: `/account/bookings/${booking.id}/change`,
      icon: UserPen,
    });
  }
  if (actions.canCancel) {
    items.push({
      label: 'Huỷ đặt phòng',
      description: 'Xem phí huỷ và số tiền hoàn trước khi xác nhận',
      href: `/account/bookings/${booking.id}/cancel`,
      icon: XCircle,
      destructive: true,
    });
  }
  return items;
}

/** One trip in "Chuyến đi của tôi": the hotel, the dates, one status pill, one primary action and a "⋯" menu. */
export function TripCard({ booking }: { booking: BookingSummary }) {
  const primary = primaryAction(booking);
  const PrimaryIcon = primary.icon;
  const relative = stayRelativeLabel(booking);
  const detailHref = `/account/bookings/${booking.id}`;
  const roomNames = booking.items.map((item) => `${item.roomType.name} × ${item.rooms}`).join(', ');

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-4 py-2 sm:px-5">
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate font-mono text-sm font-bold text-primary">{booking.code}</span>
          <CopyCodeButton code={booking.code} className="min-h-9 shrink-0" />
        </div>
        <StatusPill booking={booking} className="shrink-0" />
      </header>

      <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row">
        <Link
          href={detailHref}
          className="relative block h-40 w-full shrink-0 overflow-hidden rounded-lg bg-muted md:h-auto md:min-h-36 md:w-52"
          tabIndex={-1}
          aria-hidden
        >
          <Image
            src={booking.hotel.coverImageUrl ?? FALLBACK_HOTEL_IMAGE}
            alt=""
            fill
            sizes="(min-width: 768px) 208px, 100vw"
            className="object-cover"
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden /> {booking.hotel.city}
            </p>
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              <Link href={detailHref} className="hover:text-primary hover:underline">
                {booking.hotel.name}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{roomNames}</span> · {booking.guests} khách ·{' '}
              {booking.guestName}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-muted p-2.5 text-sm text-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4 text-primary" aria-hidden />
                {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
              </span>
              <span className="text-muted-foreground">{booking.nights} đêm</span>
              {relative && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{relative}</span>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-xl font-bold text-primary">{formatMoney(booking.totalAmount)}</span>
              <span className="text-xs text-muted-foreground">Đặt ngày {formatDate(booking.createdAt.slice(0, 10))}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link href={primary.href} className={primaryButton}>
                <PrimaryIcon className="size-4" aria-hidden /> {primary.label}
              </Link>
              <ActionMenu items={menuItems(booking)} variant="icon" label={`Thao tác khác cho đơn ${booking.code}`} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
