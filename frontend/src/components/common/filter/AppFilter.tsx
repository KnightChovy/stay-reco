'use client';

import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

import { DateRangeFilter } from './date-range-filter';
import {
  type FilterDefinition,
  type FilterValue,
  type FilterValues,
  isDateRange,
} from './filter-types';
import { MultiSelectFilter } from './multi-select-filter';
import { SearchFilter } from './search-filter';
import { SelectFilter } from './select-filter';

export type { FilterDefinition, FilterOption, FilterValue, FilterValues } from './filter-types';

type AppFilterProps = {
  filters?: FilterDefinition[];
  initialValues?: FilterValues;
  initialSearch?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  variant?: 'toolbar' | 'embedded';
  debounceMs?: number;
  onSearchChange?: (query: string) => void;
  onFiltersChange?: (values: FilterValues) => void;
  onReset?: () => void;
  className?: string;
};

function countActiveFilters(values: FilterValues) {
  return Object.values(values).reduce((count, value) => {
    if (Array.isArray(value)) return count + value.length;
    if (typeof value === 'string') return count + (value ? 1 : 0);
    if (isDateRange(value)) return count + (value.from || value.to ? 1 : 0);
    return count;
  }, 0);
}

export default function AppFilter({
  filters = [],
  initialValues = {},
  initialSearch = '',
  searchPlaceholder = 'Tìm kiếm...',
  showSearch = true,
  variant = 'toolbar',
  debounceMs = 400,
  onSearchChange,
  onFiltersChange,
  onReset,
  className,
}: AppFilterProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [values, setValues] = useState<FilterValues>(initialValues);
  const debouncedSearch = useDebounce(searchQuery, debounceMs);
  const activeFilterCount = useMemo(() => countActiveFilters(values), [values]);
  const hasActiveFilters =
    (showSearch && Boolean(searchQuery.trim())) || activeFilterCount > 0;

  useEffect(() => {
    onSearchChange?.(debouncedSearch.trim());
  }, [debouncedSearch, onSearchChange]);

  const updateFilter = (key: string, value: FilterValue) => {
    const nextValues = { ...values, [key]: value };
    setValues(nextValues);
    onFiltersChange?.(nextValues);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setValues({});
    onSearchChange?.('');
    onFiltersChange?.({});
    onReset?.();
  };

  return (
    <section
      className={cn(
        'flex flex-wrap items-center gap-2',
        showSearch ? 'w-full' : 'w-auto',
        variant === 'toolbar'
          ? 'rounded-xl border border-border bg-card p-2.5 shadow-[0_1px_2px_rgb(40_48_54/3%),0_6px_18px_rgb(40_48_54/3%)]'
          : 'rounded-none border-0 bg-transparent p-0 shadow-none',
        className,
      )}
      aria-label="Bộ lọc dữ liệu"
    >
      {showSearch && (
        <SearchFilter
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder={searchPlaceholder}
        />
      )}

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-wrap items-center gap-2',
          !showSearch && 'flex-none',
        )}
      >
        {filters.map((filter) => {
          const rawValue = values[filter.key];

          if (filter.type === 'select') {
            return (
              <SelectFilter
                key={filter.key}
                label={filter.label}
                options={filter.options}
                value={typeof rawValue === 'string' ? rawValue : undefined}
                allLabel={filter.allLabel}
                onValueChange={(value) => updateFilter(filter.key, value)}
              />
            );
          }

          if (filter.type === 'multi-select') {
            return (
              <MultiSelectFilter
                key={filter.key}
                label={filter.label}
                options={filter.options}
                value={Array.isArray(rawValue) ? rawValue : []}
                onValueChange={(value) => updateFilter(filter.key, value)}
              />
            );
          }

          return (
            <DateRangeFilter
              key={filter.key}
              label={filter.label}
              placeholder={filter.placeholder}
              value={isDateRange(rawValue) ? rawValue : undefined}
              onValueChange={(value) => updateFilter(filter.key, value)}
            />
          );
        })}

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9 rounded-lg px-2.5 text-xs text-muted-foreground"
          >
            <X className="size-4" aria-hidden="true" />
            Xóa bộ lọc
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </Button>
        )}
      </div>

      {filters.length > 0 && (
        <p className="sr-only" aria-live="polite">
          <SlidersHorizontal aria-hidden="true" />
          {activeFilterCount} bộ lọc đang được áp dụng
        </p>
      )}
    </section>
  );
}
