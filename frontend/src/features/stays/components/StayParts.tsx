"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CheckCircle2, ChevronDown, Info, ShieldCheck } from "lucide-react";
import type { HotelListing, RoomTypeOffer, StayQuery } from "@stayreco/shared";
import { addOnTimingLabels } from "@/features/booking/lib/booking-labels";
import { TonePill } from "@/features/booking/components/StatusPill";
import { cn } from "@/lib/utils";
import { formatDateTime, formatMoney } from "../lib/format";
import { nightsBetween } from "../lib/params";

/** The stay part of a hotel or room URL, so moving between them keeps the dates, guests and rooms. */
export function staySearch(query: StayQuery, recommendationId?: string) {
  return `checkIn=${query.checkIn ?? ""}&checkOut=${query.checkOut ?? ""}&guests=${query.guests}&rooms=${query.rooms}${recommendationId ? `&recommendationId=${encodeURIComponent(recommendationId)}` : ""}`;
}

export function stayNights(query: StayQuery) {
  return query.checkIn && query.checkOut ? nightsBetween(query.checkIn, query.checkOut) : 0;
}

/** "2 đêm · 2 khách · 1 phòng" */
export function staySummary(query: StayQuery) {
  const nights = stayNights(query);
  return `${nights > 0 ? `${nights} đêm · ` : ""}${query.guests} khách · ${query.rooms} phòng`;
}

/**
 * One availability pill per room offer, the most important fact first: no dates, sold out, too few rooms for the
 * request, too many guests, or how many are left.
 */
export function AvailabilityPill({ offer, query }: { offer: RoomTypeOffer | null; query: StayQuery }) {
  if (!offer) return <TonePill tone="neutral">Chọn ngày để xem phòng trống</TonePill>;
  if (offer.available === 0) return <TonePill tone="danger">Hết phòng cho ngày này</TonePill>;
  if (offer.available < query.rooms) return <TonePill tone="warning">Chỉ còn {offer.available} phòng</TonePill>;
  if (!offer.fitsGuests) return <TonePill tone="warning">Không đủ chỗ cho {query.guests} khách</TonePill>;
  if (offer.available <= 3) return <TonePill tone="warning">Chỉ còn {offer.available} phòng</TonePill>;
  return <TonePill tone="success">Còn {offer.available} phòng</TonePill>;
}

/** Whether this offer can be booked as asked; the reason when it cannot. */
export function offerBlocker(offer: RoomTypeOffer | null, query: StayQuery): string | null {
  if (!offer) return "Chọn ngày nhận và trả phòng để xem giá.";
  if (offer.available === 0) return "Hạng phòng này đã hết cho các ngày bạn chọn. Thử ngày khác hoặc hạng phòng khác.";
  if (offer.available < query.rooms) return `Chỉ còn ${offer.available} phòng trống, ít hơn ${query.rooms} phòng bạn cần.`;
  if (!offer.fitsGuests) return `${query.rooms} phòng không đủ chỗ cho ${query.guests} khách. Tăng số phòng hoặc chọn hạng phòng rộng hơn.`;
  return null;
}

/** The cancellation terms of an offer, in one line next to its price. */
export function CancellationLine({ offer, className }: { offer: RoomTypeOffer | null; className?: string }) {
  if (!offer) return null;
  return offer.freeCancellationUntil ? (
    <p className={cn("flex items-start gap-1.5 text-xs font-medium text-emerald-700", className)}>
      <CheckCircle2 className="mt-px size-3.5 shrink-0" aria-hidden />
      Miễn phí huỷ đến {formatDateTime(offer.freeCancellationUntil)}
    </p>
  ) : (
    <p className={cn("flex items-start gap-1.5 text-xs text-muted-foreground", className)}>
      <Info className="mt-px size-3.5 shrink-0" aria-hidden />
      Không huỷ miễn phí · phí huỷ {offer.cancellationFeePercent}% tiền phòng
    </p>
  );
}

