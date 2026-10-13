'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;
  ariaLabel?: string;
};

function getPageItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): PageItem[] {
  const visiblePages = siblingCount * 2 + 5;

  if (totalPages <= visiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: PageItem[] = [1];
  const start = Math.max(2, currentPage - siblingCount);
  const end = Math.min(totalPages - 1, currentPage + siblingCount);

  if (start > 2) pages.push('ellipsis-start');

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) pages.push('ellipsis-end');

  pages.push(totalPages);
  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  siblingCount = 1,
  ariaLabel = 'Phân trang',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const pageItems = getPageItems(page, totalPages, Math.max(siblingCount, 0));

  const goToPage = (nextPage: number) => {
    if (nextPage !== page && nextPage >= 1 && nextPage <= totalPages) {
      onPageChange(nextPage);
    }
  };

  return (
    <nav className={cn('flex w-full justify-center', className)} aria-label={ariaLabel}>
      <ul className="flex items-center gap-0.5 sm:gap-1">
        <li>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="size-8 rounded-md"
            aria-label="Trang trước"
          >
            <ChevronLeft
              className="size-4"
              strokeWidth={2}
              aria-hidden="true"
            />
          </Button>
        </li>

        {pageItems.map((item) =>
          typeof item !== 'number' ? (
            <li
              key={item}
              className="flex size-8 items-center justify-center"
              aria-hidden="true"
            >
              <MoreHorizontal className="size-4" strokeWidth={2} />
            </li>
          ) : (
            <li key={item}>
              <Button
                type="button"
                variant={item === page ? 'outline' : 'ghost'}
                size="icon-sm"
                onClick={() => goToPage(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={
                  item === page
                    ? `Trang ${item}, trang hiện tại`
                    : `Đi tới trang ${item}`
                }
                className={cn(
                  'size-8 rounded-md text-xs font-medium',
                  item === page
                    ? 'bg-white text-foreground shadow-[0_1px_2px_rgb(32_43_54/4%)]'
                    : 'text-foreground',
                )}
              >
                {item}
              </Button>
            </li>
          ),
        )}

        <li>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="size-8 rounded-md"
            aria-label="Trang sau"
          >
            <ChevronRight
              className="size-4"
              strokeWidth={2}
              aria-hidden="true"
            />
          </Button>
        </li>
      </ul>
    </nav>
  );
}
