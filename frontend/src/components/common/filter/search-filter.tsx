'use client';

import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SearchFilterProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchFilter({
  value,
  onValueChange,
  placeholder = 'Tìm kiếm...',
  className,
}: SearchFilterProps) {
  return (
    <div className={className ?? 'relative min-w-0 flex-1 sm:max-w-[24rem]'}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-lg border-border/80 bg-muted/35 pr-9 pl-9 text-sm shadow-none focus-visible:bg-card"
        aria-label={placeholder}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onValueChange('')}
          className="absolute top-1/2 right-1 size-7 -translate-y-1/2 rounded-md text-muted-foreground"
          aria-label="Xóa nội dung tìm kiếm"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
