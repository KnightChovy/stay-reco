import { z } from "zod";
import { isoDateTime, responseSchemas } from "./registry";

const partsSchema = z.object({
  history: z.number(),
  content: z.number(),
  group: z.number(),
});

/** Why one hotel is on a customer's list: what the "Vì sao?" view shows. */
export const recommendationExplanationResponseSchema = z
  .object({
    weights: partsSchema.describe(
      "Share of the score from each part, adding up to 1: history (SVD++, the guest's and similar guests' ratings), content (preferences and the hotel's description), group (guests of the same age, gender and country).",
    ),
    scores: z
      .object({
        history: z.number().nullable(),
        content: z.number().nullable(),
        group: z.number().nullable(),
      })
      .describe(
        "Predicted rating (1-5) of each part; null for a part with no weight.",
      ),
    stays: z
      .number()
      .int()
      .describe(
        "Hotels this customer has rated: what the history part knows about them.",
      ),
    hotelRatings: z
      .number()
      .int()
      .describe("Ratings this hotel has; 0 is a new hotel (item cold start)."),
    own: z
      .number()
      .nullable()
      .describe(
        "The customer's own rating of this hotel, when they stayed there.",
      ),
    similar: z
      .object({
        hotelId: z.uuid(),
        name: z.string().nullable(),
        rating: z.number(),
      })
      .nullable()
      .describe("The hotel they rated highly that this one reads most like."),
    picked: z
      .object({ hotelId: z.uuid(), name: z.string().nullable() })
      .nullable()
      .optional()
      .describe(
        "With no stay to compare: the hotel ticked at onboarding this one reads most like.",
      ),
    styles: z
      .array(z.string())
      .describe("Labels of the chosen travel styles this hotel is."),
    inCity: z
      .boolean()
      .nullable()
      .describe("In a city they picked; null when they picked none."),
    overBudget: z.boolean(),
  })
  .register(responseSchemas, { id: "RecommendationExplanation" });
export type RecommendationExplanation = z.infer<
  typeof recommendationExplanationResponseSchema
>;

/** What the list is built from, for the "Hệ thống hiểu bạn thế nào" box. */
export const recommendationProfileResponseSchema = z
  .object({
    stays: z.number().int().describe("Hotels the customer has rated."),
    weights: partsSchema.describe(
      "Mean share of each part over the hotels listed.",
    ),
    preferences: z.object({
      cities: z.array(z.string()),
      travelStyles: z
        .array(z.string())
        .describe("Ids of the preferences screen."),
      roomAmenities: z.array(z.string()),
      budgetPerNight: z.number().nullable(),
      pickedHotels: z.number().int().describe("Hotels ticked at onboarding."),
    }),
    excluded: z.object({
      disliked: z
        .number()
        .int()
        .describe("Hotels they rated below 3, never suggested to them."),
      upcoming: z
        .number()
        .int()
        .describe("Hotels where they have a stay coming up or under way."),
    }),
  })
  .register(responseSchemas, { id: "RecommendationProfile" });
export type RecommendationProfile = z.infer<
  typeof recommendationProfileResponseSchema
>;

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
    rating: z
      .number()
      .nullable()
      .describe("Average guest rating; null when nobody has reviewed it yet."),
    reviewCount: z.number().int(),
    pricePerNightFrom: z
      .number()
      .nullable()
      .describe("Cheapest base price of a room per night, VND."),
    rank: z.number().int().describe("1 = the best match for this customer."),
    score: z.number().describe("Predicted rating, 1-5."),
    reason: z
      .string()
      .nullable()
      .describe("One line, in Vietnamese, saying why it was picked."),
    isNew: z
      .boolean()
      .describe(
        "Nobody has reviewed it yet: the model picked it from its description alone.",
      ),
    styles: z
      .array(z.string())
      .describe(
        "Travel style ids the hotel is (resort, nature, foodie, business, family, chill), read from its own text by the rule the recommender ranks by; empty when it says too little.",
      ),
    explanation: recommendationExplanationResponseSchema.nullable().optional(),
  })
  .register(responseSchemas, { id: "RecommendedHotel" });
export type RecommendedHotel = z.infer<typeof recommendedHotelResponseSchema>;

