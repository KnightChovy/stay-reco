import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import type { PageMeta } from '@stayreco/shared';

/** Danh sách có phân trang của API (`page` từ 1, `meta.totalPages`), tải thêm từng trang bằng `loadMore`. */
export function usePagedList<T>(
  queryKey: QueryKey,
  fetchPage: (page: number) => Promise<{ items: T[]; meta: PageMeta }>,
  enabled = true,
) {
  const q = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled,
  });
  return {
    items: q.data?.pages.flatMap((p) => p.items),
    total: q.data?.pages[0]?.meta.total,
    hasMore: q.hasNextPage,
    loadingMore: q.isFetchingNextPage,
    loadMore: () => void q.fetchNextPage(),
    isError: q.isError,
    refetch: () => void q.refetch(),
  };
}
