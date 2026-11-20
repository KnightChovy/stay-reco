'use client';

import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export function formatCountdown(milliseconds: number) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * The hold timer, sticky under the site header so it stays in view while the customer opens their bank app.
 * Screen readers hear it once a minute (and at 30 s), not every second.
 */
export function HoldCountdown({ remaining, expiresAtLabel }: { remaining: number; expiresAtLabel: string }) {
  const minutesLeft = Math.ceil(remaining / 60_000);
  const urgent = remaining <= 3 * 60_000;
  const announcement =
    remaining <= 0
      ? 'Đã hết thời gian giữ chỗ.'
      : remaining <= 30_000
        ? 'Còn dưới 30 giây giữ chỗ.'
        : `Còn khoảng ${minutesLeft} phút giữ chỗ.`;

  return (
    <div
      className={cn(
        'sticky top-16 z-20 border-b backdrop-blur lg:top-20',
        urgent ? 'border-red-200 bg-red-50/95 text-red-800' : 'border-amber-200 bg-amber-50/95 text-amber-900',
      )}
    >
      <div className="mx-auto flex max-w-marketplace items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <p className="flex min-w-0 items-center gap-2 text-sm">
          <Timer className={cn('size-5 shrink-0', urgent && 'motion-safe:animate-pulse')} aria-hidden />
          <span className="min-w-0">
            <span className="font-semibold">Phòng đang được giữ cho bạn</span>
            <span className="hidden sm:inline"> · chuyển khoản trước {expiresAtLabel}</span>
          </span>
        </p>
        <span
          className={cn(
            'shrink-0 rounded-lg px-2.5 py-1 font-mono text-lg font-bold tabular-nums',
            urgent ? 'bg-red-100' : 'bg-white/70',
          )}
          aria-hidden
        >
          {formatCountdown(remaining)}
        </span>
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
      </div>
    </div>
  );
}
