'use client';

import { cn } from '@/lib/utils';

export type SegmentedOption<T extends string> = { value: T; label: string };

/**
 * A row of filter buttons for the account pages (notifications, vouchers, wallet). It filters a list, so it is a
 * group of pressed/unpressed buttons rather than a tablist; it scrolls sideways on narrow screens instead of wrapping.
 */
export function SegmentedFilter<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn('no-scrollbar -mx-1 overflow-x-auto px-1', className)}>
      <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                'min-h-10 shrink-0 rounded-md px-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
                active ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
