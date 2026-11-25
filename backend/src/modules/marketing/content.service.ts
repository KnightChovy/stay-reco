import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CONTENT_VARIANTS,
  type ContentListQuery,
  type ContentVariant,
  type CreateContentInput,
  type GenerateContentInput,
  type MarketingContent,
  type RejectContentInput,
  type UpdateContentInput,
} from '@stayreco/shared';
import { z } from 'zod';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { lockMarketingContent } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import { Paginated } from '../../common/http/api-response';
import { pageArgs } from '../../common/http/pagination';
import {
  type ContentStatus,
  Prisma,
  StaffPermission,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditAction, AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BrandVoiceService } from './brand-voice.service';
import { AiService } from './ai.service';

/** What the model writes. The body is the post; the title is optional because a caption has none. */
const writtenContentSchema = z.object({
  title: z
    .string()
    .describe(
      'A short headline; an empty string when the format has no title.',
    ),
  body: z
    .string()
    .describe(
      'The post itself, ready to publish, in the hotel’s own language.',
    ),
});

/** Several versions of the same brief in one call, so staff choose rather than regenerate (A5). */
const variantsSchema = z.object({
  variants: z
    .array(writtenContentSchema)
    .min(CONTENT_VARIANTS)
    .describe(
      `Exactly ${CONTENT_VARIANTS} versions of the post, each taking a clearly different angle or opening.`,
    ),
});

/** Per-platform shaping, so a TikTok caption is not written like a blog post. */
const PLATFORM_BRIEFS: Record<string, string> = {
  FACEBOOK:
    'Facebook: 2 to 4 short paragraphs, a clear call to action at the end.',
  INSTAGRAM:
    'Instagram: under 120 words, warm, 3 to 5 relevant hashtags at the end.',
  TIKTOK: 'TikTok: under 60 words, spoken rhythm, hook in the first sentence.',
};

const TYPE_BRIEFS: Record<string, string> = {
  POST: 'A social post.',
  BLOG: 'A blog article of 300 to 500 words with a headline.',
  CAPTION: 'A caption of one or two sentences for a photo. No title.',
  PROMOTION:
    'A post built around a discount. Name the offer plainly; never invent terms, dates or prices.',
};

const SYSTEM = `You write marketing copy for one hotel, in that hotel's own voice.

Rules you must not break:
- Write in the same language as the brand voice description.
- Never invent a fact: no prices, dates, discounts, awards or amenities that the brief does not give you.
- Never promise anything about availability or refunds.
- No superlatives you cannot back up ("best in the city", "world class").
- Write as the hotel, not as an assistant describing it.`;

const notFound = () =>
  new NotFoundException({
    code: ErrorCode.CONTENT_NOT_FOUND,
    message: 'Content not found',
  });

const wrongStatus = (message: string) =>
  new ConflictException({
    code: ErrorCode.CONTENT_STATUS_CONFLICT,
    message,
  });

/**
 * What may be edited (see `ContentService.editable`). `PENDING_APPROVAL` is in front of the owner, and `PUBLISHED`
 * is on the page: changing either would make the record disagree with what the owner saw or what went out.
 */
const EDITABLE: readonly string[] = [
  'DRAFT',
  'REJECTED',
  'APPROVED',
  'SCHEDULED',
] satisfies ContentStatus[];
/** Edited from these, a piece goes back to `DRAFT` and needs the owner again. */
const REOPENS: readonly string[] = [
  'APPROVED',
  'SCHEDULED',
] satisfies ContentStatus[];

const beingPosted = () =>
  wrongStatus(
    'The piece is being posted right now; try again in a few minutes',
  );

/** Whether the publisher has claimed one of the piece's posts and is calling the platform with it now. */
const postingNow = async (
  db: PrismaService | Prisma.TransactionClient,
  contentId: string,
) =>
  (await db.contentSchedule.count({
    where: { marketingContentId: contentId, status: 'PUBLISHING' },
  })) > 0;

