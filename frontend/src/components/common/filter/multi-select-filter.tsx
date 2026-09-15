'use client';

import { ChevronDown } from 'lucide-react';

import { Badge } from '@/ui/badge';
import { Checkbox } from '@/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/ui/popover';

import type { FilterOption } from './filter-types';

type MultiSelectFilterProps = {
  label: string;
  options: FilterOption[];
  value?: string[];
  onValueChange: (value: string[]) => void;
};

export function MultiSelectFilter({
  label,
  options,
  value = [],
  onValueChange,
}: MultiSelectFilterProps) {
  return (
    <Popover>
      <PopoverTrigger className="inline-flex h-9 min-w-42 items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/35 px-3 text-sm text-foreground shadow-none hover:bg-card focus-visible:outline-none">
        <span className="truncate">{label}</span>
        <span className="ml-auto flex items-center gap-1.5">
          {value.length > 0 && (
            <Badge className="h-5 min-w-5 px-1.5">{value.length}</Badge>
          )}
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 rounded-xl p-2.5">
        <PopoverHeader className="px-1 pb-1">
          <PopoverTitle>{label}</PopoverTitle>
        </PopoverHeader>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {options.map((option) => {
            const checked = value.includes(option.value);

            return (
              <label
                key={option.value}
                className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(nextChecked) =>
                    onValueChange(
                      nextChecked
                        ? [...value, option.value]
                        : value.filter((item) => item !== option.value),
                    )
                  }
                />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {option.count}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
