"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowUpRight,
  BedDouble,
  BookmarkCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  Star,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";
import {
  ASSISTANT_MESSAGE_MAX,
  type AssistantHotel,
  type AssistantMessage,
  type BookingProposal,
  type CancellationProposal,
  type ConversationSummary,
} from "@stayreco/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDate, formatDateTime, formatMoney } from "@/features/stays/lib/format";
import { useBooking } from "@/features/booking/api/booking-queries";
import { useMyWallet, usePayWithWallet } from "@/features/account/api/rewards-queries";
import { AMENITIES, STYLES } from "@/features/account/lib/preference-options";
import { StaySearchBar } from "@/features/stays/components/StaySearchBar";
import { StyleBadges } from "@/features/stays/components/StyleBadges";
import { ChatMarkdown } from "../lib/chat-markdown";
import { VoiceButton } from "../AssistantChatParts";
import type { useSpeechInput } from "../use-speech-input";

const FALLBACK_HOTEL = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=70";

export function AssistantAvatar({ className }: { className?: string }) {
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-card ring-1 ring-primary/15", className)}>
      <Image src="/images/logo_chatbot.png" alt="" width={32} height={32} className="size-6 object-contain" />
    </span>
  );
}

/** Stay dates the conversation settled on (from its latest proposal), so hotel links open with them. */
export type StayDates = { checkIn: string; checkOut: string; guests: number; rooms: number } | null;

function hotelHref(hotel: AssistantHotel, dates: StayDates) {
  if (!dates) return `/hotels/${hotel.id}`;
  const query = new URLSearchParams({
    checkIn: dates.checkIn,
    checkOut: dates.checkOut,
    guests: String(dates.guests),
    rooms: String(dates.rooms),
  });
  return `/hotels/${hotel.id}?${query}`;
}

/**
 * The hotels of a reply, side by side. The card opens the hotel (with the conversation's dates); "Đặt phòng này" asks
 * the assistant to prepare the booking, which still ends with the customer's own "Xác nhận đặt phòng".
 */