/** The stay price exactly as the listing returns it: the total for the stay, then the per-room figure. */
export function OfferPrice({
  offer,
  query,
  align = "right",
  size = "lg",
}: {
  offer: RoomTypeOffer;
  query: StayQuery;
  align?: "left" | "right";
  size?: "lg" | "md";
}) {
  const nights = stayNights(query);
  return (
    <div className={cn(align === "right" ? "text-right" : "text-left")}>
      <p className="text-xs text-muted-foreground">
        Tổng {nights} đêm · {query.rooms} phòng
      </p>
      <p className={cn("font-bold text-primary", size === "lg" ? "text-2xl" : "text-xl")}>{formatMoney(offer.total)}</p>
      {query.rooms > 1 && <p className="text-xs text-muted-foreground">{formatMoney(offer.perRoomTotal)} / phòng</p>}
      <p className="text-xs text-muted-foreground">Đã gồm thuế và phí</p>
    </div>
  );
}

/** Long lists start short, with one control to see the rest. */
export function Collapsible({
  items,
  initial,
  render,
  moreLabel,
  className,
}: {
  items: number;
  initial: number;
  render: (limit: number) => ReactNode;
  moreLabel: (hidden: number) => string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const hidden = items - initial;
  return (
    <div className={className}>
      {render(open || hidden <= 0 ? items : initial)}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {open ? "Thu gọn" : moreLabel(hidden)}
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      )}
    </div>
  );
}

type Amenity = HotelListing["hotel"]["amenities"][number];

/** Amenities grouped by their category, the first groups shown and the rest behind "Xem tất cả". */
export function AmenityGroups({ amenities, initial = 8 }: { amenities: Amenity[]; initial?: number }) {
  if (amenities.length === 0) return <p className="text-sm text-muted-foreground">Chưa cập nhật tiện ích.</p>;
  const groups = new Map<string, Amenity[]>();
  for (const amenity of amenities) {
    const key = amenity.category || "Khác";
    groups.set(key, [...(groups.get(key) ?? []), amenity]);
  }
  const ordered = [...groups.entries()];

  return (
    <Collapsible
      items={amenities.length}
      initial={initial}
      moreLabel={() => `Xem tất cả ${amenities.length} tiện ích`}
      render={(limit) => {
        let left = limit;
        return (
          <div className="space-y-4">
            {ordered.map(([category, list]) => {
              if (left <= 0) return null;
              const shown = list.slice(0, left);
              left -= shown.length;
              return (
                <div key={category}>
                  <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{category}</h3>
                  <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((amenity) => (
                      <li key={amenity.id} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden /> {amenity.name}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        );
      }}
    />
  );
}

type AddOn = HotelListing["hotel"]["addOns"][number];

/** The hotel's add-ons, so guests know before booking what they can add (prepaid ones at /booking, the rest on site). */
export function AddOnsPreview({ addOns }: { addOns: AddOn[] }) {
  if (addOns.length === 0) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {addOns.map((addOn) => (
        <li key={addOn.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{addOn.name}</p>
            {addOn.description && <p className="text-xs text-muted-foreground">{addOn.description}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              {addOnTimingLabels[addOn.timing].label} ·{" "}
              {addOn.prebookable ? "Chọn khi đặt phòng" : "Gọi tại khách sạn, trả khi trả phòng"}
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-foreground">{formatMoney(addOn.price)}</span>
        </li>
      ))}
    </ul>
  );
}

/** A card section with an h2 and an anchor id. */
export function Section({
  id,
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  id?: string;
  title: string;
  icon?: typeof ShieldCheck;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-36 rounded-2xl border border-border bg-card p-5 shadow-2xs sm:p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          {Icon && <Icon className="size-5 text-primary" aria-hidden />} {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * The phone's booking bar: the price and the one primary action, stuck to the bottom while the page scrolls.
 * Pages add bottom padding so it never covers content.
 */
export function StickyBookingBar({ price, note, action }: { price: ReactNode; note?: ReactNode; action: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 pr-16">
        <div className="min-w-0">
          {price}
          {note && <div className="truncate text-xs text-muted-foreground">{note}</div>}
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  );
}

/** In-page jump links under the header, so a long hotel page is easy to move around. */
export function SectionNav({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <nav
      aria-label="Mục trên trang"
      className="sticky top-16 z-30 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:top-20 lg:-mx-8 lg:px-8"
    >
      <div className="no-scrollbar flex gap-1 overflow-x-auto py-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
