'use client';

import Link from 'next/link';
import { ChevronLeft, SearchX } from 'lucide-react';
import AppBreadcrumb, { type BreadcrumbItem } from '@/components/common/breadcrumb/AppBreadcrumb';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { getApiErrorCode } from '@/lib/api-error';
import { cn } from '@/lib/utils';

/** A `<Link>` styled as a button, so a link never wraps a `<button>`. 40px tall by default. */
export function linkButton(variant: 'default' | 'outline' | 'ghost' | 'destructive' = 'default', className?: string) {
  return cn(buttonVariants({ variant }), 'h-10 px-4', className);
}

/**
 * The way back on a booking's pages: the full trail from `sm`, one "‹ parent" link below it so a four-level trail
 * never has to scroll sideways on a phone.
 */
export function BookingBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const parent = [...items].reverse().find((item, index) => index > 0 && item.href);
  return (
    <div className="border-b border-border bg-muted/60 print:hidden">
      <div className="mx-auto flex min-h-11 max-w-marketplace items-center px-4 sm:px-6">
        {parent?.href && (
          <Link
            href={parent.href}
            className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary sm:hidden"
          >
            <ChevronLeft className="size-4" aria-hidden /> {parent.label}
          </Link>
        )}
        <div className="hidden sm:block">
          <AppBreadcrumb items={items} />
        </div>
      </div>
    </div>
  );
}

export function BookingPageLoading({ label = 'Đang tải đặt phòng…' }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-marketplace px-4 py-8 sm:px-6">
      <LoadingState rows={3} label={label} />
    </div>
  );
}

const NOT_FOUND_CODES = new Set(['BOOKING_NOT_FOUND', 'NOT_FOUND', 'FORBIDDEN']);

/** A booking that does not exist (or is not yours) reads differently from a request that failed and may work again. */
export function BookingPageError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const code = getApiErrorCode(error);
  const tripsLink = (
    <Link href="/account/bookings" className={linkButton('default')}>
      Chuyến đi của tôi
    </Link>
  );
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      {!error || (code && NOT_FOUND_CODES.has(code)) ? (
        <EmptyState
          icon={SearchX}
          title="Không tìm thấy đặt phòng"
          description="Đơn không tồn tại hoặc không thuộc tài khoản của bạn."
          action={tripsLink}
        />
      ) : (
        <ErrorState title="Không tải được đặt phòng" error={error} onRetry={onRetry} action={tripsLink} />
      )}
    </div>
  );
}
