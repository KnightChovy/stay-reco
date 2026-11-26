import type { Prisma } from '../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * A piece stays SCHEDULED only while one of its posts is waiting, going out or out. Once every one was cancelled or
 * failed it is back to DRAFT, so the screens tell the truth and it can be edited and scheduled again. Conditional on SCHEDULED, so a piece that has been PUBLISHED meanwhile is left alone.
 *
 * A function rather than a method of `ScheduleService` because disconnecting a page cancels posts too, and
 * `SocialAccountsService` cannot depend on the schedule service that already depends on it.
 */
export async function settleContent(
  db: PrismaService | Prisma.TransactionClient,
  contentId: string,
): Promise<void> {
  const live = await db.contentSchedule.count({
    where: {
      marketingContentId: contentId,
      status: { in: ['SCHEDULED', 'PUBLISHING', 'PUBLISHED'] },
    },
  });
  if (live > 0) return;
  await db.marketingContent.updateMany({
    where: { marketingContentId: contentId, status: 'SCHEDULED' },
    data: { status: 'DRAFT' },
  });
}
