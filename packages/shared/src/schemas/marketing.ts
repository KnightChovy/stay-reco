import { z } from 'zod';
import { ContentStatus, ContentType, SocialPlatform } from '../enums';
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
