'use client';

import Link from 'next/link';
import { ArrowRight, Clock, CreditCard } from 'lucide-react';
import type { BookingSummary } from '@stayreco/shared';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDate, formatMoney } from '@/features/stays/lib/format';

/**
 * The upcoming bookings (`GET /me/bookings?tab=upcoming`, PENDING and CONFIRMED) the wallet cares about: refunds still
 * waiting for the hotel, and bookings the balance could pay. `BookingSummary` carries no refund amount, so a waiting
 * refund links to its booking, where the amount is shown, instead of guessing it here.
 */
export function PendingRefundsCard({ bookings }: { bookings: BookingSummary[] }) {
  if (bookings.length === 0) return null;
  return (
    <Card className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-none sm:p-6">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-amber-950">
          <Clock className="size-5 text-amber-700" aria-hidden /> Đang chờ khách sạn duyệt hoàn tiền
        </h2>
        <p className="mt-1 text-sm text-amber-900">
          Tiền hoàn chưa vào số dư cho đến khi khách sạn duyệt. Nếu khách sạn chưa duyệt trước giờ nhận phòng, hệ thống tự
          duyệt.
        </p>
      </div>
      <ul className="divide-y divide-amber-200 rounded-xl border border-amber-200 bg-card">
        {bookings.map((booking) => (
          <li key={booking.id}>
            <Link
              href={`/account/bookings/${booking.id}`}
              className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">{booking.hotel.name}</span>
                <span className="block text-xs text-muted-foreground">
                  #{booking.code} · nhận phòng {formatDate(booking.checkIn)}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
                Xem số tiền hoàn <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** A booking waiting for payment that the balance covers: the payment page offers "Thanh toán bằng ví". */
export function PayWithWalletHint({ booking }: { booking: BookingSummary }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <CreditCard className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Đơn #{booking.code} đang chờ thanh toán</p>
          <p className="text-sm text-muted-foreground">
            {booking.hotel.name} · {formatMoney(booking.totalAmount)}. Số dư ví của bạn đủ để trả toàn bộ đơn này.
          </p>
        </div>
      </div>
      <Link
        href={`/booking/payment?id=${booking.id}`}
        className={cn(buttonVariants(), 'h-10 w-full shrink-0 px-5 sm:w-auto')}
      >
        Thanh toán bằng ví
      </Link>
    </div>
  );
}