type ContentRow = Prisma.MarketingContentGetPayload<{
  include: {
    hotelStaff: { select: { userAccount: { select: { fullName: true } } } };
  };
}>;

const contentInclude = {
  hotelStaff: { select: { userAccount: { select: { fullName: true } } } },
} satisfies Prisma.MarketingContentInclude;

const toContent = (
  c: ContentRow,
  rejectedReason: string | null = null,
): MarketingContent => ({
  id: c.marketingContentId,
  hotelId: c.hotelId,
  contentType: c.contentType,
  status: c.status,
  title: c.title,
  body: c.body,
  mediaUrl: c.mediaUrl,
  authorName: c.hotelStaff?.userAccount.fullName ?? null,
  rejectedReason,
  createdAt: c.createdAt.toISOString(),
});

/**
 * Marketing drafts and the approval they go through (M7).
 *
 * A staff member with `MARKETING` writes and submits; the **owner** approves or rejects. Splitting the two is the
 * point: generated copy is published under the hotel's name, and a hotel should not find out what was posted after
 * the fact. A rejection carries a reason, so the writer can fix it rather than guess.
 */
@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly brandVoice: BrandVoiceService,
    private readonly access: HotelAccessService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Writes a draft in the hotel's voice. The draft is saved whatever the staff member does next. */
  async generate(
    user: AuthUser,
    hotelId: string,
    input: GenerateContentInput,
    meta: RequestMeta = {},
  ): Promise<MarketingContent> {
    const { system, prompt } = await this.promptFor(hotelId, input);
    const written = await this.ai.ask(
      {
        hotelId,
        hotelStaffId: await this.staffIdOf(user, hotelId),
        purpose: 'marketing-content',
      },
      writtenContentSchema,
      system,
      prompt,
    );
    return this.save(user, hotelId, {
      contentType: input.contentType,
      title: written.title,
      body: written.body,
      meta,
      generated: true,
    });
  }

  /**
   * Writes several versions of the same brief and saves none of them (A5).
   *
   * One model call, not three: the versions come back together, so they are told apart by angle rather than by
   * chance, and the cost is one call against the budget. Staff pick one and send it to `create`.
   */
  async variants(
    user: AuthUser,
    hotelId: string,
    input: GenerateContentInput,
  ): Promise<ContentVariant[]> {
    const { system, prompt } = await this.promptFor(hotelId, input);
    const written = await this.ai.ask(
      {
        hotelId,
        hotelStaffId: await this.staffIdOf(user, hotelId),
        purpose: 'marketing-variants',
      },
      variantsSchema,
      system,
      `${prompt}\n\nWrite ${CONTENT_VARIANTS} different versions.`,
    );
    return written.variants.slice(0, CONTENT_VARIANTS).map((v) => ({
      title: v.title.trim() || null,
      body: v.body,
    }));
  }

  /** Saves the version staff picked (or wrote) as a draft. */
  async create(
    user: AuthUser,
    hotelId: string,
    input: CreateContentInput,
    meta: RequestMeta = {},
  ): Promise<MarketingContent> {
    return this.save(user, hotelId, {
      contentType: input.contentType,
      title: input.title ?? '',
      body: input.body,
      meta,
      generated: false,
    });
  }

  private async promptFor(hotelId: string, input: GenerateContentInput) {
    const voice = await this.brandVoice.promptFor(hotelId);
    const shape = [
      TYPE_BRIEFS[input.contentType],
      input.platform ? PLATFORM_BRIEFS[input.platform] : null,
    ]
      .filter(Boolean)
      .join('\n');
    return {
      system: `${SYSTEM}\n\n${voice}`,
      prompt: `${shape}\n\nWrite about: ${input.brief}`,
    };
  }

  private async save(
    user: AuthUser,
    hotelId: string,
    draft: {
      contentType: CreateContentInput['contentType'];
      title: string;
      body: string;
      meta: RequestMeta;
      generated: boolean;
    },
  ): Promise<MarketingContent> {
    const content = await this.prisma.marketingContent.create({
      data: {
        hotelId,
        hotelStaffId: await this.staffIdOf(user, hotelId),
        contentType: draft.contentType,
        title: draft.title.trim() || null,
        body: draft.body,
        status: 'DRAFT',
      },
      include: contentInclude,
    });
    await this.audit.log(
      draft.generated
        ? AuditAction.CONTENT_GENERATED
        : AuditAction.CONTENT_CREATED,
      user.accountId,
      draft.meta,
      {
        contentId: content.marketingContentId,
        hotelId,
        contentType: draft.contentType,
      },
    );
    return toContent(content);
  }

  async list(
    hotelId: string,
    query: ContentListQuery,
  ): Promise<Paginated<MarketingContent>> {
    const where = {
      hotelId,
      ...(query.status && { status: { in: query.status } }),
      ...(query.contentType && { contentType: { in: query.contentType } }),
    } satisfies Prisma.MarketingContentWhereInput;
    const [rows, total] = await Promise.all([
      this.prisma.marketingContent.findMany({
        where,
        include: contentInclude,
        orderBy: [{ createdAt: 'desc' }, { marketingContentId: 'asc' }],
        ...pageArgs(query),
      }),
      this.prisma.marketingContent.count({ where }),
    ]);
    return Paginated.of(
      rows.map((r) => toContent(r)),
      { ...query, total },
    );
  }

  async findOne(user: AuthUser, contentId: string): Promise<MarketingContent> {
    const content = await this.owned(user, contentId, 'member');
    return toContent(content, await this.rejectionOf(contentId));
  }

  /**
   * The piece, checked to belong to the caller's hotel and to still be theirs to change.
   *
   * A draft or a rejected piece is edited in place. An approved or scheduled one may be edited too, but the edit
   * sends it back to `DRAFT` and takes it off the calendar (`saveEdit`), so it needs the owner again: what goes out
   * is still always what the owner approved. Waiting for approval, or already out, it is frozen. Shared with the
   * image service so both answer the same way rather than drifting apart.
   */
  async editable(user: AuthUser, contentId: string) {
    const content = await this.owned(user, contentId, 'member');
    if (!EDITABLE.includes(content.status)) {
      throw wrongStatus(
        content.status === 'PENDING_APPROVAL'
          ? 'The piece is waiting for the owner; it can be edited once they approve or reject it'
          : 'The piece has gone out; write a new one to say something else',
      );
    }
    if (
      content.status === 'SCHEDULED' &&
      (await postingNow(this.prisma, contentId))
    ) {
      throw beingPosted();
    }
    return content;
  }

  /**
   * Writes an edit of a piece `editable` let through, and moves it to where the edit leaves it: a rejected piece
   * back to the writer (`DRAFT`), an approved or scheduled one back to `DRAFT` with its waiting posts cancelled.
   * Shared by the words and the picture, because changing either after approval needs the owner again.
   */
  async saveEdit(
    user: AuthUser,
    content: { marketingContentId: string; hotelId: string; status: string },
    data: Prisma.MarketingContentUpdateInput,
    meta: RequestMeta = {},
  ): Promise<ContentRow> {
    const contentId = content.marketingContentId;
    const reopening = REOPENS.includes(content.status);
    const { row, cancelled } = await this.prisma.$transaction(async (tx) => {
      const cancelled = reopening ? await this.reopen(tx, contentId) : 0;
      const row = await tx.marketingContent.update({
        where: { marketingContentId: contentId },
        data: {
          ...data,
          // An edit after a rejection puts it back in the writer's hands.
          ...(content.status === 'REJECTED' && { status: 'DRAFT' as const }),
        },
        include: contentInclude,
      });
      return { row, cancelled };
    });
    if (reopening) {
      await this.audit.log(AuditAction.CONTENT_REOPENED, user.accountId, meta, {
        contentId,
        hotelId: content.hotelId,
        cancelledSchedules: cancelled,
      });
    }
    return row;
  }

  /** Edits a piece; see `editable` for which ones and what an edit after approval does. */
  async update(
    user: AuthUser,
    contentId: string,
    input: UpdateContentInput,
    meta: RequestMeta = {},
  ): Promise<MarketingContent> {
    const content = await this.editable(user, contentId);
    const updated = await this.saveEdit(
      user,
      content,
      {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.body !== undefined && { body: input.body }),
        ...(input.mediaUrl !== undefined && { mediaUrl: input.mediaUrl }),
      },
      meta,
    );
    return toContent(updated);
  }

  /**
   * Sends a draft to the owner. A piece edited after it had been approved tells the owner so, since what they
   * approved earlier is no longer what would go out.
   */
  async submit(user: AuthUser, contentId: string, meta: RequestMeta = {}) {
    const content = await this.owned(user, contentId, 'member');
    if (content.status !== 'DRAFT' && content.status !== 'REJECTED') {
      throw wrongStatus('Only a draft or a rejected piece can be submitted');
    }
    const submitted = await this.moveTo(
      user,
      contentId,
      'PENDING_APPROVAL',
      AuditAction.CONTENT_SUBMITTED,
      meta,
    );
    if (await this.wasReopened(contentId)) {
      await this.tellOwner(content);
    }
    return submitted;
  }

  /**
   * An edit after approval: cancels the posts still waiting, then sends the piece back to `DRAFT`.
   *
   * Under the row lock scheduling takes too, so a scheduling cannot slip in between. A post the publisher already
   * claimed (`PUBLISHING`) is on its way to the page and cannot be called back, so the edit is refused and the whole
   * transaction rolls back. Posts already `PUBLISHED`, `FAILED` or `CANCELLED` are left as the record they are.
   */
  private async reopen(
    tx: Prisma.TransactionClient,
    contentId: string,
  ): Promise<number> {
    await lockMarketingContent(tx, contentId);
    const { count: cancelled } = await tx.contentSchedule.updateMany({
      where: { marketingContentId: contentId, status: 'SCHEDULED' },
      data: { status: 'CANCELLED' },
    });
    if (await postingNow(tx, contentId)) throw beingPosted();
    // Conditional on the status, so a piece that went out (or changed) since it was read is not pulled back.
    const { count } = await tx.marketingContent.updateMany({
      where: {
        marketingContentId: contentId,
        status: { in: ['APPROVED', 'SCHEDULED'] },
      },
      data: { status: 'DRAFT' },
    });
    if (count === 0) {
      throw wrongStatus('The piece changed while saving; reload it');
    }
    return cancelled;
  }

  /** Whether the piece was ever sent back to the writer after an approval, read from the audit log. */
  private async wasReopened(contentId: string): Promise<boolean> {
    const entry = await this.prisma.auditLog.findFirst({
      where: {
        action: AuditAction.CONTENT_REOPENED,
        newValue: { contains: `"contentId":"${contentId}"` },
      },
      select: { auditLogId: true },
    });
    return entry !== null;
  }

  /** The in-app notice to the owner. Logged, never thrown: the submission itself has already succeeded. */
  private async tellOwner(content: ContentRow): Promise<void> {
    try {
      const hotel = await this.prisma.hotel.findUniqueOrThrow({
        where: { hotelId: content.hotelId },
        select: { hotelPartnerId: true, name: true },
      });
      const title = content.title?.trim() || 'không tiêu đề';
      await this.notifications.create({
        userAccountId: hotel.hotelPartnerId,
        type: 'SYSTEM',
        title: 'Bài marketing cần duyệt lại',
        message: `Bài «${title}» của ${hotel.name} đã được sửa sau khi duyệt, cần duyệt lại.`,
        link: null,
      });
    } catch (err) {
      this.logger.warn(
        `Could not notify the owner about content ${content.marketingContentId}: ${String(err)}`,
      );
    }
  }

  /** The owner lets it out. */
  async approve(user: AuthUser, contentId: string, meta: RequestMeta = {}) {
    const content = await this.owned(user, contentId, 'owner');
    if (content.status !== 'PENDING_APPROVAL') {
      throw wrongStatus('Only a piece waiting for approval can be approved');
    }
    return this.moveTo(
      user,
      contentId,
      'APPROVED',
      AuditAction.CONTENT_APPROVED,
      meta,
    );
  }

  /** The owner sends it back, with a reason the writer can act on. */
  async reject(
    user: AuthUser,
    contentId: string,
    input: RejectContentInput,
    meta: RequestMeta = {},
  ) {
    const content = await this.owned(user, contentId, 'owner');
    if (content.status !== 'PENDING_APPROVAL') {
      throw wrongStatus('Only a piece waiting for approval can be rejected');
    }
    return this.moveTo(
      user,
      contentId,
      'REJECTED',
      AuditAction.CONTENT_REJECTED,
      meta,
      input.reason,
    );
  }

  /** Removes a draft. Anything already approved or published stays, as the record of what went out. */
  async remove(user: AuthUser, contentId: string): Promise<void> {
    const content = await this.owned(user, contentId, 'member');
    if (content.status !== 'DRAFT' && content.status !== 'REJECTED') {
      throw wrongStatus('Only a draft or a rejected piece can be deleted');
    }
    await this.prisma.marketingContent.delete({
      where: { marketingContentId: contentId },
    });
    // The row is gone, so nothing points at the file any more. A storage failure here must not fail the delete.
    if (content.mediaStorageKey) {
      try {
        await this.storage.deleteImage(content.mediaStorageKey);
      } catch {
        // An orphaned file costs a fraction of a cent; a failed delete costs the staff member their action.
      }
    }
  }

  private async moveTo(
    user: AuthUser,
    contentId: string,
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED',
    action: AuditAction,
    meta: RequestMeta,
    reason?: string,
  ): Promise<MarketingContent> {
    const updated = await this.prisma.marketingContent.update({
      where: { marketingContentId: contentId },
      data: { status },
      include: contentInclude,
    });
    await this.audit.log(action, user.accountId, meta, {
      contentId,
      ...(reason && { reason }),
    });
    return toContent(updated, reason ?? null);
  }

  /** The reason the latest rejection gave, read back from the audit log rather than a column. */
  private async rejectionOf(contentId: string): Promise<string | null> {
    const entry = await this.prisma.auditLog.findFirst({
      where: {
        action: AuditAction.CONTENT_REJECTED,
        newValue: { contains: `"contentId":"${contentId}"` },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!entry?.newValue) return null;
    return (JSON.parse(entry.newValue) as { reason?: string }).reason ?? null;
  }

  /**
   * The piece, checked to belong to a hotel the caller may act on. A staff member also needs MARKETING, the same as
   * the routes addressed by hotel: without it, anyone on the front desk could edit, submit or delete a draft by id.
   */
  private async owned(
    user: AuthUser,
    contentId: string,
    level: 'member' | 'owner',
  ) {
    const content = isUuid(contentId)
      ? await this.prisma.marketingContent.findUnique({
          where: { marketingContentId: contentId },
          include: contentInclude,
        })
      : null;
    await this.access.assertResource(
      user,
      content?.hotelId,
      level,
      notFound,
      level === 'member' ? StaffPermission.MARKETING : undefined,
    );
    return content!;
  }

  private async staffIdOf(user: AuthUser, hotelId: string) {
    const staff = await this.prisma.hotelStaff.findFirst({
      where: { hotelStaffId: user.accountId, hotelId },
      select: { hotelStaffId: true },
    });
    return staff?.hotelStaffId ?? null;
  }
}
