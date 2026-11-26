"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowLeft, History, Loader2, Maximize2, RotateCcw, X } from "lucide-react";
import type { AssistantMessage } from "@stayreco/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSpeechInput } from "../use-speech-input";
import {
  AssistantAvatar,
  ChatComposer,
  ChatWelcome,
  ConversationList,
  MessageRow,
  TypingBubble,
} from "./ChatParts";
import { useAssistantChat } from "./use-assistant-chat";

type Layout = "panel" | "page";

/**
 * The booking assistant chat, Messenger-style: a list of conversations and one open thread. In the floating
 * `panel` the two swap places (list ↔ thread); on the `page` they sit side by side from `lg` up.
 * Talking to hotel staff is not available yet (no API): this chat is with the AI only.
 */
export function AssistantChat({
  layout,
  initialId,
  onClose,
}: {
  layout: Layout;
  initialId?: string | null;
  onClose?: () => void;
}) {
  const chat = useAssistantChat(initialId);
  const voice = useSpeechInput(chat.draft, chat.setDraft);
  const [showList, setShowList] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const messageCount = chat.messages.length;
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messageCount, chat.pendingText, chat.activeId, chat.error]);

  if (!chat.user) {
    return (
      <Frame layout={layout} onClose={onClose} title="Trợ lý AI StayReco">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <AssistantAvatar className="size-14 [&>img]:size-10" />
          <p className="text-base font-bold text-foreground">Đăng nhập để trò chuyện với trợ lý</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Trợ lý tìm phòng còn trống, so giá và chuẩn bị đơn đặt theo sở thích của bạn, rồi lưu lại lịch sử trò chuyện.
          </p>
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={cn(buttonVariants(), "h-10 px-6")}>
            Đăng nhập
          </Link>
        </div>
      </Frame>
    );
  }

  if (!chat.isCustomer) {
    return (
      <Frame layout={layout} onClose={onClose} title="Trợ lý AI StayReco">
        <p className="m-auto max-w-xs p-6 text-center text-sm text-muted-foreground">
          Trợ lý đặt phòng dành cho tài khoản khách hàng.
        </p>
      </Frame>
    );
  }

  const list = (
    <ConversationList
      conversations={chat.conversations.data ?? []}
      activeId={chat.activeId}
      loading={chat.conversations.isLoading}
      onSelect={(id) => {
        chat.setActiveId(id);
        setShowList(false);
      }}
      onNew={() => {
        chat.startNew();
        setShowList(false);
      }}
    />
  );

  const pendingMessage: AssistantMessage | null = chat.pendingText
    ? {
        id: "pending",
        role: "USER",
        content: chat.pendingText,
        hotels: [],
        proposal: null,
        cancellation: null,
        createdAt: new Date(0).toISOString(),
      }
    : null;

  const thread = (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scroller} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-muted/30 px-3 py-4 sm:px-4">
        {chat.activeId && chat.conversation.isLoading ? (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Đang mở cuộc trò chuyện…
          </p>
        ) : chat.activeId && chat.conversation.error && !chat.pendingText ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <p>Không mở được cuộc trò chuyện này.</p>
            <Button variant="outline" className="h-10 gap-1.5" onClick={() => void chat.conversation.refetch()}>
              <RotateCcw className="size-4" aria-hidden /> Thử lại
            </Button>
          </div>
        ) : messageCount === 0 && !pendingMessage ? (
          <ChatWelcome name={chat.user.name?.split(" ").pop()} onPick={chat.sendText} />
        ) : null}

        {chat.messages.map((message) => (
          <MessageRow
            key={message.id}
            message={message}
            dates={chat.dates}
            now={chat.now}
            confirmingId={chat.confirmingId}
            onConfirm={chat.confirmProposal}
            cancellingId={chat.cancellingId}
            onConfirmCancel={chat.confirmCancellation}
          />
        ))}
        {pendingMessage && (
          <>
            <MessageRow message={pendingMessage} dates={null} now={chat.now} confirmingId={null} onConfirm={() => {}} />
            <TypingBubble />
          </>
        )}
        {chat.error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="flex-1">{chat.error}</p>
            <button type="button" onClick={chat.clearError} className="text-xs font-semibold underline" aria-label="Ẩn thông báo">
              Ẩn
            </button>
          </div>
        )}
      </div>
      <div className="border-t border-border bg-card p-3">
        {chat.assistantOff ? (
          <p className="text-center text-sm text-muted-foreground">
            Trợ lý đang tạm nghỉ.{" "}
            <Link href="/search" className="font-semibold text-primary hover:underline">
              Tìm phòng thủ công
            </Link>
          </p>
        ) : (
          <ChatComposer
            value={chat.draft}
            onChange={chat.setDraft}
            onSend={() => {
              voice.cancel();
              chat.sendText(chat.draft);
            }}
            disabled={chat.sending}
            voice={voice}
            autoFocus={layout === "page"}
          />
        )}
      </div>
    </div>
  );

  if (layout === "panel") {
    return (
      <Frame
        layout="panel"
        onClose={onClose}
        title="Trợ lý AI StayReco"
        subtitle={chat.sending ? "Đang trả lời…" : "Tìm phòng · so giá · đặt phòng"}
        leading={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => setShowList((open) => !open)}
            aria-label={showList ? "Quay lại cuộc trò chuyện" : "Lịch sử trò chuyện"}
            aria-pressed={showList}
          >
            {showList ? <ArrowLeft className="size-4" /> : <History className="size-4" />}
          </Button>
        }
        trailing={
          <Link
            href={chat.activeId ? `/assistant?c=${chat.activeId}` : "/assistant"}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-9")}
            aria-label="Mở toàn màn hình"
            title="Mở toàn màn hình"
          >
            <Maximize2 className="size-4" />
          </Link>
        }
      >
        {showList ? list : thread}
      </Frame>
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <aside
        className={cn(
          "w-full shrink-0 border-r border-border lg:block lg:w-80",
          showList ? "block" : "hidden",
        )}
        aria-label="Lịch sử trò chuyện"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold text-foreground">Trò chuyện</h2>
          <Button type="button" variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowList(false)}>
            Đóng
          </Button>
        </div>
        <div className="h-[calc(100%-3.25rem)]">{list}</div>
      </aside>
      <section className={cn("min-w-0 flex-1 flex-col", showList ? "hidden lg:flex" : "flex")}>
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 lg:hidden"
            onClick={() => setShowList(true)}
            aria-label="Lịch sử trò chuyện"
          >
            <History className="size-4" />
          </Button>
          <AssistantAvatar className="size-9" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground">Trợ lý AI StayReco</h1>
            <p className="text-xs text-muted-foreground">{chat.sending ? "Đang trả lời…" : "Tìm phòng · so giá · chuẩn bị đơn đặt"}</p>
          </div>
        </header>
        <div className="min-h-0 flex-1">{thread}</div>
      </section>
    </div>
  );
}

function Frame({
  layout,
  title,
  subtitle,
  leading,
  trailing,
  onClose,
  children,
}: {
  layout: Layout;
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden bg-card",
        layout === "panel"
          ? "h-[min(40rem,calc(100dvh-7.5rem))] w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-border shadow-2xl"
          : "h-full rounded-2xl border border-border shadow-sm",
      )}
      role={layout === "panel" ? "dialog" : undefined}
      aria-label={layout === "panel" ? "Chat với Trợ lý AI StayReco" : undefined}
    >
      <header className="flex items-center gap-1.5 border-b border-border bg-primary/5 px-2 py-2">
        {leading}
        <AssistantAvatar className="ml-1 size-9" />
        <div className="ml-1 min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold text-foreground">{title}</h2>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {trailing}
        {onClose && (
          <Button type="button" variant="ghost" size="icon" className="size-9" onClick={onClose} aria-label="Đóng khung chat">
            <X className="size-4" />
          </Button>
        )}
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}
