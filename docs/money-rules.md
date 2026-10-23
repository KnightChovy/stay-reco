# Money rules: prices, payment, cancellation and refunds

The rules every part of StayReco follows for **money**: room prices, holds, SePay payment, wallets, commission, cancellation and refunds. BE, FE and the report writers use this page as the single reference; the endpoints that apply these rules are in [api/customer.md](./api/customer.md) and [api/partner.md](./api/partner.md).

Sources: the SRS business rules (Report 3, section 5.1, BR-01 to BR-29), the presentation slide "08. Cancellation And Refund", and the team decisions of 2026-10-22. Where this page differs from the SRS, section 8 lists it so the report can be updated. When a rule changes, update this page in the same PR and add a row to the changelog at the end.

## 1. Summary

| Topic | Rule | Source |
|---|---|---|
| Displayed price | Final price, VAT and service fee included, paid in full when booking, never changed afterwards | BR-05, BR-09 |
| Rounding | Nightly prices, and so booking totals, in whole dong (rounded half up), because bank transfers carry no decimals; other amounts VND with at most 2 decimals, rounded half up once; every amount is computed by the backend | BR-29 |
| Availability | Counted per night: from the check-in date up to the night before check-out | BR-02 |
| Hold | 15 minutes to pay; then the rooms are released and the booking expires | BR-03 |
| Confirmation | Only when SePay reports a transfer matching the booking; no screen marks a booking as paid by hand | BR-04 |
| Cancellation policy | The policy in force when booking, fixed on the booking | BR-07 |
| Refund amount | Paid − cancellation fee − already refunded, never more than paid | BR-08 |
| Refund approver | The partner (hotel owner), after staff with the Refund permission check it | Slide 08 |
| Refund destination | The customer's StayReco wallet | Slide 08 |
| Commission | Rate at booking time, default 8%, admin can set 8–15% | BR-13 |
| Hotel share on payment | The **full** amount goes to the hotel wallet's pending balance; the commission is taken at check-out | BR-22, team decision |
| Platform revenue | Kept in the **platform wallet**; the sum of all wallets reconciles with the platform's bank account | Team decision |

## 2. Room prices

### 2.1 Final price

Final price of a booking = sum of the nightly prices (from the pricing rules) − promotion or voucher discount − value of loyalty points used (BR-05, BR-06). It is never below 0, includes VAT and the service fee, is paid in full when booking and does not change afterwards.

Phase 2 has no promotions, vouchers or points (phase 4), so the final price = sum of the nightly prices × number of rooms.

### 2.2 Pricing rules

Each room type has exactly one **base price** and may have adjustment rules, modelled on how Booking.com and Traveloka price rooms (seasonal rates, early-booker and last-minute deals) and on SRS UC64.

| Rule type | Applies when | Example |
|---|---|---|
| **Base** (`BASE`) | Always; used when no other rule matches | 2,800,000 ₫ per night |
| **Season** (`SEASON`) | The night falls in a date range, optionally on given weekdays | Tết: set 4,500,000 ₫; Saturdays: +15% |
| **Early bird** (`EARLY_BIRD`) | The booking is made at least N days before check-in | Booked ≥ 30 days ahead: −10% |
| **Last minute** (`LAST_MINUTE`) | The booking is made at most N days before check-in | Booked ≤ 3 days ahead: −200,000 ₫ |

A rule's adjustment is one of: **set a new price** (a fixed amount per night), **add or subtract an amount** (± VND), or **add or subtract a percentage** (± %, of the base price). Each rule has a **priority** (integer, default 0) and can be switched on or off.

### 2.3 Price of one night

1. Take the room type's base price.
2. Find the active rules that match **that night** (date range, weekday) and the **days booked ahead** = days from today to the check-in date, counted in Asia/Ho_Chi_Minh.
3. Apply **one rule only**: the one with the highest priority; on a tie, the newest. Rules never stack (SRS 3.12.1).
4. Round half up to **whole dong** (BR-29, applied to whole dong because a bank transfer has no decimals and SePay must match the amount exactly). A base price with decimals is rounded the same way. A night is never free: a rule whose result would be 0 or less is refused when it is saved, and if the base price is lowered later so that a saved rule would give 0 or less, that rule is skipped for the night and the next matching rule (or the base price) applies.

