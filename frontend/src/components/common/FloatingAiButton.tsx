'use client';

import { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssistantChat } from '@/features/assistant/chat/AssistantChat';

/**
 * The chat bubble on every customer page: opens the booking assistant over the page, keeps the last conversation
 * and can expand to /assistant. Hidden on /assistant itself, where the chat is the page.
 */
export default function FloatingAiButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (pathname === '/assistant') return null;

  return (
    <div className="group fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 font-sans antialiased sm:right-6 sm:bottom-6 print:hidden">
      {!open && (
        <div className="pointer-events-none invisible absolute right-0 bottom-17 hidden w-72 translate-y-2 items-start gap-2.5 rounded-2xl border border-border bg-card/95 p-3 text-xs opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 sm:flex group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-primary/15">
            <Image src="/images/logo_chatbot.png" alt="" width={28} height={28} className="size-5 object-contain" />
          </div>
          <div className="space-y-1 pr-1">
            <span className="flex items-center gap-1 font-bold text-foreground">
              Trợ lý AI StayReco <Sparkles className="size-3 text-amber-500" />
            </span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Hỏi phòng trống, so giá và chuẩn bị đơn đặt ngay trong khung chat.
            </p>
          </div>
        </div>
      )}

      {open && <AssistantChat layout="panel" onClose={() => setOpen(false)} />}

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Đóng chat với Trợ lý AI' : 'Mở chat với Trợ lý AI'}
        aria-expanded={open}
        className="group/button relative size-14 cursor-pointer rounded-full bg-card shadow-xl ring-4 ring-primary/20 transition-all duration-300 hover:scale-105 hover:bg-primary/5 hover:shadow-2xl"
      >
        <span className={`absolute -inset-1 rounded-full bg-primary/30 ${open ? 'opacity-0' : 'animate-ping opacity-75'}`} />
        <Image
          src="/images/logo_chatbot.png"
          alt=""
          width={56}
          height={56}
          className="relative z-10 size-10 object-contain transition-transform duration-300 group-hover/button:rotate-12"
        />
        <span className="absolute -top-1 -right-1 z-20 flex size-5 items-center justify-center rounded-full border border-card bg-amber-400 text-xs font-bold text-amber-950 shadow-sm">
          AI
        </span>
      </Button>
    </div>
  );
}
