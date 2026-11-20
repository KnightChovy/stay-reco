import type { Booking } from "@stayreco/shared";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/features/stays/lib/format";
import { bookingEventLabel } from "../lib/booking-labels";

const DANGER = new Set(["EXPIRED", "CANCELLED", "NO_SHOW", "REFUND_REJECTED", "CHANGE_REJECTED"]);
const DONE = new Set(["PAID", "CHECKED_IN", "COMPLETED", "REFUND_APPROVED", "CHANGE_ACCEPTED"]);

/** The milestones of a booking, oldest first, with their date and time (`Booking.timeline`). */
export function BookingTimeline({ timeline, className }: { timeline: Booking["timeline"]; className?: string }) {
  if (timeline.length === 0) {
    return <p className={cn("text-xs text-muted-foreground", className)}>Chưa có cập nhật.</p>;
  }
  return (
    <ol className={cn("relative space-y-4 border-l border-border pl-5 text-xs", className)}>
      {timeline.map((entry, index) => (
        <li key={`${entry.at}-${entry.event}-${index}`} className="relative">
          <span
            className={cn(
              "absolute -left-[25px] top-0.5 size-2.5 rounded-full ring-4 ring-background",
              DANGER.has(entry.event) ? "bg-red-500" : DONE.has(entry.event) ? "bg-emerald-600" : "bg-primary",
            )}
            aria-hidden
          />
          <p className="font-semibold text-foreground">{bookingEventLabel(entry.event)}</p>
          <p className="text-[11px] text-muted-foreground">{formatDateTime(entry.at)}</p>
        </li>
      ))}
    </ol>
  );
}
