'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { FilterOption } from './filter-types';

type SelectFilterProps = {
  label: string;
  options: FilterOption[];
  value?: string;
  onValueChange: (value: string | undefined) => void;
  allLabel?: string;
};

export function SelectFilter({
  label,
  options,
  value,
  onValueChange,
  allLabel,
}: SelectFilterProps) {
  const selectedLabel = value
    ? options.find((option) => option.value === value)?.label
    : (allLabel ?? `Tất cả ${label.toLowerCase()}`);

  return (
    <Select
      value={value || '__all__'}
      onValueChange={(nextValue) =>
        onValueChange(nextValue === '__all__' ? undefined : String(nextValue))
      }
    >
      <SelectTrigger className="h-9 min-w-42 rounded-lg border-border/80 bg-muted/35 px-3 text-sm shadow-none hover:bg-card">
        <SelectValue>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="rounded-xl p-1.5">
        <SelectItem value="__all__" className="min-h-9 px-2.5">
          {allLabel ?? `Tất cả ${label.toLowerCase()}`}
        </SelectItem>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="min-h-9 px-2.5"
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {option.count}
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
