'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Lightbulb, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { useSpeechInput } from './use-speech-input';

export const FOLLOW_UPS = ['Có buffet chay không?', 'Khách sạn có xe đưa đón sân bay?', 'Cách Cầu Rồng bao xa?'];

// Gợi ý chỉ hiện khi người dùng ngồi yên (không gõ, không nói) chừng này sau tin nhắn cuối.
const SUGGEST_AFTER_MS = 5000;

/** true khi đã SUGGEST_AFTER_MS mà người dùng chưa gõ, chưa nói và chưa có tin nhắn mới. */
export function useIdleSuggestions(input: string, listening: boolean, messageCount: number) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (input || listening) return;
    const t = setTimeout(() => setIdle(true), SUGGEST_AFTER_MS);
    return () => {
      clearTimeout(t);
      setIdle(false);
    };
  }, [input, listening, messageCount]);
  return idle;
}

/** Gợi ý câu hỏi nhanh như app: tiêu đề và các câu xếp dọc, bấm là gửi. */
export function QuickSuggestions({ onPick, className }: { onPick: (question: string) => void; className?: string }) {
  return (
    <div className={cn('space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300', className)}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Lightbulb className="size-4" aria-hidden="true" /> Gợi ý câu hỏi nhanh:
      </p>
      {FOLLOW_UPS.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onPick(q)}
          className="flex min-h-10 items-center gap-2 rounded-full bg-card px-3.5 py-2 text-left text-xs font-semibold text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-primary/5 sm:text-sm"
        >
          {q}
          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

/** Nút mic: bấm để nói, bấm lần nữa mới dừng. */
export function VoiceButton({ voice, className }: { voice: ReturnType<typeof useSpeechInput>; className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={voice.toggle}
      aria-label={voice.listening ? 'Dừng nghe' : 'Nói câu hỏi'}
      aria-pressed={voice.listening}
      className={cn('shrink-0 p-0', voice.listening && 'animate-pulse border-destructive bg-destructive/10 text-destructive', className)}
    >
      {voice.listening ? <Square className="size-4 fill-current" aria-hidden="true" /> : <Mic className="size-5" aria-hidden="true" />}
    </Button>
  );
}
