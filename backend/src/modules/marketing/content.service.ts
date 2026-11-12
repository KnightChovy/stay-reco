import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ContentListQuery,
  GenerateContentInput,
  MarketingContent,
  RejectContentInput,
  UpdateContentInput,
} from '@stayreco/shared';
import { z } from 'zod';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import { Paginated } from '../../common/http/api-response';
import { pageArgs } from '../../common/http/pagination';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditService } from '../audit/audit.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly brandVoice: BrandVoiceService,
    private readonly access: HotelAccessService,
    private readonly audit: AuditService,
  ) {}

  /** Writes a draft in the hotel's voice. The draft is saved whatever the staff member does next. */
  async generate(
    user: AuthUser,
    hotelId: string,
    input: GenerateContentInput,
    meta: RequestMeta = {},
  ): Promise<MarketingContent> {
    const voice = await this.brandVoice.promptFor(hotelId);
    const shape = [
      TYPE_BRIEFS[input.contentType],
      input.platform ? PLATFORM_BRIEFS[input.platform] : null,
    ]
      .filter(Boolean)
      .join('\n');

    const written = await this.ai.ask(
      {
        hotelId,
        hotelStaffId: await this.staffIdOf(user, hotelId),
        purpose: 'marketing-content',
      },
      writtenContentSchema,
      `${SYSTEM}\n\n${voice}`,
      `${shape}\n\nWrite about: ${input.brief}`,
    );

    const content = await this.prisma.marketingContent.create({
      data: {
        hotelId,
        hotelStaffId: await this.staffIdOf(user, hotelId),
        contentType: input.contentType,
        title: written.title.trim() || null,
        body: written.body,
        status: 'DRAFT',
      },
      include: contentInclude,
    });
    await this.audit.log(AuditAction.CONTENT_GENERATED, user.accountId, meta, {
      contentId: content.marketingContentId,
      hotelId,
      contentType: input.contentType,
    });
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

  /** Edits a draft. Once it is approved the text is frozen: what was approved is what goes out. */
  async update(
    user: AuthUser,
    contentId: string,
    input: UpdateContentInput,
  ): Promise<MarketingContent> {
    const content = await this.owned(user, contentId, 'member');
    if (content.status !== 'DRAFT' && content.status !== 'REJECTED') {
      throw wrongStatus('Only a draft or a rejected piece can be edited');
    }
    const updated = await this.prisma.marketingContent.update({
      where: { marketingContentId: contentId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.body !== undefined && { body: input.body }),
        ...(input.mediaUrl !== undefined && { mediaUrl: input.mediaUrl }),
        // An edit after a rejection puts it back in the writer's hands.
        ...(content.status === 'REJECTED' && { status: 'DRAFT' as const }),
      },
      include: contentInclude,
    });
    return toContent(updated);
  }

  /** Sends a draft to the owner. */
  async submit(user: AuthUser, contentId: string, meta: RequestMeta = {}) {
    const content = await this.owned(user, contentId, 'member');
    if (content.status !== 'DRAFT' && content.status !== 'REJECTED') {
      throw wrongStatus('Only a draft or a rejected piece can be submitted');
    }
    return this.moveTo(
      user,
      contentId,
      'PENDING_APPROVAL',
      AuditAction.CONTENT_SUBMITTED,
      meta,
    );
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

  /** The piece, checked to belong to a hotel the caller may act on. */
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
    await this.access.assertResource(user, content?.hotelId, level, notFound);
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
