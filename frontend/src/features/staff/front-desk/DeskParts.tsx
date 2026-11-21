"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight, Loader2, ScanLine, Search, type LucideIcon } from "lucide-react";
import type { BookingSummary } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { QrScannerDialog } from "@/features/staff/components/QrScannerDialog";
import { cn } from "@/lib/utils";
import { dateInput } from "@/features/stays/lib/params";
import { formatCalendarDate, toneClasses, type StatusTone } from "@/features/staff/lib/labels";

/** Page title block shared by check-in and check-out. */
export function DeskHeader({
  icon: Icon,
  title,
  description,
  hotelName,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  hotelName?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Icon className="size-6 text-primary" aria-hidden /> {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {hotelName && <span className="text-xs font-semibold text-muted-foreground">{hotelName}</span>}
    </div>
  );
}

/** A small status pill with a text label (never colour alone). */
export function TonePillText({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Type a code, paste a QR token or scan it. One primary button ("Tìm đơn"); the scanner is secondary. */
export function LookupBar({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  loading: boolean;
  placeholder: string;
}) {
  const [scannerOpen, setScannerOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(value);
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-label="Mã đơn hoặc token QR"
            autoComplete="off"
            className="h-11 pl-9 text-sm"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          aria-label="Quét mã QR"
          onClick={() => setScannerOpen(true)}
        >
          <ScanLine className="size-5" />
        </Button>
        <Button type="submit" disabled={!value.trim() || loading} className="h-11 shrink-0 gap-1.5 px-5">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Tìm đơn
        </Button>
      </form>
      <QrScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onResult={(token) => {
          onChange(token);
          onSubmit(token);
        }}
      />
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{children}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Sticky on small screens: the one primary action of the page is always in reach. */
export function StickyActionBar({ info, children }: { info?: ReactNode; children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 flex items-center gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur md:-mx-5 md:px-5 xl:-mx-6 xl:px-6">
      <div className="min-w-0 flex-1 text-sm text-muted-foreground">{info}</div>
      {children}
    </div>
  );
}

export type DeskRowGroup = { title: string; rows: BookingSummary[]; tone: StatusTone };

/** Row of a list of bookings to pick from: guest, code, what, and one pill. */
export function DeskRow({ booking, pill, onPick }: { booking: BookingSummary; pill: ReactNode; onPick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{booking.guestName}</span>
          <span className="block truncate text-xs text-muted-foreground">
            <span className="font-mono">{booking.code}</span> · {booking.roomType.name} · {booking.rooms} phòng ·{" "}
            {formatCalendarDate(booking.checkIn)} → {formatCalendarDate(booking.checkOut)}
          </span>
        </span>
        {pill}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </li>
  );
}

export function DeskListShell({
  title,
  loading,
  error,
  onRetry,
  empty,
  groups,
  renderPill,
  onPick,
  footer,
}: {
  title: string;
  loading: boolean;
  error?: unknown;
  onRetry: () => void;
  empty: { title: string; description: string };
  groups: DeskRowGroup[];
  renderPill: (booking: BookingSummary, group: DeskRowGroup) => ReactNode;
  onPick: (booking: BookingSummary) => void;
  footer?: ReactNode;
}) {
  const nonEmpty = groups.filter((group) => group.rows.length > 0);
  return (
    <section className="space-y-3" aria-label={title}>
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      {error ? (
        <ErrorState title="Không tải được danh sách" error={error} onRetry={onRetry} />
      ) : loading ? (
        <LoadingState rows={3} />
      ) : nonEmpty.length === 0 ? (
        <EmptyState title={empty.title} description={empty.description} />
      ) : (
        <div className="space-y-4">
          {nonEmpty.map((group) => (
            <div key={group.title} className="rounded-xl border border-border bg-card p-1.5">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title} ({group.rows.length})
              </p>
              <ul>
                {group.rows.map((booking) => (
                  <DeskRow
                    key={booking.id}
                    booking={booking}
                    pill={renderPill(booking, group)}
                    onPick={() => onPick(booking)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {footer}
    </section>
  );
}

/** Whole days between two `YYYY-MM-DD` dates (calendar days, not money). */
export function daysBetween(from: string, to: string) {
  return Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000);
}

export const todayDate = () => dateInput(0);