Example. Base price 2,000,000 ₫. Rule A: Saturdays +15%, priority 1. Rule B: booked ≥ 30 days ahead −10%, priority 2. A customer books 40 days ahead for Friday and Saturday nights:

- Friday: only B matches → 2,000,000 − 10% = 1,800,000 ₫.
- Saturday: A and B match, B has the higher priority → 1,800,000 ₫ (A is not added).
- Total for one room: 3,600,000 ₫.

The partner's pricing screen has a **preview**: pick a room type and a date, and the system returns the final price and the rule it used.

### 2.4 Price changes while the customer books

When the customer clicks "Continue to payment", the backend prices the stay again. If the total differs from what the customer saw, it answers MSG13 and the customer confirms the new total. Once the rooms are held, the price is fixed on the booking and never changes, even if the partner edits the rules later (BR-09).

## 3. Availability and holds

- Availability is per night. A room type is available for a stay when enough physical rooms of the type are not held, booked or closed on **every night** of the stay (BR-02). Rooms locked for maintenance (`MAINTENANCE`) do not count until the partner unlocks them; `OCCUPIED` and `CLEANING` describe today only and do not reduce future dates (BR-27).
- The partner can close dates or reduce the rooms on sale per day (UC63), but never below the rooms already booked.
- When the customer confirms, the system holds enough rooms for every night for **15 minutes** (BR-03). Two customers cannot hold the same room for the same night (the database rejects it).
- A job runs **every minute** to release expired holds; unpaid bookings become **expired** (SRS 3.5.4).
- Staff assign the actual room at check-in; the rooms held at booking only guarantee capacity (BR-10).

## 4. Payment through SePay

- Every booking has a **booking code** `SR-YYMMDD-XXXX` (for example SR-261022-0842), which is also the transfer content.
- The payment page shows the VietQR code of the platform's bank account with the amount and the transfer content; the customer pays with a banking app.
- SePay calls the StayReco webhook for every incoming transfer. The backend checks the API key, then matches the **booking code in the content** and the **exact amount**:
  - match while the booking is still `PENDING` → the booking is confirmed, a confirmation email is sent, an e-voucher QR is created. A transfer that arrives just after the 15 minutes but before the expiry job has run (at most about a minute) still counts;
  - a repeated notification for the same transaction → ignored; a booking is never confirmed twice;
  - no booking code, wrong amount, or no matching booking → not confirmed; logged for manual checking (SRS 3.5.5);
  - money arriving after the booking expired → logged and refunded to the customer (SRS 3.5.4).
- While waiting, the payment page shows MSG15; success shows MSG17 and opens the booking voucher; an expired hold shows the expired state.

## 5. Money flow and wallets

### 5.1 Model (lecturer feedback)

There is **no** payment-transaction table and no refund-request table.

- The **payment state** of a booking is its invoice's status: unpaid (`UNPAID`), paid (`PAID`), refund pending (`REFUND_PENDING`), partially refunded (`PARTIALLY_REFUNDED`), refunded (`REFUNDED`), failed (`FAILED`).
- **Every real money movement** is one wallet transaction (`wallet_transaction`): booking payment, commission, payout, refund, top-up, adjustment. Amounts are signed: positive credits the wallet, negative debits it. Each transaction has an idempotency key, so a retried webhook or refund writes one row only.
- A **wallet** belongs to a hotel, a customer, or **the platform** (exactly one platform wallet) and has a pending, an available and a reserved balance. Hotel and customer wallets are created on their first movement. Each transaction records the wallet's available plus pending balance after it (`balance_after`).
- The real money sits in the platform's bank account (received through SePay); wallets record each party's share.

### 5.2 Event by event

