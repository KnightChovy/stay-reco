"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import {
  ASSISTANT_MESSAGE_MAX,
  type AssistantHotel,
  type AssistantMessage,
  type BookingProposal,
  type ConversationSummary,
} from "@stayreco/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime, formatMoney } from "@/features/stays/lib/format";
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

export function HotelCards({ hotels, dates }: { hotels: AssistantHotel[]; dates: StayDates }) {
  if (hotels.length === 0) return null;
  return (
    <ul className="no-scrollbar -mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1" aria-label="Khách sạn trợ lý gợi ý">
      {hotels.map((hotel) => (
        <li key={hotel.id} className="w-56 shrink-0 snap-start">
          <Link
            href={hotelHref(hotel, dates)}
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md"
          >
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
            <div className="flex flex-1 flex-col gap-1 p-3">
              <p className="line-clamp-2 text-sm font-semibold text-foreground">{hotel.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" aria-hidden /> {hotel.city}
                {hotel.starRating ? ` · ${hotel.starRating} sao` : ""}
              </p>
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
        <div className="flex items-baseline justify-between border-t border-border pt-2">
          <span className="text-xs text-muted-foreground">Tổng tiền</span>
          <span className="text-lg font-bold text-primary">{formatMoney(proposal.total)}</span>
        </div>
        {booked ? (
          <Link
            href={`/account/bookings/${proposal.bookingId}`}
            className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full")}
          >
            Xem đơn đặt phòng
          </Link>
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
          <p className="text-center text-xs text-muted-foreground">Bạn sẽ chuyển sang bước thanh toán, phòng được giữ 15 phút.</p>
        )}
      </div>
    </div>
  );
}

export function MessageRow({
  message,
  dates,
  now,
  confirmingId,
  onConfirm,
}: {
  message: AssistantMessage;
  dates: StayDates;
  now: number;
  confirmingId: string | null;
  onConfirm: (proposalId: string) => void;
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
  return (
    <div className="flex items-end gap-2">
      <AssistantAvatar className="mb-0.5" />
      <div className="min-w-0 flex-1 space-y-2">
        {message.content && (
          <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-xs ring-1 ring-border">
            <ChatMarkdown content={message.content} />
          </div>
        )}
        <HotelCards hotels={message.hotels} dates={dates} />
        {message.proposal && (
          <ProposalCard
            proposal={message.proposal}
            now={now}
            pending={confirmingId === message.proposal.id}
            onConfirm={() => onConfirm(message.proposal!.id)}
          />
        )}
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex items-end gap-2" role="status" aria-live="polite">
      <AssistantAvatar />
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-card px-3.5 py-3 shadow-xs ring-1 ring-border">
        <span className="flex gap-1" aria-hidden>
          <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary" />
        </span>
        <span className="text-xs text-muted-foreground">Trợ lý đang tìm phòng và tính giá…</span>
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
        <span>{voice.error ?? "Enter để gửi · Shift + Enter để xuống dòng"}</span>
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
