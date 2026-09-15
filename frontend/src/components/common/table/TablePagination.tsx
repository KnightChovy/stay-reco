import Pagination from "../pagination/Pagination";


type TablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function TablePagination({ page, pageSize, total, onPageChange }: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Hiển thị <strong className="text-foreground">{start}–{end}</strong> trong tổng số{' '}
        <strong className="text-foreground">{total}</strong> bản ghi
      </p>
      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={onPageChange} className="w-auto" />
    </div>
  );
}