export const recommendationsResponseSchema = z
  .object({
    personalized: z
      .boolean()
      .describe(
        "false: the list for signed-out visitors, served when this customer has no list of their own yet.",
      ),
    source: z
      .enum(["MODEL", "PREFERENCES", "POPULAR"])
      .describe(
        "MODEL: the trained model's list for this customer. PREFERENCES: ranked on the spot from the preferences they " +
          "just gave, until the next training run includes them (`modelRun` is still the run served to others). " +
          "POPULAR: the list for signed-out visitors.",
      ),
    modelRun: z
      .object({
        id: z.uuid(),
        algorithm: z.string(),
        version: z.string(),
        finishedAt: isoDateTime(),
      })
      .nullable()
      .describe(
        "The training run the list comes from; null (with no items) before the first run.",
      ),
    items: z.array(recommendedHotelResponseSchema),
    profile: recommendationProfileResponseSchema
      .nullable()
      .optional()
      .describe(
        "What a personal list is built from; null on the signed-out list.",
      ),
  })
  .register(responseSchemas, { id: "Recommendations" });
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
    fromTotal: z
      .number()
      .nullable()
      .describe(
        "Cheapest total for the asked stay; null when no dates were given.",
      ),
    nights: z.number().int().nullable(),
    pricePerNightFrom: z.number().nullable(),
    reason: z
      .string()
      .nullable()
      .describe(
        "Why the model recommends it for this customer; null if it does not.",
      ),
  })
  .register(responseSchemas, { id: "AssistantHotel" });
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
    total: z
      .number()
      .describe(
        "VND, priced when proposed; confirming re-prices and answers BOOKING_PRICE_CHANGED if it moved.",
      ),
    freeCancellationUntil: isoDateTime().nullable(),
    guestName: z.string(),
    contactPhone: z.string(),
    specialRequests: z.string().nullable(),
    expiresAt: isoDateTime().describe(
      "After this, confirming answers BOOKING_PROPOSAL_INVALID.",
    ),
    bookingId: z
      .uuid()
      .nullable()
      .describe("Set once confirmed: open the booking to pay."),
    // The breakdown, priced with POST /bookings/discount-quote. Absent on proposals made before it existed.
    subtotal: z
      .number()
      .optional()
      .describe("Rooms plus the add-ons, before the discount and points."),
    discount: z
      .object({
        name: z.string(),
        code: z.string().nullable(),
        amount: z.number(),
      })
      .nullable()
      .optional()
      .describe("The campaign or voucher applied; null when none."),
    points: z
      .object({ used: z.number().int(), amount: z.number() })
      .nullable()
      .optional()
      .describe("StayMiles spent and what they took off; null when none."),
    addOns: z
      .array(
        z.object({
          id: z.uuid(),
          name: z.string(),
          quantity: z.number().int(),
          amount: z.number(),
        }),
      )
      .optional()
      .describe("Add-ons booked with the stay, never discounted."),
  })
  .register(responseSchemas, { id: "BookingProposal" });
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
    paid: z.number().describe("What the booking was paid, VND."),
    fee: z.number().describe("Kept by the hotel under its policy."),
    refund: z
      .number()
      .describe("Back to the customer wallet; 0 when nothing comes back."),
    freeUntil: isoDateTime()
      .nullable()
      .describe("End of free cancellation; null when there is none."),
    needsApproval: z
      .boolean()
      .describe(
        "A refund waits for the hotel to approve it before it reaches the wallet.",
      ),
    reason: z.string(),
    expiresAt: isoDateTime().describe(
      "After this, confirming answers BOOKING_PROPOSAL_INVALID.",
    ),
    outcome: z
      .enum(["CANCELLED", "REFUND_PENDING"])
      .nullable()
      .describe(
        "Set once confirmed: cancelled at once, or a refund request waiting for the hotel.",
      ),
  })
  .register(responseSchemas, { id: "CancellationProposal" });
export type CancellationProposal = z.infer<
  typeof cancellationProposalResponseSchema
>;

