import { listQuerySchema, type ListQuery } from '@stayreco/shared';
import { zodDto } from '../pipes/validation';

/** `page`, `pageSize`, `sort`, `search` (api-guide §5). Extend the shared schema for endpoint-specific filters. */
export class ListQueryDto extends zodDto(listQuerySchema) {}

/** Prisma `skip` / `take` for a 1-based page. */
export function pageArgs({
  page,
  pageSize,
}: Pick<ListQuery, 'page' | 'pageSize'>) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
