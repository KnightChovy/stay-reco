import { z } from 'zod';
import { ContentStatus, ContentType } from '../enums';
import { isoDateTime, responseSchemas } from './registry';

/** The brand voice every generated post is written in. */
export const brandVoiceResponseSchema = z
  .object({
    summary: z.string().nullable().describe('How this hotel writes; null until it has been set up.'),
    audience: z.string().nullable(),
    highlights: z.string().nullable(),
    forbiddenWords: z.string().nullable(),
    updatedAt: isoDateTime().nullable(),
  })
  .register(responseSchemas, { id: 'BrandVoice' });
export type BrandVoice = z.infer<typeof brandVoiceResponseSchema>;

/** What a hotel has spent on the AI writer this calendar month, and what is left. */
export const aiBudgetResponseSchema = z
  .object({
    spentUsd: z.number(),
    limitUsd: z.number(),
    remainingUsd: z.number().describe('Never below 0; at 0 the writer refuses with AI_BUDGET_EXCEEDED.'),
  })
  .register(responseSchemas, { id: 'AiBudget' });
export type AiBudget = z.infer<typeof aiBudgetResponseSchema>;

/** A draft, or a published post, as the marketing screens show it. */
export const marketingContentResponseSchema = z
  .object({
    id: z.uuid(),
    hotelId: z.uuid(),
    contentType: z.enum(ContentType),
    status: z.enum(ContentStatus),
    title: z.string().nullable(),
    body: z.string(),
    mediaUrl: z.string().nullable(),
    authorName: z.string().nullable().describe('The staff member who asked for it; null when the owner did.'),
    /** Why it was rejected, from the audit log; null unless the status is REJECTED. */
    rejectedReason: z.string().nullable(),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'MarketingContent' });
export type MarketingContent = z.infer<typeof marketingContentResponseSchema>;

/** Something worth posting about, found in the hotel's own figures rather than asked of the user. */
export const contentIdeaResponseSchema = z
  .object({
    kind: z.enum(['FREE_ROOMS', 'PROMOTION', 'GREAT_REVIEW']),
    brief: z.string().describe('Ready to send straight back as the brief of a generate call.'),
    detail: z.string().describe('The figure behind it, so staff can see why it was suggested.'),
  })
  .register(responseSchemas, { id: 'ContentIdea' });
export type ContentIdea = z.infer<typeof contentIdeaResponseSchema>;
