import { z } from 'zod';
import {
  ContentStatus,
  ContentType,
  ScheduleStatus,
  SocialPlatform,
} from '../enums';
import { listQuerySchema, repeatedQuery } from './common';

/**
 * The hotel's brand voice (M1). An owner pastes posts they are happy with and the model describes the voice; the
 * description then goes into every later prompt. Each field can also be written by hand.
 */
export const updateBrandVoiceSchema = z
  .strictObject({
    summary: z.string().trim().max(2000).nullable().optional(),
    audience: z.string().trim().max(1000).nullable().optional(),
    highlights: z.string().trim().max(1000).nullable().optional(),
    /** Words the writer must never use, comma separated. */
    forbiddenWords: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'at least one field must be given');
export type UpdateBrandVoiceInput = z.infer<typeof updateBrandVoiceSchema>;

/** `POST /hotels/:hotelId/brand-voice/learn`: the posts to read the voice out of. */
export const learnBrandVoiceSchema = z.strictObject({
  samples: z.array(z.string().trim().min(40).max(5000)).min(2).max(5),
});
export type LearnBrandVoiceInput = z.infer<typeof learnBrandVoiceSchema>;

/**
 * `POST /hotels/:hotelId/marketing-content/generate`: what to write about. The brand voice and the hotel's own
 * figures are added by the backend, so a brief can be one line.
 */
export const generateContentSchema = z.strictObject({
  contentType: z.enum(ContentType),
  /** What the post is about, in the staff member's own words. */
  brief: z.string().trim().min(5).max(500),
  /** Facebook, Instagram or TikTok; shapes the length and the tone. */
  platform: z.enum(SocialPlatform).optional(),
});
export type GenerateContentInput = z.infer<typeof generateContentSchema>;

/** `PATCH /marketing-content/:id`: the staff member edits the draft before sending it for approval. */
export const updateContentSchema = z
  .strictObject({
    title: z.string().trim().max(255).nullable().optional(),
    body: z.string().trim().min(1).max(10_000).optional(),
    mediaUrl: z.string().trim().max(500).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'at least one field must be given');
export type UpdateContentInput = z.infer<typeof updateContentSchema>;

/** `POST /marketing-content/:id/reject`: the owner says why, so the writer can fix it. */
export const rejectContentSchema = z.strictObject({
  reason: z.string().trim().min(1).max(1000),
});
export type RejectContentInput = z.infer<typeof rejectContentSchema>;

/** `GET /hotels/:hotelId/marketing-content`: newest first; `status` and `contentType` may each be repeated. */
export const contentListQuerySchema = listQuerySchema.omit({ sort: true, search: true }).extend({
  status: repeatedQuery(z.enum(ContentStatus)).optional(),
  contentType: repeatedQuery(z.enum(ContentType)).optional(),
});
export type ContentListQuery = z.infer<typeof contentListQuerySchema>;

/**
 * `POST /hotels/:hotelId/social-accounts`: connects a page the hotel already owns (M11).
 *
 * The token is pasted rather than obtained through OAuth. A Facebook or Instagram app has to be reviewed by Meta
 * before it may post on a page it does not own, and that review takes weeks and needs a live privacy policy and a
 * screencast. Pasting a long-lived page token from Graph API Explorer is the same credential by a slower route, so
 * the scheduling and publishing underneath can be finished and demonstrated now, and the OAuth screen becomes the
 * only part still missing when the app is approved.
 */
export const connectSocialAccountSchema = z.strictObject({
  platform: z.enum(SocialPlatform),
  /**
   * The id the platform posts under: a Facebook Page id, or an Instagram Business account id. Not the display
   * name - the publisher calls the API with this.
   */
  accountName: z.string().trim().min(1).max(255),
  /** A long-lived page or user access token. Stored encrypted and never read back out of the API. */
  accessToken: z.string().trim().min(10).max(4000),
  /** When the token stops working, if the platform said. A token past this is not used. */
  expiresAt: z.iso.datetime().nullable().optional(),
});
export type ConnectSocialAccountInput = z.infer<typeof connectSocialAccountSchema>;

/**
 * `POST /marketing-content/:id/schedule`: puts approved content on a calendar (M9).
 *
 * `scheduledAt` in the past, or left out, means publish at the next run of the job rather than refusing: a staff
 * member clicking "post now" and a staff member picking a time two minutes ago want the same thing.
 */
export const scheduleContentSchema = z.strictObject({
  socialAccountId: z.uuid(),
  scheduledAt: z.iso.datetime().nullable().optional(),
});
export type ScheduleContentInput = z.infer<typeof scheduleContentSchema>;

/** `GET /hotels/:hotelId/content-schedules`: the posting calendar, soonest first. */
export const scheduleListQuerySchema = listQuerySchema
  .omit({ sort: true, search: true })
  .extend({
    status: repeatedQuery(z.enum(ScheduleStatus)).optional(),
    platform: repeatedQuery(z.enum(SocialPlatform)).optional(),
    /** Only posts due on or after this instant; with `until`, the window a calendar screen shows. */
    from: z.iso.datetime().optional(),
    until: z.iso.datetime().optional(),
  });
export type ScheduleListQuery = z.infer<typeof scheduleListQuerySchema>;