| Event | Booking | Invoice | Wallet transactions |
|---|---|---|---|
| Customer holds rooms | `PENDING` | `UNPAID` | none |
| SePay reports a matching transfer | `CONFIRMED` | `PAID`, with the SePay transaction id and payment time | booking payment into the hotel wallet's **pending** balance (BR-22) |
| 15 minutes without payment | `EXPIRED` | `FAILED` | none (rooms released) |
| Customer cancels, nothing to refund | `CANCELLED` | stays `PAID` | none (rooms released; the hotel keeps the money as the cancellation fee) |
| Customer cancels, money to refund | stays `CONFIRMED` | `REFUND_PENDING` | none (waiting for the decision, section 7) |
| Partner approves the refund | `CANCELLED` | `REFUNDED` or `PARTIALLY_REFUNDED` | hotel wallet debited, customer wallet credited (rooms released) |
| Partner rejects the refund | stays `CONFIRMED` | back to `PAID` | none |
| Customer checks out | `COMPLETED` | unchanged | commission as a pair: hotel wallet −commission, **platform wallet +commission** (BR-13); after the holding period, pending moves to available (BR-22), phase 3 |

### 5.3 Platform wallet

StayReco's own money is tracked like a party of its own, so revenue is managed precisely:

- On payment the hotel wallet gets the **full** amount in its pending balance. The platform takes nothing yet, so a refund before check-out only moves money between the hotel and the customer.
- At check-out the commission moves as a pair of transactions: hotel wallet −commission, platform wallet +commission (phase 3).
- Costs or compensations the platform bears (goodwill credits to a customer, platform-funded promotions, bank fees) are debited from the platform wallet.
- Platform revenue for a period = the platform wallet's commission transactions minus its debits; its balance is always at hand.
- Reconciliation: money in the platform's bank account = sum of all wallet balances (hotels, customers, platform) once payouts are recorded.

### 5.4 Commission and payouts

- The platform commission is charged on every **completed** booking, at the partner's rate **at booking time** (fixed on the booking). Default 8%, the admin can set 8–15% (BR-13). Cancelled bookings pay no commission.
- A refund creates a commission adjustment entry; the original entry is never edited (SRS 3.5.7).
- A partner withdraws at most the available balance, only to the declared beneficiary account, with one pending request per hotel at a time; platform managers process it within 2 working days (BR-22). Not built in phase 2.

## 6. Cancellation policy

### 6.1 Set by the partner

Each hotel has one cancellation policy, displayed the way Booking.com and Traveloka do ("Free cancellation before …", "Non-refundable"):

- **Free-cancellation days** N (0–30): guests cancel for free until **the hotel's check-in time, N days before the check-in date**. N = 0 means free until the check-in time on the check-in date itself. Empty means no free-cancellation period.
- **Cancellation fee** (0–100%) on the amount paid, charged when cancelling after the deadline. "Non-refundable" = no free period and a 100% fee.
- **Default** until the partner sets a policy: free cancellation until the check-in time 1 day before check-in, then a 100% fee.
- The free-text policy stays for display.

### 6.2 Fixed on the booking

When the customer books, the booking stores the **free-cancellation deadline** (a precise date and time in Vietnam time, shown as "Free cancellation before 14:00 on 18/11"), the **fee percent** and the **commission rate**. Later changes to the policy do not affect existing bookings (BR-07). A booking made after the deadline has already passed (for example check-in tomorrow with 3 free days) gets no free-cancellation period.

### 6.3 When cancelling is allowed

- Only confirmed bookings can be cancelled, and the customer must give a reason.
- No cancellation after check-in (BR-09).
- To change dates, room type or guests, the customer cancels under the policy and books again at the current price (BR-09). Changing details that do not affect the price (guest name, phone, arrival time, special requests) comes in phase 3.

## 7. Refunds

### 7.1 Formula

**Cancellation fee** = 0 before the free-cancellation deadline; otherwise fee percent × amount paid.

**Refund** = amount paid − cancellation fee − amount already refunded; never negative and never more than the amount paid (BR-08). Rounded half up to 2 decimals.

The fee and the refund are **fixed when the customer cancels**: the hotel later approves exactly that amount, even if the free-cancellation deadline passes while the request waits. The reason, fee and refund are recorded with the request (`audit_log`, no extra table).

