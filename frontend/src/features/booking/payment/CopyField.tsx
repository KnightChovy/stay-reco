'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * One line of the transfer details: its label, the value as shown, and a 40px copy button that copies `copyValue`
 * (e.g. the amount without its currency). Says so when the browser refuses the clipboard.
 */
export function CopyField({
  label,
  value,
  copyValue = value,
  emphasis = false,
  mono = false,
}: {
  label: string;
  value: string;
  copyValue?: string;
  emphasis?: boolean;
  mono?: boolean;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = window.setTimeout(() => setState('idle'), 2500);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copy = () => {
    if (!navigator.clipboard) {
      setState('failed');
      return;
    }
    navigator.clipboard.writeText(copyValue).then(
      () => setState('copied'),
      () => setState('failed'),
    );
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg px-3 py-2',
        emphasis ? 'bg-amber-50 ring-1 ring-amber-200 ring-inset' : 'bg-muted/60',
      )}
    >
      <div className="min-w-0">
        <span className={cn('block text-xs', emphasis ? 'font-semibold text-amber-900' : 'text-muted-foreground')}>
          {label}
        </span>
        <span
          className={cn(
            'block font-bold break-all text-foreground',
            mono && 'font-mono tracking-wide',
            emphasis ? 'text-base' : 'text-sm',
          )}
        >
          {value}
        </span>
        {state === 'failed' && (
          <span role="status" className="block text-xs font-semibold text-amber-800">
            Không chép được, hãy chép thủ công.
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-primary transition-colors hover:bg-muted"
        aria-label={state === 'copied' ? `Đã chép ${label}` : `Chép ${label}`}
      >
        {state === 'copied' ? (
          <>
            <Check className="size-4 text-emerald-600" aria-hidden /> Đã chép
          </>
        ) : (
          <>
            <Copy className="size-4" aria-hidden /> Chép
          </>
        )}
      </button>
    </div>
  );
}
