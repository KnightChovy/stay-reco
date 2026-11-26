# Recommendations and the assistant (phase 5)

> Used by: customer (`CUSTOMER`), and signed-out visitors for the public list. Rules for every API: [../api-guide.md](../api-guide.md). Decisions: [phase 5](../phases/phase-5-ai-marketing.md#recommendations-and-the-assistant-r1r8).

Two features on one model:

- **Recommendations**: a ranked list of hotels for each customer, with one line saying why. The list is computed offline by [`recommender/`](../../recommender/README.md) (the two-sided rule of the paper in `stayreco-experiment/`) and only read here.
- **The assistant**: a chat that searches rooms, uses those recommendations to order what it shows, explains rooms and prices, and prepares a booking. **The assistant never books.** It shows a priced proposal; the booking is made when the customer presses "Xác nhận đặt phòng", which calls `confirm-booking`, which books exactly like `POST /bookings`.

## Recommendations

| Method | Path | Access | Query | Response |
|---|---|---|---|---|
| GET | `/me/recommendations` | Customer | `city?`, `limit?` (1-20, default 10) | `Recommendations` |
| GET | `/recommendations` | Public | same | `Recommendations` (the list for signed-out visitors) |

- `items[]` (`RecommendedHotel`): card fields (`name`, `city`, `starRating`, `coverImageUrl`, `rating`, `reviewCount`, `pricePerNightFrom`), plus `rank`, `score` (predicted rating 1-5), `reason` (Vietnamese, show it under the card) and `isNew` (nobody has reviewed it yet; worth a "Mới" badge).
- `personalized: false` on `/me/...` means the last training run did not know this customer yet (they signed up after it); they get the signed-out list until the next run.
- `city` matches ignoring case and accents: `da lat`, `Đà Lạt` and `ĐÀ LẠT` are the same.
- A personal card includes its `recommendationId`. Carry it through hotel and room links to `POST /bookings` for attribution. A public card has no personal recommendation ID.
- `items` is empty and `modelRun` null until the recommender has run once. Hide the section rather than showing an empty one.
- Prices are base prices per night. Whether a hotel has rooms on given dates is answered by the search and the hotel page, as everywhere else.

## The assistant

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/me/conversations` | Customer | | `ConversationSummary[]`, newest first, at most 50 |
| POST | `/me/conversations` | Customer | `{ content, channel? }` (`sendAssistantMessageSchema`) | 201 `AssistantReply` |
| GET | `/conversations/:id` | Customer (own) | | `Conversation` with `messages`, oldest first |
| POST | `/conversations/:id/messages` | Customer (own) | `{ content }` | 201 `AssistantReply` |
| POST | `/conversations/:id/confirm-booking` | Customer (own) | `{ proposalId }` (`confirmBookingProposalSchema`) | 201 `Booking` (PENDING) |
| POST | `/conversations/:id/confirm-cancellation` | Customer (own) | `{ proposalId }` (`confirmCancellationProposalSchema`) | 201 `Booking` (`CANCELLED`, or `CONFIRMED` with `REFUND_PENDING`) |

### Sending a message

`POST /me/conversations` starts a conversation with its first message; later messages go to `POST /conversations/:id/messages`. The answer takes a few seconds (the model may search and price rooms first): show a typing indicator, and do not let the customer send twice.

`AssistantReply` is `{ conversationId, message, reply }`: `message` is the customer's message as stored, `reply` the answer. Each `AssistantMessage` has:

- `content`: Markdown (bold, lists). Render it as Markdown.
- `hotels[]` (`AssistantHotel`): cards for the hotels the reply talks about. `fromTotal` and `nights` are set when the customer gave dates (the total for the whole stay), `pricePerNightFrom` otherwise; `reason` is set when the model recommends it to this customer. Link a card to the hotel page **with the dates of the conversation** when there are some.
- `proposal` (`BookingProposal`) or null: a priced booking. Show it as a summary (hotel, room type, dates, guests, total, free cancellation until) with a **"Xác nhận đặt phòng"** button, while `bookingId` is null and `expiresAt` is in the future. It is priced with `POST /bookings/discount-quote`: `subtotal` (rooms and add-ons), `discount` (the campaign or the voucher code, with its amount), `points` (StayMiles spent) and `addOns` (lines booked with the stay) are the breakdown of `total`; all four are absent on proposals made before 2026-11-26. Once `bookingId` is set, show how to pay **in the chat**: `GET /bookings/:id` gives `payment` (VietQR image, bank, account, amount, content) while it is PENDING, and the wallet pays it with `POST /bookings/:id/pay-with-wallet`.
- `cancellation` (`CancellationProposal`) or null: a priced cancellation of one of the customer's paid bookings: `paid`, `fee`, `refund`, `needsApproval` (the refund waits for the hotel), `freeUntil`. Show it with a **"Xác nhận huỷ"** button while `outcome` is null and `expiresAt` is in the future; after the click `outcome` is `CANCELLED` (nothing to refund) or `REFUND_PENDING` (the hotel approves, then the money reaches the wallet).
- `role`: `USER`, `ASSISTANT`, or `SYSTEM` (a note the platform adds, e.g. "Đã giữ phòng ..., mã đặt phòng SR-..." after a confirmation). Show `SYSTEM` as a centred note, not a bubble.

When the model fails, nothing is stored: the customer's message is not in the conversation, so resending is safe.

### Confirming a proposal

`POST /conversations/:id/confirm-booking { proposalId }` books the proposal with its room type, dates, guests, name, phone and total (`expectedTotal`). The answer is the PENDING booking: go to the payment screen exactly as after `POST /bookings`.

- A proposal books once: a second click answers `BOOKING_PROPOSAL_INVALID` (409). Disable the button on the first click.
- It expires after 30 minutes (`expiresAt`): `BOOKING_PROPOSAL_INVALID`. Ask the customer to tell the assistant to price it again.
- If the price or the free rooms changed since it was proposed: `BOOKING_PRICE_CHANGED` or `ROOM_SOLD_OUT`, as for `POST /bookings`. Same remedy.
- After a confirmation, `GET /conversations/:id` shows the proposal with its `bookingId` and a `SYSTEM` message.
- The proposal is booked with what it was priced with: the same voucher `code`, `pointsToUse` and `addOns`. A code used up or expired in between answers its `VOUCHER_*` error.

### Confirming a cancellation

`POST /conversations/:id/confirm-cancellation { proposalId }` cancels the booking exactly as `POST /bookings/:id/cancel`, with the reason the customer gave the assistant. The same rules as the website: only a paid `CONFIRMED` booking not checked in; a refund becomes a request the hotel approves (`REFUND_PENDING`), nothing to refund cancels at once. The proposal records the `outcome` and a `SYSTEM` message says it, including that the refund goes to the StayReco wallet. Once only (`BOOKING_PROPOSAL_INVALID` on a second click), for 30 minutes; `BOOKING_STATUS_CONFLICT` or `CANCELLATION_NOT_ALLOWED` if the booking changed meanwhile.

### Cost

Each customer has a monthly assistant budget (`AI_ASSISTANT_MONTHLY_BUDGET_USD`, default $0.50, about 60-80 messages). Over it, messages answer `AI_BUDGET_EXCEEDED` (403) until the next calendar month (UTC). Without `GEMINI_API_KEY` the assistant answers `AI_UNAVAILABLE` (503): hide the chat button.

### Errors

| Code | When |
|---|---|
| `CONVERSATION_NOT_FOUND` (404) | Not a conversation of this customer |
| `BOOKING_PROPOSAL_NOT_FOUND` (404) | No booking or cancellation proposal with this id in the conversation |
| `BOOKING_PROPOSAL_INVALID` (409) | Already confirmed, or expired (both kinds of proposal) |
| `AI_UNAVAILABLE` (503), `AI_BUDGET_EXCEEDED` (403), `AI_REFUSED` (403) | The model is off, the budget is used up, or the model declined |
| `ROOM_TYPE_NOT_FOUND`, `ROOM_SOLD_OUT`, `BOOKING_PRICE_CHANGED`, `VOUCHER_*` | From the booking, on confirm |
| `BOOKING_STATUS_CONFLICT`, `CANCELLATION_NOT_ALLOWED` | From the cancellation, on confirm |

## What the assistant can do

The model is given eight tools, all read-only, each going through the same service and validation as the matching public endpoint. Booking and cancelling are only proposed; the customer's click does them.

| Tool | Does | Same as |
|---|---|---|
| `search_hotels` | Hotels with free rooms for a stay, **the customer's recommendations first**, then by stars, price and name | `GET /hotels` |
| `recommend_hotels` | The customer's recommendation list, optionally for one city | `GET /me/recommendations` |
| `get_hotel_rooms` | A hotel's description, amenities, cancellation policy, add-ons (with `prebookable`) and room types, priced when dates are given | `GET /hotels/:id/listing` |
| `propose_booking` | Prices one room type for a stay, with an optional voucher `code`, `pointsToUse` and prebookable `addOns`, and checks it could be booked; makes the proposal | `POST /bookings/discount-quote` and the checks of `POST /bookings` |
| `my_vouchers` | The customer's usable codes: discount, cap, minimum, expiry, the hotel they apply at | `GET /me/vouchers?active=true` |
| `my_wallet` | Wallet balance, StayMiles points, their value and the tier (points null when no programme runs) | `GET /me/wallet`, `GET /me/loyalty` |
| `my_bookings` | The customer's bookings by tab or all: code, hotel, dates, status, payment status, total | `GET /me/bookings` |
| `propose_cancellation` | Prices cancelling one of the customer's bookings, found by its code among their own; makes the cancellation proposal | `GET /bookings/:id/cancellation-quote` |

Every call is logged in `ai_function_call` (arguments, result, duration) against the reply it led to, and every model call in `ai_usage` against the customer.

**Ids never reach the customer.** The ids of hotels, room types and proposals shown earlier are handed to the model as lookup data in its system instruction, not in its own past turns (written there, the model learned to copy such notes, ids and all, into its answers). An answer is also cleaned before it is stored, and when stored answers are read back, of any line that looks like an internal note (`[Đã hiển thị …]`, a bracketed line with `hotelId=`, `roomTypeId=` or a UUID): `backend/src/modules/assistant/assistant-text.ts`.
