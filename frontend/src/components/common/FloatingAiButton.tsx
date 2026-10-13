'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Send, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ChatMessage = {
  id: number;
  sender: 'ai' | 'user';
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    sender: 'ai',
    text: 'Chào bạn! Tôi có thể giúp bạn tìm chỗ nghỉ phù hợp.',
  },
];

export default function FloatingAiButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [isThinking, setIsThinking] = useState(false);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const question = input.trim();
    if (!question || isThinking) return;

    const messageId = Date.now();
    setMessages((previous) => [
      ...previous,
      { id: messageId, sender: 'user', text: question },
    ]);
    setInput('');
    setIsThinking(true);

    replyTimerRef.current = setTimeout(() => {
      setMessages((previous) => [
        ...previous,
        {
          id: messageId + 1,
          sender: 'ai',
          text: 'Tôi đã nhận được yêu cầu của bạn. Hãy mở Trợ lý AI để nhận gợi ý chi tiết nhé.',
        },
      ]);
      setIsThinking(false);
      replyTimerRef.current = null;
    }, 900);
  };

  return (
    <div className="group fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3 font-sans antialiased">
      {!isChatOpen && (
        <div className="pointer-events-none invisible absolute right-0 bottom-17 hidden w-72 translate-y-2 items-start gap-2.5 rounded-2xl border border-border bg-white/95 p-3 text-xs opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 sm:flex group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/15">
            <Image src="/images/logo_chatbot.png" alt="" width={28} height={28} className="size-5 object-contain" />
          </div>
          <div className="space-y-1 pr-1">
            <span className="flex items-center gap-1 font-bold text-foreground">
              Trợ lý AI StayReco <Sparkles className="size-3 text-amber-500" />
            </span>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Tìm phòng hợp gu hoặc lên lịch trình chỉ trong vài phút.
            </p>
          </div>
        </div>
      )}

      {isChatOpen && (
        <section
          className="flex h-105 w-[min(22rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          role="dialog"
          aria-label="Chat với Trợ lý AI StayReco"
        >
          <header className="flex items-center gap-3 border-b border-border bg-primary/5 px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-primary/15">
              <Image src="/images/logo_chatbot.png" alt="" width={36} height={36} className="size-7 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-foreground">Trợ lý AI StayReco</h2>
              <p className="text-[11px] text-success">Đang trực tuyến</p>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsChatOpen(false)} aria-label="Đóng khung chat">
              <X className="size-4" aria-hidden="true" />
            </Button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-3">
            {messages.map((message) => (
              <div key={message.id} className={message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <p
                  className={
                    message.sender === 'user'
                      ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-xs leading-relaxed text-primary-foreground'
                      : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-primary/15 bg-white px-3 py-2 text-xs leading-relaxed text-foreground'
                  }
                >
                  {message.text}
                </p>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-primary/15 bg-white px-3 py-2">
                  <span className="flex gap-1" aria-hidden="true">
                    <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-primary" />
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">Đang suy nghĩ...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border bg-card p-3">
            <div className="flex gap-2">
              <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhập câu hỏi..." aria-label="Nội dung tin nhắn" className="h-9 text-xs" disabled={isThinking} />
              <Button type="submit" size="icon-sm" aria-label="Gửi tin nhắn" className="size-9" disabled={isThinking}>
                <Send className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <Link href="/assistant" className="mt-2 block text-center text-[11px] font-semibold text-primary hover:underline">
              Mở Trợ lý AI đầy đủ
            </Link>
          </form>
        </section>
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setIsChatOpen((open) => !open)}
        aria-label={isChatOpen ? 'Đóng chat với Trợ lý AI' : 'Mở chat với Trợ lý AI'}
        aria-expanded={isChatOpen}
        className="group/button relative size-14 rounded-full bg-white shadow-xl ring-4 ring-primary/20 transition-all duration-300 hover:scale-105 hover:bg-primary/5 hover:shadow-2xl cursor-pointer"
      >
        <span className={`absolute -inset-1 rounded-full bg-primary/30 ${isChatOpen ? 'opacity-0' : 'animate-ping opacity-75'}`} />
        <Image
          src="/images/logo_chatbot.png"
          alt=""
          width={56}
          height={56}
          className="relative z-10 size-10 object-contain transition-transform duration-300 group-hover/button:rotate-12"
        />
        <span className="absolute -top-1 -right-1 z-20 flex size-5 items-center justify-center rounded-full border border-white bg-amber-400 text-[10px] font-bold text-amber-950 shadow-sm">
          AI
        </span>
      </Button>
    </div>
  );
}
