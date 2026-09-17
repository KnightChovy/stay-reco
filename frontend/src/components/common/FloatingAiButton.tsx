'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bot, Sparkles, MessageSquare, X } from 'lucide-react';

export default function FloatingAiButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans antialiased">
      {/* Mini Tooltip Popup */}
      <div className="bg-white/95 backdrop-blur-md border border-border shadow-lg rounded-2xl p-3 text-xs max-w-xs animate-in fade-in slide-in-from-bottom-3 duration-300 hidden sm:flex items-start gap-2.5">
        <div className="size-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold mt-0.5">
          <Bot className="size-4" />
        </div>
        <div className="space-y-1 pr-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground flex items-center gap-1">
              Trợ lý AI StayReco <Sparkles className="size-3 text-amber-500" />
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Bạn cần tư vấn phòng nghỉ hợp gu hay thiết kế lịch trình? Chat ngay cùng AI!
          </p>
          <Link
            href="/assistant"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline pt-0.5"
          >
            <span>Trải nghiệm ngay</span> →
          </Link>
        </div>
      </div>

      {/* Main Floating Circle Button */}
      <Link href="/assistant" aria-label="Mở Trợ lý AI StayReco">
        <button
          type="button"
          className="group relative size-14 rounded-full bg-gradient-to-r from-primary via-[#193b56] to-[#ae583c] text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ring-4 ring-primary/20"
        >
          {/* Animated pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-primary/30 animate-ping opacity-75" />

          {/* Icon */}
          <Bot className="size-7 relative z-10 group-hover:rotate-12 transition-transform duration-300" />

          {/* Sparkle Badge */}
          <span className="absolute -top-1 -right-1 size-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-[10px] shadow-sm border border-white z-20">
            AI
          </span>
        </button>
      </Link>
    </div>
  );
}
