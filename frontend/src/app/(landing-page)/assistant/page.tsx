'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { AssistantChat } from '@/features/assistant/chat/AssistantChat';

/** `?c=<conversation id>` opens that conversation (the floating chat's "Mở toàn màn hình" sends it). */
function AssistantPageContent() {
  const conversationId = useSearchParams().get('c');
  return <AssistantChat layout="page" initialId={conversationId} />;
}

export default function AssistantPage() {
  return (
    <div className="flex h-dvh flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-3 py-3 sm:px-6 sm:py-5">
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Đang mở trợ lý…
            </div>
          }
        >
          <AssistantPageContent />
        </Suspense>
      </main>
    </div>
  );
}
