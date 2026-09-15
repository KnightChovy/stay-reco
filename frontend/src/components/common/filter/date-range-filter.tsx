'use client';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarDays, ChevronDown } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';

type DateRangeFilterProps = {
  label: string;
  value?: DateRange;
  onValueChange: (value: DateRange | undefined) => void;
  placeholder?: string;
};

function formatDateRange(value?: DateRange) {
  if (!value?.from) return null;
  if (!value.to) return format(value.from, 'dd/MM/yyyy');
  return `${format(value.from, 'dd/MM/yyyy')} – ${format(value.to, 'dd/MM/yyyy')}`;
}

export function DateRangeFilter({
  label,
  value,
  onValueChange,
  placeholder,
}: DateRangeFilterProps) {
  const rangeLabel = formatDateRange(value);

  return (
    <Popover>
      <PopoverTrigger className="inline-flex h-9 min-w-50 items-center gap-2 rounded-lg border border-border/80 bg-muted/35 px-3 text-sm text-foreground shadow-none hover:bg-card focus-visible:outline-none">
        <CalendarDays
          className="size-4 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span className={cn('truncate', !rangeLabel && 'text-muted-foreground')}>
          {rangeLabel ?? placeholder ?? label}
        </span>
        <ChevronDown
          className="ml-auto size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-xl p-2">
        <Calendar mode="range" selected={value} onSelect={onValueChange} locale={vi} />
      </PopoverContent>
    </Popover>
  );
}