export function HotelCards({
  hotels,
  dates,
  onBook,
}: {
  hotels: AssistantHotel[];
  dates: StayDates;
  /** Asks the assistant to book this hotel; absent when nothing new can be sent from this reply. */
  onBook?: (hotel: AssistantHotel) => void;
}) {
  if (hotels.length === 0) return null;
  return (
    <ul className="no-scrollbar -mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1" aria-label="Khách sạn trợ lý gợi ý">
      {hotels.map((hotel) => (
        <li
          key={hotel.id}
          className="flex w-56 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md"
        >
          <Link href={hotelHref(hotel, dates)} className="group flex flex-1 flex-col">
            <div className="relative h-28 w-full bg-muted">
              <Image
                src={hotel.coverImageUrl ?? FALLBACK_HOTEL}
                alt={hotel.name}
                fill
                sizes="224px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {hotel.rating !== null && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-card/95 px-1.5 py-0.5 text-xs font-bold text-foreground">
                  <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden /> {hotel.rating.toFixed(1)}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">{hotel.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" aria-hidden /> {hotel.city}
                {hotel.starRating ? ` · ${hotel.starRating} sao` : ""}
              </p>
              <StyleBadges styles={hotel.styles} />
              {hotel.reason && <p className="line-clamp-2 text-xs text-emerald-700">{hotel.reason}</p>}
              <p className="mt-auto pt-1 text-sm font-bold text-primary">
                {hotel.fromTotal !== null ? (
                  <>
                    {formatMoney(hotel.fromTotal)}
                    <span className="text-xs font-normal text-muted-foreground"> · {hotel.nights} đêm</span>
                  </>
                ) : hotel.pricePerNightFrom !== null ? (
                  <>
                    Từ {formatMoney(hotel.pricePerNightFrom)}
                    <span className="text-xs font-normal text-muted-foreground"> / đêm</span>
                  </>
                ) : (
                  <span className="text-xs font-normal text-muted-foreground">Xem giá theo ngày</span>
                )}
              </p>
            </div>
          </Link>
          {onBook && (
            <div className="px-3 pb-3">
              <Button type="button" variant="outline" className="h-10 w-full" onClick={() => onBook(hotel)}>
                Đặt phòng này
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * A priced booking the assistant prepared. The assistant never books: the customer's click on "Xác nhận đặt phòng"
 * does, once, while the proposal is fresh (30 minutes).
 */
export function ProposalCard({
  proposal,
  now,
  pending,
  onConfirm,
}: {
  proposal: BookingProposal;
  now: number;
  pending: boolean;
  onConfirm: () => void;
}) {
  const booked = proposal.bookingId !== null;
  const expired = !booked && Date.parse(proposal.expiresAt) <= now;
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border border-primary/20 bg-card shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-primary/5 px-3.5 py-2.5">
        <p className="text-xs font-bold tracking-wide text-primary uppercase">Đề xuất đặt phòng</p>
        {booked ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="size-3.5" aria-hidden /> Đã đặt
          </span>
        ) : expired ? (
          <span className="text-xs font-semibold text-muted-foreground">Đã hết hạn</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden /> Giữ giá đến{" "}
            {new Date(proposal.expiresAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
      <div className="space-y-2 p-3.5 text-sm">
        <div>
          <p className="font-semibold text-foreground">{proposal.hotelName}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <BedDouble className="size-3.5" aria-hidden /> {proposal.roomTypeName} × {proposal.rooms}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden /> {formatDate(proposal.checkIn)} → {formatDate(proposal.checkOut)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden /> {proposal.guests} khách · {proposal.guestName}
          </span>
        </div>
        <p className="flex items-center gap-1 text-xs text-emerald-700">
          <ShieldCheck className="size-3.5" aria-hidden />
          {proposal.freeCancellationUntil
            ? `Huỷ miễn phí đến ${formatDateTime(proposal.freeCancellationUntil)}`
            : "Không huỷ miễn phí"}
        </p>
        {(proposal.addOns?.length || proposal.discount || proposal.points) && (
          <dl className="space-y-1 border-t border-border pt-2 text-xs">
            {proposal.addOns?.map((addOn) => (
              <div key={addOn.id} className="flex justify-between gap-2 text-muted-foreground">
                <dt>
                  {addOn.quantity} × {addOn.name}
                </dt>
                <dd>{formatMoney(addOn.amount)}</dd>
              </div>
            ))}
            {proposal.discount && (
              <div className="flex justify-between gap-2 text-emerald-700">
                <dt>
                  {proposal.discount.name}
                  {proposal.discount.code ? ` (${proposal.discount.code})` : ""}
                </dt>
                <dd>−{formatMoney(proposal.discount.amount)}</dd>
              </div>
            )}
            {proposal.points && (
              <div className="flex justify-between gap-2 text-emerald-700">
                <dt>{proposal.points.used.toLocaleString("vi-VN")} điểm StayMiles</dt>
                <dd>−{formatMoney(proposal.points.amount)}</dd>
              </div>
            )}
          </dl>
        )}
        <div className="flex items-baseline justify-between border-t border-border pt-2">
          <span className="text-xs text-muted-foreground">Tổng tiền</span>
          <span className="text-lg font-bold text-primary">{formatMoney(proposal.total)}</span>
        </div>
        {booked ? (
          <ChatPayment bookingId={proposal.bookingId!} />
        ) : expired ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Đề xuất chỉ giữ giá 30 phút. Nhắn trợ lý “báo giá lại” để có đề xuất mới.
          </p>
        ) : (
          <Button type="button" onClick={onConfirm} disabled={pending} className="h-10 w-full gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Xác nhận đặt phòng
          </Button>
        )}
        {!booked && !expired && (
          <p className="text-center text-xs text-muted-foreground">
            Sau khi xác nhận, mã QR chuyển khoản hiện ngay tại đây; phòng được giữ 15 phút.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Paying a booking made in the chat, without leaving it: while it waits for payment, the VietQR of the transfer
 * (amount and content filled in) and the wallet button; once paid, a line saying so. Polls like the payment page,
 * so a transfer that lands shows here within seconds. The full payment page stays one link away.
 */
function ChatPayment({ bookingId }: { bookingId: string }) {
  const bookingQuery = useBooking(bookingId, { poll: true });
  const walletQuery = useMyWallet();
  const payWithWallet = usePayWithWallet();
  const booking = bookingQuery.data;
  const detailsLink = (
    <Link href={`/account/bookings/${bookingId}`} className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full")}>
      Xem đơn đặt phòng
    </Link>
  );
  if (!booking) {
    return bookingQuery.isLoading ? (
      <p className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden /> Đang tải thông tin thanh toán…
      </p>
    ) : (
      detailsLink
    );
  }
  const payment = booking.payment;
  if (booking.status !== "PENDING" || !payment) {
    const paid = booking.paymentStatus === "PAID";
    return (
      <div className="space-y-2">
        {paid && (
          <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="size-4" aria-hidden /> Đã thanh toán. Mã đặt phòng {booking.code}.
          </p>
        )}
        {detailsLink}
      </div>
    );
  }
  const balance = walletQuery.data?.balanceAvailable ?? 0;
  const canWallet = balance >= payment.amount;
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-semibold text-foreground">
        Chuyển khoản trước {new Date(payment.expiresAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} để
        giữ phòng
      </p>
      <a href={payment.qrImageUrl} target="_blank" rel="noreferrer" className="mx-auto block w-44">
        {/* A third-party VietQR image (qr.sepay.vn): a plain img, as on the payment page. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={payment.qrImageUrl} alt={`Mã QR chuyển khoản ${formatMoney(payment.amount)}`} className="w-44 rounded-md bg-white" />
      </a>
      <dl className="space-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Ngân hàng</dt>
          <dd className="text-right font-medium">{payment.bankName}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Số tài khoản</dt>
          <dd className="font-mono font-medium select-all">{payment.accountNumber}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Chủ tài khoản</dt>
          <dd className="text-right font-medium">{payment.accountName}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Số tiền</dt>
          <dd className="font-bold text-primary">{formatMoney(payment.amount)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Nội dung</dt>
          <dd className="font-mono font-bold select-all">{payment.transferContent}</dd>
        </div>
      </dl>
      {canWallet && (
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full"
          disabled={payWithWallet.isPending}
          onClick={() => payWithWallet.mutate(booking.id)}
        >
          {payWithWallet.isPending && <Loader2 className="size-4 animate-spin" />}
          Trả bằng ví ({formatMoney(balance)})
        </Button>
      )}
      {payWithWallet.error && (
        <p role="alert" className="text-xs text-destructive">
          {getApiErrorMessage(payWithWallet.error, "Không trả được bằng ví. Vui lòng chuyển khoản.")}
        </p>
      )}
      <Link
        href={`/booking/payment?id=${booking.id}`}
        className="block text-center text-xs font-semibold text-primary underline-offset-2 hover:underline"
      >
        Mở trang thanh toán đầy đủ
      </Link>
    </div>
  );
}

/**
 * A cancellation the assistant priced: what was paid, the fee, the refund and whether the hotel must approve it.
 * The assistant never cancels: the customer's click on "Xác nhận huỷ" does, once, while the proposal is fresh.
 */
export function CancellationCard({
  proposal,
  now,
  pending,
  onConfirm,
}: {
  proposal: CancellationProposal;
  now: number;
  pending: boolean;
  onConfirm: () => void;
}) {
  const done = proposal.outcome !== null;
  const expired = !done && Date.parse(proposal.expiresAt) <= now;
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border border-destructive/25 bg-card shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-destructive/5 px-3.5 py-2.5">
        <p className="text-xs font-bold tracking-wide text-destructive uppercase">Đề xuất huỷ phòng</p>
        {done ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="size-3.5" aria-hidden />
            {proposal.outcome === "REFUND_PENDING" ? "Chờ khách sạn duyệt hoàn tiền" : "Đã huỷ"}
          </span>
        ) : expired ? (
          <span className="text-xs font-semibold text-muted-foreground">Đã hết hạn</span>
        ) : null}
      </div>
      <div className="space-y-2 p-3.5 text-sm">
        <div>
          <p className="font-semibold text-foreground">{proposal.hotelName}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden /> {formatDate(proposal.checkIn)} → {formatDate(proposal.checkOut)} ·{" "}
            {proposal.bookingCode}
          </p>
        </div>
        <dl className="space-y-1 border-t border-border pt-2 text-xs">
          <div className="flex justify-between gap-2 text-muted-foreground">
            <dt>Đã thanh toán</dt>
            <dd>{formatMoney(proposal.paid)}</dd>
          </div>
          <div className="flex justify-between gap-2 text-muted-foreground">
            <dt>Phí huỷ</dt>
            <dd>{proposal.fee > 0 ? `−${formatMoney(proposal.fee)}` : "Miễn phí"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2 pt-1">
            <dt className="font-semibold text-foreground">Được hoàn về ví</dt>
            <dd className="text-base font-bold text-primary">{formatMoney(proposal.refund)}</dd>
          </div>
        </dl>
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {proposal.refund > 0
            ? proposal.needsApproval
              ? "Tiền hoàn về ví StayReco sau khi khách sạn duyệt yêu cầu. Phòng vẫn giữ cho bạn tới lúc đó."
              : "Tiền hoàn về ví StayReco ngay khi huỷ."
            : "Theo chính sách huỷ, đơn này không được hoàn tiền."}
          {proposal.freeUntil && ` Huỷ miễn phí đến ${formatDateTime(proposal.freeUntil)}.`}
        </p>
        {done ? (
          <Link href={`/account/bookings/${proposal.bookingId}`} className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full")}>
            Xem đơn đặt phòng
          </Link>
        ) : expired ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Đề xuất chỉ có hiệu lực 30 phút. Nhắn trợ lý “huỷ lại đơn {proposal.bookingCode}” để tính lại.
          </p>
        ) : (
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending} className="h-10 w-full gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Xác nhận huỷ
          </Button>
        )}
      </div>
    </div>
  );
}

/** What the customer can do from an answer of the assistant; only the latest answer takes new input. */
export type ReplyActions = {
  /** Sends a message as if typed: a quick reply, "Đặt phòng này", the trip picker. */
  onSend: (text: string) => void;
  onRate: (messageId: string, value: "UP" | "DOWN" | null, previous: "UP" | "DOWN" | null) => void;
  /** Nothing new can be sent while a reply is being written. */
  busy: boolean;
};

export function MessageRow({
  message,
  dates,
  now,
  confirmingId,
  onConfirm,
  cancellingId = null,
  onConfirmCancel = () => {},
  latest = false,
  actions,
}: {
  message: AssistantMessage;
  dates: StayDates;
  now: number;
  confirmingId: string | null;
  onConfirm: (proposalId: string) => void;
  cancellingId?: string | null;
  onConfirmCancel?: (proposalId: string) => void;
  /** The last message of the conversation: its quick replies and trip picker are still live. */
  latest?: boolean;
  actions?: ReplyActions;
}) {
  if (message.role === "SYSTEM") {
    return (
      <p className="mx-auto max-w-[85%] rounded-full bg-muted px-3 py-1.5 text-center text-xs text-muted-foreground">
        {message.content}
      </p>
    );
  }
  if (message.role === "USER") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground">
          {message.content}
        </div>
      </div>
    );
  }
  const live = latest && actions && !actions.busy ? actions : null;
  return (
    <div className="flex items-end gap-2">
      <AssistantAvatar className="mb-0.5" />
      <div className="min-w-0 flex-1 space-y-2">
        {message.content && (
          <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-xs ring-1 ring-border">
            <ChatMarkdown content={message.content} />
          </div>
        )}
        <HotelCards
          hotels={message.hotels}
          dates={dates}
          onBook={live ? (hotel) => live.onSend(`Mình muốn đặt phòng ở ${hotel.name}`) : undefined}
        />
        {message.proposal && (
          <ProposalCard
            proposal={message.proposal}
            now={now}
            pending={confirmingId === message.proposal.id}
            onConfirm={() => onConfirm(message.proposal!.id)}
          />
        )}
        {message.cancellation && (
          <CancellationCard
            proposal={message.cancellation}
            now={now}
            pending={cancellingId === message.cancellation.id}
            onConfirm={() => onConfirmCancel(message.cancellation!.id)}
          />
        )}
        {message.remembered && <RememberedCard remembered={message.remembered} />}
        {live && message.askTrip && <TripPicker ask={message.askTrip} onSend={live.onSend} />}
        {live && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Gợi ý trả lời">
            {message.suggestions.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => live.onSend(text)}
                className="min-h-10 rounded-full border border-primary/30 bg-card px-3.5 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                {text}
              </button>
            ))}
          </div>
        )}
        {actions && message.content && (
          <Feedback value={message.feedback} onRate={(value) => actions.onRate(message.id, value, message.feedback)} />
        )}
      </div>
    </div>
  );
}

/**
 * What the assistant saved to the customer's preferences from what they said: the same preferences the account page
 * edits and the recommendations follow, so the card links to both.
 */
function RememberedCard({ remembered }: { remembered: NonNullable<AssistantMessage["remembered"]> }) {
  const items = [
    ...remembered.travelStyles.map((id) => STYLES.find((s) => s.id === id)?.title ?? id),
    ...remembered.cities,
    ...remembered.roomAmenities.map((id) => AMENITIES.find((a) => a.id === id)?.label ?? id),
    ...(remembered.budgetPerNight ? [`dưới ${formatMoney(remembered.budgetPerNight)}/đêm`] : []),
  ];
  return (
    <div className="max-w-sm space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
      <p className="flex items-center gap-1.5 font-semibold">
        <BookmarkCheck className="size-4 text-emerald-700" aria-hidden /> Đã ghi nhớ sở thích của bạn
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item} className="rounded-full bg-card px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-emerald-200">
            {item}
          </li>
        ))}
      </ul>
      <p className="text-xs">Gợi ý cho bạn sẽ theo những điều này từ giờ.</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/recommendations" className="inline-flex min-h-10 items-center text-xs font-semibold text-emerald-800 hover:underline">
          Xem gợi ý cho bạn →
        </Link>
        <Link href="/account/preferences" className="inline-flex min-h-10 items-center text-xs font-semibold text-emerald-800 hover:underline">
          Sửa sở thích
        </Link>
      </div>
    </div>
  );
}

/** 👍 / 👎 under an answer; pressing the chosen one again takes it back. */
function Feedback({
  value,
  onRate,
}: {
  value: AssistantMessage["feedback"];
  onRate: (value: "UP" | "DOWN" | null) => void;
}) {
  const choices = [
    { id: "UP" as const, Icon: ThumbsUp, label: "Câu trả lời hữu ích" },
    { id: "DOWN" as const, Icon: ThumbsDown, label: "Câu trả lời chưa tốt" },
  ];
  return (
    <div className="flex items-center gap-1">
      {choices.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          title={label}
          aria-pressed={value === id}
          onClick={() => onRate(value === id ? null : id)}
          className={cn(
            "grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            value === id && "text-primary",
          )}
        >
          <Icon className={cn("size-4", value === id && "fill-primary/20")} aria-hidden />
        </button>
      ))}
      {value && <span className="text-xs text-muted-foreground">Cảm ơn bạn đã góp ý</span>}
    </div>
  );
}

/**
 * The assistant needs the dates and guests: the site's own stay search, filled with what it already knows, answers
 * with a message in words ("Mình muốn ở Đà Lạt từ 12/12/2026 đến 14/12/2026, 2 khách, 1 phòng.").
 */
function TripPicker({ ask, onSend }: { ask: NonNullable<AssistantMessage["askTrip"]>; onSend: (text: string) => void }) {
  return (
    <div className="max-w-sm">
      <StaySearchBar
        stacked
        initialDestination={ask.destination ?? ""}
        initialCheckIn={ask.checkIn ?? undefined}
        initialCheckOut={ask.checkOut ?? undefined}
        initialGuests={ask.guests ?? undefined}
        submitLabel="Gửi cho trợ lý"
        onSearch={(trip) =>
          onSend(
            `Mình muốn ở ${trip.destination} từ ${formatDate(trip.checkIn)} đến ${formatDate(trip.checkOut)}, ${trip.guests} khách, ${trip.rooms} phòng.`,
          )
        }
      />
    </div>
  );
}

/** A line the server takes off the stored reply: an internal note in brackets. */
const isNote = (line: string) => line.trim().startsWith("[") && line.trim().endsWith("]");

/**
 * The reply while it is written. The quick-reply line (`>> …`) and internal notes are taken off the stored reply by
 * the server; while streaming they are hidden here, so they never flash on screen.
 */
export function StreamingBubble({ text }: { text: string }) {
  const lines = text.split("\n");
  const cut = lines.findIndex((line) => line.trim().startsWith(">"));
  const shown = (cut === -1 ? lines : lines.slice(0, cut))
    .filter((line) => !isNote(line))
    .join("\n")
    .trim();
  return (
    <div className="flex items-end gap-2" aria-live="polite">
      <AssistantAvatar className="mb-0.5" />
      <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-xs ring-1 ring-border">
        <ChatMarkdown content={shown} />
        <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-primary/60 align-text-bottom" aria-hidden />
      </div>
    </div>
  );
}

export function TypingBubble({ status }: { status?: string | null }) {
  return (
    <div className="flex items-end gap-2" role="status" aria-live="polite">
      <AssistantAvatar />
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-card px-3.5 py-3 shadow-xs ring-1 ring-border">
        <span className="flex gap-1" aria-hidden>
          <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary" />
        </span>
        <span className="text-xs text-muted-foreground">{status ?? "Trợ lý đang suy nghĩ…"}</span>
      </div>
    </div>
  );
}

export const STARTERS = [
  "Tìm khách sạn ở Đà Nẵng cho 2 người cuối tuần này",
  "Gợi ý chỗ nghỉ hợp với sở thích của tôi",
  "Khách sạn gần biển, có hồ bơi, dưới 2 triệu/đêm",
  "Đặt giúp tôi 1 phòng ở Hà Nội từ thứ Sáu đến Chủ nhật",
];

/** What an empty conversation shows: who the assistant is, what it can do, and a few ways to start. */
export function ChatWelcome({ name, onPick }: { name?: string; onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <AssistantAvatar className="size-14 [&>img]:size-10" />
      <div className="space-y-1">
        <p className="text-base font-bold text-foreground">Xin chào{name ? ` ${name}` : ""}!</p>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          Mình là trợ lý đặt phòng của StayReco: tìm phòng còn trống, so sánh giá và chuẩn bị đơn đặt cho bạn.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {STARTERS.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-card px-3.5 py-2 text-left text-sm font-medium text-foreground shadow-xs ring-1 ring-border transition-colors hover:bg-primary/5 hover:ring-primary/30"
          >
            {text}
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Trợ lý không tự đặt phòng: bạn luôn là người bấm xác nhận.</p>
    </div>
  );
}

/** Enter sends, Shift+Enter breaks the line; grows up to five lines. */
export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
  voice,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  voice: ReturnType<typeof useSpeechInput>;
  autoFocus?: boolean;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSend();
    }
  };
  const near = value.length > ASSISTANT_MESSAGE_MAX * 0.8;

  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-2">
        <VoiceButton voice={voice} className="size-10 rounded-full" />
        <label className="sr-only" htmlFor="assistant-input">
          Tin nhắn cho trợ lý
        </label>
        <textarea
          id="assistant-input"
          ref={area}
          rows={1}
          value={value}
          maxLength={ASSISTANT_MESSAGE_MAX}
          autoFocus={autoFocus}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={voice.listening ? "Đang nghe, bạn nói đi…" : "Nhắn cho trợ lý…"}
          className="min-h-10 flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5 text-base leading-5 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 sm:text-sm"
        />
        <Button
          type="button"
          size="icon"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Gửi tin nhắn"
          className="size-10 shrink-0 rounded-full"
        >
          <Send className="size-4" aria-hidden />
        </Button>
      </div>
      <div className="flex justify-between px-1 text-xs text-muted-foreground">
        <span>{voice.error ?? "Trợ lý AI có thể nhầm. Hãy kiểm tra giá và ngày trước khi xác nhận."}</span>
        {near && (
          <span>
            {value.length}/{ASSISTANT_MESSAGE_MAX}
          </span>
        )}
      </div>
    </div>
  );
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  loading,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-3">
        <Button type="button" variant="outline" onClick={onNew} className="h-10 w-full justify-start gap-2">
          <MessageSquarePlus className="size-4" aria-hidden /> Cuộc trò chuyện mới
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Đang tải lịch sử…
          </p>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">Chưa có cuộc trò chuyện nào.</p>
        ) : (
          <ul className="space-y-0.5" aria-label="Các cuộc trò chuyện">
            {conversations.map((conversation) => {
              const active = conversation.id === activeId;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                      active ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <AssistantAvatar className="mt-0.5 size-9 [&>img]:size-6" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">Trợ lý AI StayReco</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.updatedAt), { locale: vi, addSuffix: false })}
                        </span>
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">{conversation.preview}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
