'use client';

import type { ReactNode } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type CommonTableColumn<TData> = {
  /** Identifier unique within this table. */
  id: string;
  header: ReactNode;
  cell: (row: TData, rowIndex: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
};

type CommonTableProps<TData> = {
  data: TData[];
  columns: CommonTableColumn<TData>[];
  getRowId: (row: TData, rowIndex: number) => string | number;
  onRowClick?: (row: TData, rowIndex: number) => void;
  rowClassName?: (row: TData, rowIndex: number) => string | undefined;
  isLoading?: boolean;
  loadingRowCount?: number;
  emptyMessage?: ReactNode;
  className?: string;
  tableClassName?: string;
};

const alignmentClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

export default function TableCommon<TData>({
  data,
  columns,
  getRowId,
  onRowClick,
  rowClassName,
  isLoading = false,
  loadingRowCount = 5,
  emptyMessage = 'Không có dữ liệu để hiển thị.',
  className,
  tableClassName,
}: CommonTableProps<TData>) {
  const columnCount = Math.max(columns.length, 1);

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      <Table className={tableClassName}>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  alignmentClasses[column.align ?? 'left'],
                  column.headerClassName,
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: loadingRowCount }, (_, rowIndex) => (
              <TableRow key={`loading-${rowIndex}`} aria-busy="true">
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    <Skeleton className="h-4 w-3/4" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="h-32 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow
                key={getRowId(row, rowIndex)}
                className={cn(
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(row, rowIndex),
                )}
                onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      alignmentClasses[column.align ?? 'left'],
                      column.className,
                    )}
                  >
                    {column.cell(row, rowIndex)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export { TableCommon };
