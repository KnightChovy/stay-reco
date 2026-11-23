import { z } from 'zod';

/** Longest message a customer can send the assistant; a question, not a document. */
export const ASSISTANT_MESSAGE_MAX = 2000;

/** `POST /me/conversations` and `POST /conversations/:id/messages`: what the customer typed. */
export const sendAssistantMessageSchema = z.strictObject({
  content: z.string().trim().min(1).max(ASSISTANT_MESSAGE_MAX),
  /** Where the chat runs; only recorded on a new conversation. */
  channel: z.enum(['WEB', 'MOBILE']).default('WEB'),
});
export type SendAssistantMessageInput = z.infer<typeof sendAssistantMessageSchema>;

/**
 * `POST /conversations/:id/confirm-booking`: the customer pressed "Xác nhận đặt phòng" on a proposal the assistant
 * made. The assistant itself never books; this request is the customer's own click.
 */
export const confirmBookingProposalSchema = z.strictObject({
  proposalId: z.uuid(),
});
export type ConfirmBookingProposalInput = z.infer<typeof confirmBookingProposalSchema>;

/** `GET /me/recommendations`, `GET /recommendations`. */
export const recommendationQuerySchema = z.object({
  /** Only hotels in this city; matched ignoring case and Vietnamese accents. */
  city: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
export type RecommendationQuery = z.infer<typeof recommendationQuerySchema>;