export const assistantMessageResponseSchema = z
  .object({
    id: z.uuid(),
    role: z.enum(["USER", "ASSISTANT", "STAFF", "SYSTEM"]),
    content: z.string(),
    hotels: z
      .array(assistantHotelResponseSchema)
      .describe("Hotels the reply talks about, to show as cards."),
    proposal: bookingProposalResponseSchema.nullable(),
    cancellation: cancellationProposalResponseSchema
      .nullable()
      .describe(
        "A cancellation to confirm, shown as a card under the reply; null when none.",
      ),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, { id: "AssistantMessage" });
export type AssistantMessage = z.infer<typeof assistantMessageResponseSchema>;

export const assistantReplyResponseSchema = z
  .object({
    conversationId: z.uuid(),
    message: assistantMessageResponseSchema.describe(
      "The customer's message, as stored.",
    ),
    reply: assistantMessageResponseSchema,
  })
  .register(responseSchemas, { id: "AssistantReply" });
export type AssistantReply = z.infer<typeof assistantReplyResponseSchema>;

export const conversationSummaryResponseSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(["OPEN", "ESCALATED", "CLOSED"]),
    preview: z
      .string()
      .describe("The first thing the customer asked, cut to 120 characters."),
    createdAt: isoDateTime(),
    updatedAt: isoDateTime(),
  })
  .register(responseSchemas, { id: "ConversationSummary" });
export type ConversationSummary = z.infer<
  typeof conversationSummaryResponseSchema
>;

export const conversationResponseSchema = conversationSummaryResponseSchema
  .extend({
    messages: z.array(assistantMessageResponseSchema).describe("Oldest first."),
  })
  .register(responseSchemas, { id: "Conversation" });
export type Conversation = z.infer<typeof conversationResponseSchema>;

const groupMetricsSchema = z.object({
  group: z
    .enum(["0-none", "0-prefs", "1-4", "5+"])
    .describe("Guests by stays in train; no stay split by onboarding answers."),
  users: z.number().int(),
  recall: z.number(),
  ndcg: z.number(),
});

/** One method of the offline evaluation (the paper's cold-start split, full-catalogue ranking, K = 10). */
const evaluatedMethodSchema = z.object({
  key: z.enum(["served", "cf", "content", "popularity", "random"]),
  rmse: z.number().nullable(),
  precision: z.number().nullable(),
  recall: z.number().nullable(),
  ndcg: z.number().nullable(),
  newShare: z
    .number()
    .nullable()
    .describe("Share of top-10 slots given to hotels nobody rated in train."),
  coldstartCoverage: z
    .number()
    .nullable()
    .describe("Share of those new hotels that reach some top-10."),
  coverage: z
    .number()
    .nullable()
    .describe("Share of the catalogue that reaches some top-10."),
  tailShare: z
    .number()
    .nullable()
    .describe("Share of top-10 slots outside the 20% most rated hotels."),
  byGroup: z.array(groupMetricsSchema),
});

/** The evidence page of the admin: how well the served recommender does, offline and on real bookings. */
export const recommenderEvaluationResponseSchema = z
  .object({
    run: z
      .object({
        id: z.uuid(),
        version: z.string(),
        finishedAt: isoDateTime(),
        customers: z
          .number()
          .int()
          .describe("Customers with a list of their own."),
        hotels: z.number().int(),
      })
      .nullable()
      .describe("The run served; null before the first one."),
    split: z
      .object({
        train: z.number().int(),
        test: z.number().int(),
        rankedUsers: z.number().int(),
        catalog: z.number().int(),
        hiddenHotels: z.number().int(),
        k: z.number().int(),
        threshold: z.number(),
      })
      .nullable()
      .describe(
        "Sizes of the evaluation; null when the run had too few ratings to evaluate.",
      ),
    methods: z.array(evaluatedMethodSchema),
    longTail: z
      .array(
        z.object({
          band: z
            .number()
            .int()
            .describe("1 = the 20% most reviewed hotels … 5 = the least."),
          hotels: z.number().int(),
          minReviews: z.number().int(),
          maxReviews: z.number().int(),
          reviewShare: z.number(),
          slotShare: z
            .number()
            .describe(
              "Share of the top-10 slots of every customer list in the served run.",
            ),
        }),
      )
      .describe(
        "Where the served lists put their top 10, by how reviewed the hotels are.",
      ),
    bookings: z
      .object({
        total: z.number().int(),
        fromRecommendations: z.number().int(),
        medianRank: z
          .number()
          .nullable()
          .describe("Rank the booked hotel had on the guest's list."),
      })
      .describe(
        "Bookings of the last 30 days, not cancelled or expired, and how many came from a recommendation.",
      ),
  })
  .register(responseSchemas, { id: "RecommenderEvaluation" });
export type RecommenderEvaluation = z.infer<
  typeof recommenderEvaluationResponseSchema
>;
