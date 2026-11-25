import { CheckCircle2, CircleDot, Clock, type LucideIcon, XCircle, CircleCheckBig } from "lucide-react";
import type { BookingSummary } from "@stayreco/shared";
import { cn } from "@/lib/utils";
import { bookingStatusText, bookingTone, type StatusTone } from "../lib/booking-status";

export const statusToneClasses: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-900 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  info: "bg-sky-50 text-sky-800 ring-sky-200",
};

const ICONS: Record<StatusTone, LucideIcon> = {
  success: CheckCircle2,
  warning: Clock,
  danger: XCircle,
  neutral: CircleCheckBig,
  info: CircleDot,
};

/** A generic pill: one tone, one icon, words that say it without the colour. */
export function TonePill({ tone, children, className }: { tone: StatusTone; children: React.ReactNode; className?: string }) {
  const Icon = ICONS[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        statusToneClasses[tone],
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

/** The one status pill of a booking: its stay and its payment together ("Đã xác nhận · Đã thanh toán"). */
export function StatusPill({
  booking,
  className,
}: {
  booking: Pick<BookingSummary, "status" | "paymentStatus">;
  className?: string;
}) {
  return (
    <TonePill tone={bookingTone(booking)} className={className}>
      {bookingStatusText(booking)}
    </TonePill>
  );
}
