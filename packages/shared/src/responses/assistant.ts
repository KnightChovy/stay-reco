import { z } from 'zod';
import { isoDateTime, responseSchemas } from './registry';

/** A hotel recommended by the trained model (recommender/), as a card. */
export const recommendedHotelResponseSchema = z
  .object({
    id: z.uuid(),
    recommendationId: z.uuid().nullable().optional(),
    name: z.string(),
    city: z.string(),
    address: z.string(),
    starRating: z.number().int().nullable(),
    coverImageUrl: z.url().nullable(),
    rating: z.number().nullable().describe('Average guest rating; null when nobody has reviewed it yet.'),
    reviewCount: z.number().int(),
    pricePerNightFrom: z.number().nullable().describe('Cheapest base price of a room per night, VND.'),
    rank: z.number().int().describe('1 = the best match for this customer.'),
    score: z.number().describe('Predicted rating, 1-5.'),
    reason: z.string().nullable().describe('One line, in Vietnamese, saying why it was picked.'),
    isNew: z.boolean().describe('Nobody has reviewed it yet: the model picked it from its description alone.'),
  })
  .register(responseSchemas, { id: 'RecommendedHotel' });
export type RecommendedHotel = z.infer<typeof recommendedHotelResponseSchema>;

export const recommendationsResponseSchema = z
  .object({
    personalized: z
      .boolean()
      .describe('false: the list for signed-out visitors, served when this customer has no list of their own yet.'),
    modelRun: z
      .object({ id: z.uuid(), algorithm: z.string(), version: z.string(), finishedAt: isoDateTime() })
      .nullable()
      .describe('The training run the list comes from; null (with no items) before the first run.'),
    items: z.array(recommendedHotelResponseSchema),
  })
  .register(responseSchemas, { id: 'Recommendations' });
export type Recommendations = z.infer<typeof recommendationsResponseSchema>;

/** A hotel the assistant showed in a reply. */
export const assistantHotelResponseSchema = z
  .object({
    id: z.uuid(),
    recommendationId: z.uuid().nullable().optional(),
    name: z.string(),
    city: z.string(),
    starRating: z.number().int().nullable(),
    coverImageUrl: z.url().nullable(),
    rating: z.number().nullable(),
    fromTotal: z.number().nullable().describe('Cheapest total for the asked stay; null when no dates were given.'),
    nights: z.number().int().nullable(),
    pricePerNightFrom: z.number().nullable(),
    reason: z.string().nullable().describe('Why the model recommends it for this customer; null if it does not.'),
  })
  .register(responseSchemas, { id: 'AssistantHotel' });
export type AssistantHotel = z.infer<typeof assistantHotelResponseSchema>;

/** A booking the assistant priced and the customer can confirm with one click. */
export const bookingProposalResponseSchema = z
  .object({
    id: z.uuid(),
    hotelId: z.uuid(),
    hotelName: z.string(),
    recommendationId: z.uuid().optional(),
    roomTypeId: z.uuid(),
    roomTypeName: z.string(),
    checkIn: z.iso.date(),
    checkOut: z.iso.date(),
    guests: z.number().int(),
    rooms: z.number().int(),
    total: z.number().describe('VND, priced when proposed; confirming re-prices and answers BOOKING_PRICE_CHANGED if it moved.'),
    freeCancellationUntil: isoDateTime().nullable(),
    guestName: z.string(),
    contactPhone: z.string(),
    specialRequests: z.string().nullable(),
    expiresAt: isoDateTime().describe('After this, confirming answers BOOKING_PROPOSAL_INVALID.'),
    bookingId: z.uuid().nullable().describe('Set once confirmed: open the booking to pay.'),
    // The breakdown, priced with POST /bookings/discount-quote. Absent on proposals made before it existed.
    subtotal: z.number().optional().describe('Rooms plus the add-ons, before the discount and points.'),
    discount: z
      .object({ name: z.string(), code: z.string().nullable(), amount: z.number() })
      .nullable()
      .optional()
      .describe('The campaign or voucher applied; null when none.'),
    points: z
      .object({ used: z.number().int(), amount: z.number() })
      .nullable()
      .optional()
      .describe('StayMiles spent and what they took off; null when none.'),
    addOns: z
      .array(z.object({ id: z.uuid(), name: z.string(), quantity: z.number().int(), amount: z.number() }))
      .optional()
      .describe('Add-ons booked with the stay, never discounted.'),
  })
  .register(responseSchemas, { id: 'BookingProposal' });
export type BookingProposal = z.infer<typeof bookingProposalResponseSchema>;

/**
 * A cancellation the assistant priced for one of the customer's bookings; the customer confirms it with one click
 * (`POST /conversations/:id/confirm-cancellation`). The assistant never cancels.
 */
export const cancellationProposalResponseSchema = z
  .object({
    id: z.uuid(),
    bookingId: z.uuid(),
    bookingCode: z.string(),
    hotelName: z.string(),
    checkIn: z.iso.date(),
    checkOut: z.iso.date(),
    paid: z.number().describe('What the booking was paid, VND.'),
    fee: z.number().describe('Kept by the hotel under its policy.'),
    refund: z.number().describe('Back to the customer wallet; 0 when nothing comes back.'),
    freeUntil: isoDateTime().nullable().describe('End of free cancellation; null when there is none.'),
    needsApproval: z.boolean().describe('A refund waits for the hotel to approve it before it reaches the wallet.'),
    reason: z.string(),
    expiresAt: isoDateTime().describe('After this, confirming answers BOOKING_PROPOSAL_INVALID.'),
    outcome: z
      .enum(['CANCELLED', 'REFUND_PENDING'])
      .nullable()
      .describe('Set once confirmed: cancelled at once, or a refund request waiting for the hotel.'),
  })
  .register(responseSchemas, { id: 'CancellationProposal' });
export type CancellationProposal = z.infer<typeof cancellationProposalResponseSchema>;

export const assistantMessageResponseSchema = z
  .object({
    id: z.uuid(),
    role: z.enum(['USER', 'ASSISTANT', 'STAFF', 'SYSTEM']),
    content: z.string(),
    hotels: z.array(assistantHotelResponseSchema).describe('Hotels the reply talks about, to show as cards.'),
    proposal: bookingProposalResponseSchema.nullable(),
    cancellation: cancellationProposalResponseSchema
      .nullable()
      .describe('A cancellation to confirm, shown as a card under the reply; null when none.'),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'AssistantMessage' });
export type AssistantMessage = z.infer<typeof assistantMessageResponseSchema>;

export const assistantReplyResponseSchema = z
  .object({
    conversationId: z.uuid(),
    message: assistantMessageResponseSchema.describe("The customer's message, as stored."),
    reply: assistantMessageResponseSchema,
  })
  .register(responseSchemas, { id: 'AssistantReply' });
export type AssistantReply = z.infer<typeof assistantReplyResponseSchema>;

export const conversationSummaryResponseSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(['OPEN', 'ESCALATED', 'CLOSED']),
    preview: z.string().describe('The first thing the customer asked, cut to 120 characters.'),
    createdAt: isoDateTime(),
    updatedAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'ConversationSummary' });
export type ConversationSummary = z.infer<typeof conversationSummaryResponseSchema>;

export const conversationResponseSchema = conversationSummaryResponseSchema
  .extend({ messages: z.array(assistantMessageResponseSchema).describe('Oldest first.') })
  .register(responseSchemas, { id: 'Conversation' });
export type Conversation = z.infer<typeof conversationResponseSchema>;
