'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The voucher code as a small copy control; says so when the browser refuses the clipboard. */
export function VoucherCodeCopy({ code, className }: { code: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = window.setTimeout(() => setState('idle'), state === 'failed' ? 4000 : 2000);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setState('copied');
    } catch {
      setState('failed');
    }
  };

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => void copy()}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 font-mono text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
        aria-label={state === 'copied' ? `Đã sao chép mã ${code}` : `Sao chép mã ${code}`}
      >
        {code}
        {state === 'copied' ? (
          <Check className="size-3.5 text-emerald-600" aria-hidden />
        ) : (
          <Copy className="size-3.5 text-muted-foreground" aria-hidden />
        )}
      </button>
      <span role="status" className="text-xs">
        {state === 'copied' && <span className="text-emerald-700">Đã chép</span>}
        {state === 'failed' && <span className="text-red-600">Không chép được, hãy chép thủ công</span>}
      </span>
    </span>
  );
}
