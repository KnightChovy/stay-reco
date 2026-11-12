import { z } from 'zod';
import {
  ContentStatus,
  ContentType,
  ScheduleStatus,
  SocialPlatform,
} from '../enums';
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

/** A social page the hotel has connected. The token is never part of this: it goes in and is not read back out. */
export const socialAccountResponseSchema = z
  .object({
    id: z.uuid(),
    hotelId: z.uuid(),
    platform: z.enum(SocialPlatform),
    accountName: z.string().describe('The id the platform posts under.'),
    expiresAt: isoDateTime().nullable(),
    /** False once the token's expiry has passed; the publisher skips such an account rather than failing a post. */
    usable: z.boolean(),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'SocialAccount' });
export type SocialAccount = z.infer<typeof socialAccountResponseSchema>;

/** Step one: where to send the owner's browser so Facebook can ask them which pages we may post to. */
export const facebookAuthorizeResponseSchema = z
  .object({
    authorizeUrl: z
      .string()
      .describe('Open this in the browser. It carries a signed `state` tying the flow to this hotel.'),
  })
  .register(responseSchemas, { id: 'FacebookAuthorize' });
export type FacebookAuthorize = z.infer<typeof facebookAuthorizeResponseSchema>;

/** One page the owner administers, as offered for connecting. No token: the owner picks, then we store it. */
export const facebookPageResponseSchema = z
  .object({
    pageId: z.string().describe('The Facebook Page id, which is what `accountName` becomes.'),
    name: z.string().describe("The page's display name, so the owner can tell their pages apart."),
    /** The Instagram Business account linked to this page, when there is one; null means Instagram is not offered. */
    instagramId: z.string().nullable(),
    /** True when this hotel already posts to this page, so the UI can show "reconnect" rather than "connect". */
    connected: z.boolean(),
  })
  .register(responseSchemas, { id: 'FacebookPage' });
export type FacebookPage = z.infer<typeof facebookPageResponseSchema>;

/** Step two: the pages Facebook says this owner administers, plus the handle needed to finish connecting. */
export const facebookExchangeResponseSchema = z
  .object({
    /**
     * A short-lived, encrypted stand-in for the user access token. The token itself never reaches the browser; this
     * is handed back in step three and is useless to anyone who cannot decrypt it.
     */
    connectionToken: z.string(),
    expiresAt: isoDateTime().describe('When the connection token stops working and the owner must start again.'),
    pages: z.array(facebookPageResponseSchema),
  })
  .register(responseSchemas, { id: 'FacebookExchange' });
export type FacebookExchange = z.infer<typeof facebookExchangeResponseSchema>;

/** One approved piece of content, aimed at one page, at one time. */
export const contentScheduleResponseSchema = z
  .object({
    id: z.uuid(),
    contentId: z.uuid(),
    socialAccountId: z.uuid(),
    platform: z.enum(SocialPlatform),
    accountName: z.string(),
    title: z.string().nullable(),
    body: z.string(),
    status: z.enum(ScheduleStatus),
    scheduledAt: isoDateTime().nullable().describe('Null means at the next run of the job.'),
    publishedAt: isoDateTime().nullable(),
    /** The platform's own id for the post, once it exists; what the metrics are read against. */
    externalPostId: z.string().nullable(),
    /** Why the platform refused it, kept on the row so the calendar can say rather than only log. */
    failureReason: z.string().nullable(),
  })
  .register(responseSchemas, { id: 'ContentSchedule' });
export type ContentSchedule = z.infer<typeof contentScheduleResponseSchema>;

/** How a published post did, as the platform last reported it. */
export const contentMetricResponseSchema = z
  .object({
    id: z.uuid(),
    scheduleId: z.uuid(),
    platform: z.enum(SocialPlatform),
    views: z.number().int(),
    likes: z.number().int(),
    shares: z.number().int(),
    comments: z.number().int(),
    recordedAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'ContentMetric' });
export type ContentMetric = z.infer<typeof contentMetricResponseSchema>;