Example. Booking of 5,000,000 ₫, free cancellation until 14:00 on 15/11, fee 30%.

- Cancelled on 10/11: fee 0 → refund 5,000,000 ₫.
- Cancelled on 16/11: fee 1,500,000 ₫ → refund 3,500,000 ₫ (partial refund).
- With a 100% fee: refund 0 ₫ → cancelled at once, no approval needed.

### 7.2 Process (slide "08. Cancellation And Refund")

1. The **customer** opens the booking, clicks cancel and enters a reason. The screen first shows the free-cancellation deadline, the fee and the refund.
2. The **system** computes the refund from the fixed policy.
   1. Refund 0 ₫ → the booking is **cancelled** at once, the rooms are released, the customer is notified.
   2. Refund > 0 ₫ → a refund request (the invoice becomes **refund pending**). The booking **stays** and its rooms **stay held** until a decision.
3. **Staff** with the Refund permission are notified, check the request against the policy, add a note and forward it to the partner.
4. The **partner** (hotel owner) decides:
   1. **Approve** → the booking is cancelled, the rooms return to inventory, the refund (after the fee) is debited from the hotel wallet and credited to the **customer wallet**; the customer is notified.
   2. **Reject** with a reason → the booking stays as it was; the customer is told the reason.
5. A request made **before the check-in time** and still undecided at that time → the system **approves automatically**, so the customer is never stuck. A request made after the check-in time waits for the partner.

A suspended partner can still approve a refund (the money goes back to the customer) but cannot reject one.

### 7.3 Allowed reasons to reject

Per BR-20, only when: the booking was already refunded or the request is a duplicate; the booking status no longer allows a refund (checked in or no-show); or fraud is suspected with evidence. The reason is logged and sent to the customer.

## 8. Differences from the SRS (to update the report)

- UC28, UC29, UC34, UC35, screens 3.6.4, 3.8.2, 3.8.3, BR-20: the partner approves (staff check and forward); the booking is only cancelled after approval; refunds go to the customer wallet instead of a bank transfer; a zero refund cancels at once; automatic approval at check-in time for requests made before it.
- New statuses: booking **expired** (`EXPIRED`), invoice **refund pending** (`REFUND_PENDING`).
- UC25 / screen 3.6.3 (changing booking details) moves to phase 3.
- BR-17: the password reset link expires after **15 minutes** (the SRS says 30).
- BR-29: nightly prices and booking totals are rounded to whole dong (the SRS says 2 decimals), so the transfer amount is exact.

## 9. Not built yet, or still open

- Promotions, vouchers, loyalty points (BR-06, BR-11): phase 4.
- Paying with the customer wallet, withdrawing it: phase 4.
- Moving pending to available, recording commission at check-out: phase 3. The holding period after check-out (BR-22) is set by the platform; value not agreed yet.
- Partner withdrawals (BR-22): phase 6.

## Changelog

| Date | Change |
|---|---|
| 2026-10-22 | First version: prices and pricing rules, holds, SePay, money flow on the invoice + wallet model, commission, cancellation policy, refund process from slide 08 |
| 2026-10-23 | Added to the repo as the reference page |
| 2026-10-23 | Availability: rooms locked for maintenance do not count; `OCCUPIED` / `CLEANING` (today's state) do not reduce future dates |
| 2026-10-23 | Refunds: automatic approval only for requests made before the check-in time; suspended partners can approve but not reject. Default cancellation policy: free until 1 day before, then 100% |
| 2026-10-23 | Prices: a saved rule that would make a night 0 or less after a base price change is skipped, never applied |
| 2026-10-23 | Cancellation: a booking made after its free-cancellation deadline has passed gets no free period |
| 2026-10-23 | Rounding: nightly prices, and so booking totals, are rounded half up to whole dong so the transfer amount is exact |
| 2026-10-24 | Refunds: the fee and refund are fixed when the customer cancels; the approval pays that amount |
| 2026-10-23 | Wallets: the full amount goes to the hotel on payment (commission at check-out); a platform wallet holds StayReco's revenue; a transfer counts while the booking is still `PENDING` |
