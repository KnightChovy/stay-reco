# API: Partner dashboard *(Draft)*

> Status **Draft**: proposed by FE (2026-10-22), revised by BE against the booking data model (2026-10-28); becomes **Agreed** once FE confirms the revision. Built **before** the hotel operations phase, ahead of the rest of [phase 6](../phases/phase-6-reporting-admin.md) (decision PD8). FE screen: `partner/dashboard` (later also `staff/dashboard`). Rules for every API (envelope, errors, dates, money): [api-guide.md](../api-guide.md). URL rules: [CONVENTIONS.md §1](../../backend/docs/CONVENTIONS.md#1-api-url-naming). Money rules behind the figures: [money-rules.md](../money-rules.md).
>
> Uses the booking data that exists today (`booking`, `room_calendars`, `invoice`, `wallet_transaction`). Figures that need check-in / check-out (hotel operations phase) or reviews (loyalty phase) are `0` until those phases exist; the response shapes do not change when they arrive.

## 1. What the screen must answer

The dashboard answers the partner's questions, in this order (the top of the screen loads with **one or two requests**):

| # | Partner's question | Widget | Endpoint | First release |
|---|---|---|---|---|
| 1 | What needs me right now? | "Việc cần làm" list | `GET /hotels/:hotelId/action-items` | ✅ |
| 2 | What happens today at the hotel? | Today cards + arrivals list | `GET /hotels/:hotelId/stats/today` | ✅ |
| 3 | How is the business doing in this period, compared with the previous one? | KPI cards with ▲▼ | `GET /hotels/:hotelId/stats/overview` | ✅ |
| 4 | How did it evolve? | Revenue + occupancy chart | `GET /hotels/:hotelId/stats/series` | ✅ |
| 5 | How full am I in the coming weeks (should I change prices)? | 30-day occupancy heatmap | `GET /hotels/:hotelId/stats/occupancy-forecast` | ✅ |
| 6 | Which room types / channels perform best? | Breakdown tables | `GET /hotels/:hotelId/stats/breakdown` | later (§4.6) |
| 7 | (Several hotels) Which hotel needs attention? | Portfolio table | `GET /me/hotels/stats` | later (§4.7) |

Layout (desktop; on mobile the sections stack in the same order):

```
┌ Hotel picker ─────────────── Period: [Hôm nay|7 ngày|30 ngày|Tháng này|Tuỳ chọn]  Cập nhật 10:42 ┐
│ ① Việc cần làm (max 5, "Xem tất cả")                                                           │
│ ② Hôm nay: Đến 12 · Đi 7 · Đang lưu trú 18 · Phòng: 20 sẵn sàng / 4 đang dọn / 2 khoá          │
│ ③ KPI: Doanh thu phòng ▲12% · Thực nhận · Công suất ▲3,1 điểm · ADR · RevPAR · Booking · Huỷ · ★ │
│ ④ Chart doanh thu (cột) + công suất (đường), theo ngày/tuần/tháng                              │
│ ⑤ Lịch công suất 30 ngày tới (heatmap)      │ ⑥ Theo loại phòng / theo nguồn                    │
│ ② Khách đến hôm nay (5 dòng)                │ Ví: khả dụng · đang chờ                           │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

UX rules this API is designed for:

- **Every number has a comparison** (same-length previous period), so a card can show ▲▼ without a second request.
- **Zero, not 404 or `null`**, when there is no data: a new hotel shows `0` everywhere. `null` only means "cannot be computed" (for example ADR with 0 nights sold, or a change against a previous value of 0); the FE shows "—".
- **The FE never computes figures.** It formats what it receives (api-guide §3). Every rate and average comes from the backend with its definition below, so the web, the mobile app and the platform manager's reports show the same values.
- **Freshness is visible.** Every response has `generatedAt`; the FE shows "Cập nhật lúc HH:mm" and a refresh button.
- **Action items are codes, not sentences.** The backend sends `type` + parameters; the FE owns the Vietnamese wording and the target screen (same principle as error codes).
- Charts receive **continuous buckets** (empty days have zeros) so the FE does not fill gaps.

## 2. Common rules

| Rule | Value |
|---|---|
| Time zone | All day boundaries ("today", `from`/`to`, buckets) are computed in **Asia/Ho_Chi_Minh**. Timestamps in responses are ISO UTC. `date` columns (`check_in_date`, `room_calendars.date`) are already local dates. |
| Period query | `from`, `to`: `YYYY-MM-DD`, both inclusive (api-guide §5), sent **together or not at all** (only one → `VALIDATION_ERROR`, field `to`). Default: from the 1st of the current month to today. `from > to` → `VALIDATION_ERROR` (field `to`). Future dates are allowed (bookings already on the books). |
| Maximum range | `overview`: 366 days. `series`: depends on `granularity` (§4.4). Over the limit → `VALIDATION_ERROR` (field `to`). |
| Comparison period | The `n` days just before `from`, where `n` is the length of the period. Example: 2026-10-01..2026-10-21 is compared with 2026-09-10..2026-09-30. |
| Money | VND as JSON numbers. Revenue, earnings, commission and refunds are sums of whole-dong amounts (BR-29); ADR and RevPAR are rounded half up to 2 decimals. |
| Rates and averages | Percentages as numbers `0–100` with 1 decimal (`78.4`). The change of a rate is in **percentage points** (`deltaPoints` = value − previous, 1 decimal); the change of an amount, count or average is in **percent** (`deltaPercent` = (value − previous) / previous × 100, 1 decimal). Averages (stay length, lead time) have 1 decimal. |
| Access | *member* = the owner or a staff member of that hotel; *owner* = the partner who owns the hotel. Money and period KPIs are **owner only** (there is no accounting permission group for staff). Outsiders get `404 HOTEL_NOT_FOUND`; staff on an owner-only route get `403 FORBIDDEN`. |
| Suspended partner | All dashboard endpoints are reads, so they keep working while the partner is suspended. |
| Caching | None in the first release (PD4): figures are computed on each request, and `generatedAt` is that moment. A cache of up to 5 minutes per (hotel, query) may be added later if measurements require it, without changing the contract. |
| Performance target | p95 < 500 ms for `action-items`, `today`, `overview` on a hotel with 2 years of bookings. |

Shared shapes:

```jsonc
// Metric: a figure with its comparison
{ "value": 1254000000, "previous": 1119000000, "deltaPercent": 12.1 }    // amount, count or average
{ "value": 78.4, "previous": 75.3, "deltaPoints": 3.1 }                  // rate
// value / previous are null when they cannot be computed (e.g. ADR with no nights sold);
// deltaPercent is null when previous is 0 or null; deltaPoints is null when either side is null

// Period
{ "from": "2026-10-01", "to": "2026-10-21", "days": 21 }
```

## 3. Metric definitions (the contract BE implements)

A booking counts as **sold** when `status ∈ {CONFIRMED, CHECKED_IN, COMPLETED, NO_SHOW}` (PD2: no-show nights count, the room was held and the hotel keeps the money). `PENDING` (payment hold), `EXPIRED` and `CANCELLED` are not sold. A booking holds `num_rooms` rooms (1–8) of one room type, and `nightly_prices` stores the price of one room for each night, fixed at booking time.

| Metric | Field | Definition |
|---|---|---|
| Room nights sold | `roomNightsSold` | For sold bookings: each night (`checkInDate ≤ date < checkOutDate`) that falls in the period counts `num_rooms`. A stay across two months is split between them. |
| Room nights available | `roomNightsAvailable` | For each day of the period: rooms of the hotel that existed that day (Vietnam date of `room.createdAt` ≤ day) minus rooms with a `BLOCKED` `room_calendars` row that day. Summed over the days. Rooms in maintenance are **not** subtracted for past days (only the current room status is known, PD7). |
| Occupancy | `occupancyRate` | `roomNightsSold / roomNightsAvailable × 100`; `null` when available is 0. |
| Room revenue | `roomRevenue` | For sold bookings: the price of each night in the period from `nightly_prices`, × `num_rooms` (PD5). Prices already include VAT and service charge (BR-05); with no promotions yet this equals the amount paid. **Performance** revenue by stay date. |
| ADR | `adr` | `roomRevenue / roomNightsSold`, `null` when 0 nights. |
| RevPAR | `revpar` | `roomRevenue / roomNightsAvailable`, `null` when 0. |
| Bookings | `bookingsCreated` | Bookings whose Vietnam date of `createdAt` is in the period and whose status is neither `PENDING` nor `EXPIRED`, i.e. paid bookings, including those cancelled later (only paid bookings can be cancelled). Measures demand. |
| Cancellations | `cancellations`, `cancellationRate` | Bookings with `cancelledAt` in the period. Rate = `cancellations / bookingsCreated × 100` over the same period; `null` when `bookingsCreated` is 0. |
| Average stay | `avgLengthOfStay` | Average nights of the sold bookings whose `checkInDate` is in the period; `null` without such bookings. |
| Lead time | `avgLeadTimeDays` | Average `checkInDate − Vietnam date of createdAt` (days) of `bookingsCreated`; `null` when 0. |
| Rating | `avgRating`, `reviewCount` | `review.overallRating` of visible reviews created in the period; `avgRating` has 1 decimal, `null` without reviews. Reviews arrive with the loyalty phase: until then `null` / `0`. |
| Net received | `netEarnings` | **Cash basis**, from the hotel wallet ledger: the sum of the signed `amount` of the hotel wallet's `wallet_transaction` rows of type `BOOKING_PAYMENT`, `COMMISSION`, `REFUND`, `ADJUSTMENT` with `createdAt` in the period (payments are positive, refunds and commission negative). Excludes `PAYOUT` (money leaving the wallet is not a loss). |
| Commission | `commission` | Sum of the hotel's `COMMISSION` rows in the period, as a positive number. Commission is charged at check-out, so it is `0` until the hotel operations phase. |
| Refunds | `refunds` | Sum of the hotel's `REFUND` rows in the period, as a positive number. |

Two bases on purpose: **performance** figures (occupancy, room revenue, ADR) follow stay dates, which is how a hotel reads its month; **cash** figures (net earnings, commission, refunds, balances) follow the ledger, which is what reaches the partner and matches the revenue screen. The FE labels them differently ("Doanh thu phòng" vs "Thực nhận").

The commission is never recomputed from the partner's current rate: the rate is fixed on each booking (`booking.commission_rate`) and the amount is the `COMMISSION` ledger row written at check-out.

## 4. Endpoints

| Method | Path | Access | Query | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/action-items` | member (staff see only their types) | | `ActionItemList` |
| GET | `/hotels/:hotelId/stats/today` | member | `arrivalsLimit?` (default 5, 1–20) | `HotelTodayStats` |
| GET | `/hotels/:hotelId/stats/overview` | owner | `from?`, `to?` | `HotelStatsOverview` |
| GET | `/hotels/:hotelId/stats/series` | owner | `from?`, `to?`, `granularity?` | `HotelStatsSeries` |
| GET | `/hotels/:hotelId/stats/occupancy-forecast` | member | `days?` (default 30, 7–90) | `OccupancyForecast` |

Errors: `HOTEL_NOT_FOUND` (not the caller's hotel), `FORBIDDEN` (staff on an owner-only endpoint), `VALIDATION_ERROR` (bad dates, range too large, `granularity` / `days` / `arrivalsLimit` out of range). **No new error codes.**

### 4.1 `GET /hotels/:hotelId/action-items`

Things to act on, sorted by `severity` (CRITICAL → WARNING → INFO) and then by the order of the table. The list is short (no pagination): at most one item per type, with a `count`. Staff receive only the types of their permission groups (column *Staff*).

```jsonc
{
  "generatedAt": "2026-10-28T03:42:00.000Z",
  "items": [
    { "type": "VERIFICATION_NEEDS_REVISION", "severity": "CRITICAL", "count": 1, "params": { "requestId": "uuid" } },
    { "type": "REFUND_REQUESTS_PENDING", "severity": "WARNING", "count": 2, "params": { "oldestAt": "2026-10-27T08:15:00.000Z" } },
    { "type": "HIGH_DEMAND_DATES", "severity": "INFO", "count": 4, "params": { "firstDate": "2026-11-07", "threshold": 90 } }
  ]
}
```

| `type` | Severity | When | `params` | Staff | FE target |
|---|---|---|---|---|---|
| `VERIFICATION_NEEDS_REVISION` | CRITICAL | The hotel's latest verification request is `NEEDS_REVISION` or `REJECTED` (includes a manager's re-verification request) | `requestId` | — | `/partner/verification` |
| `REFUND_REQUESTS_PENDING` | WARNING | Bookings whose invoice is `REFUND_PENDING` (waiting for the hotel's decision) | `oldestAt` (when the oldest request was made) | REFUND | `/partner/bookings` (refund filter) |
| `SETUP_INCOMPLETE` | WARNING | Hotel `DRAFT` with missing steps (same steps as the FE onboarding checklist) | `missing`: subset of `["AMENITIES","POLICIES","IMAGES","ROOM_CONFIG","ROOMS"]` | — | `/partner/hotel` |
| `ROOMS_LOCKED_LONG` | WARNING | Rooms in `MAINTENANCE` for more than 7 days (from the audit log of the lock) | `roomIds`, `days` (7) | — | `/partner/rooms?status=MAINTENANCE` |
| `NO_AVAILABILITY_DATES` | WARNING | Days in the next 30 with no room left to sell **because of closures**: at least one `BLOCKED` room and booked + held + blocked ≥ sellable rooms | `dates` | — | availability |
| `STAFF_INVITES_PENDING` | INFO | Staff invitations still `INVITED` after 3 days | `staffIds` | — | `/partner/staff` |
| `VERIFICATION_PENDING` | INFO | A verification request is waiting for the platform manager | `submittedAt` | — | `/partner/verification` |
| `HIGH_DEMAND_DATES` | INFO | Days in the next 30 with forecast occupancy (§4.5) ≥ 90 % (hint: raise prices); `count` = number of days | `firstDate`, `threshold` (90) | — | pricing |

Types added with later phases (not sent before): `OVERDUE_CHECKOUTS` and arrivals not checked in (hotel operations, staff `FRONT_DESK`), `NEW_REVIEWS` (loyalty phase, staff `CUSTOMER_CARE`). The draft's `ARRIVALS_WITHOUT_ROOM` is dropped: a booking holds concrete rooms from the moment it is made (phase 2 decision P1), so no booking is ever without a room; room changes at check-in belong to the hotel operations phase.

Adding a type later is not a breaking change: the FE ignores unknown types (and logs them).

### 4.2 `GET /hotels/:hotelId/stats/today`

The day in Asia/Ho_Chi_Minh, live. Read by owners and staff; contains **no money**.

```jsonc
{
  "generatedAt": "2026-10-28T03:42:00.000Z",
  "date": "2026-10-28",
  "arrivals":   { "expected": 12, "checkedIn": 0 },          // bookings with checkInDate = today: CONFIRMED + CHECKED_IN; checkedIn = CHECKED_IN
  "departures": { "expected": 7,  "checkedOut": 0 },         // bookings with checkOutDate = today: CONFIRMED + CHECKED_IN + COMPLETED; checkedOut = COMPLETED
  "inHouse":    { "bookings": 0, "guests": 0 },              // CHECKED_IN now; guests = sum of numGuests
  "tonight":    { "roomsSold": 26, "roomsAvailable": 34, "occupancyRate": 76.5 },
  "rooms":      { "total": 36, "AVAILABLE": 30, "OCCUPIED": 0, "CLEANING": 4, "MAINTENANCE": 2 },  // current room.status
  "holds":      { "active": 2, "nextExpiresAt": "2026-10-28T03:55:00.000Z" },                  // PENDING bookings not expired yet
  "upcomingArrivals": [
    {
      "bookingId": "uuid",
      "code": "SR-261020-0842",
      "guestName": "Nguyễn Thanh Hà",
      "roomTypeName": "Deluxe River View",
      "nights": 3,
      "rooms": 1,
      "numGuests": 2,
      "arrivalTime": "14:00",             // start of the arrival window, null when not given
      "roomNumbers": ["501"],             // rooms held for tonight; staff may assign others of the type at check-in (BR-10)
      "status": "CONFIRMED",
      "paymentStatus": "PAID",            // REFUND_PENDING: the guest asked to cancel, the hotel has not decided
      "specialRequests": "Tầng cao"
    }
  ]
}
```

- `tonight.roomsSold` = rooms of the hotel with a `BOOKED` row for tonight; `roomsAvailable` = rooms not in `MAINTENANCE` minus rooms `BLOCKED` tonight; `occupancyRate` = sold / available × 100, `null` when available is 0.
- `checkedIn`, `checkedOut` and `inHouse` stay `0` until check-in / check-out exist (hotel operations phase).
- `upcomingArrivals`: today's arrivals still `CONFIRMED`, sorted by `arrivalTime` (empty last) then booking time; at most `arrivalsLimit`. The full list is the bookings screen (`GET /hotels/:hotelId/bookings`).

### 4.3 `GET /hotels/:hotelId/stats/overview`

The KPI cards for the period, each with its comparison, plus the wallet balances (cash position right now, not tied to the period).

```jsonc
{
  "generatedAt": "2026-10-28T03:42:00.000Z",
  "period":   { "from": "2026-10-01", "to": "2026-10-21", "days": 21 },
  "previous": { "from": "2026-09-10", "to": "2026-09-30", "days": 21 },
  "performance": {
    "roomRevenue":         { "value": 1254000000, "previous": 1119000000, "deltaPercent": 12.1 },
    "roomNightsSold":      { "value": 512, "previous": 470, "deltaPercent": 8.9 },
    "roomNightsAvailable": { "value": 756, "previous": 756, "deltaPercent": 0 },
    "occupancyRate":       { "value": 67.7, "previous": 62.2, "deltaPoints": 5.5 },
    "adr":                 { "value": 2449218.75, "previous": 2380851.06, "deltaPercent": 2.9 },
    "revpar":              { "value": 1658730.16, "previous": 1480158.73, "deltaPercent": 12.1 },
    "bookingsCreated":     { "value": 188, "previous": 171, "deltaPercent": 9.9 },
    "cancellations":       { "value": 12, "previous": 14, "deltaPercent": -14.3 },
    "cancellationRate":    { "value": 6.4, "previous": 8.2, "deltaPoints": -1.8 },
    "avgLengthOfStay":     { "value": 2.7, "previous": 2.5, "deltaPercent": 8 },
    "avgLeadTimeDays":     { "value": 11.3, "previous": 9.8, "deltaPercent": 15.3 }
  },
  "cash": {
    "netEarnings": { "value": 982500000, "previous": 901000000, "deltaPercent": 9 },
    "commission":  { "value": 0, "previous": 0, "deltaPercent": null },
    "refunds":     { "value": 32000000,  "previous": 41000000,  "deltaPercent": -22 }
  },
  "reviews": {
    "avgRating":   { "value": null, "previous": null, "deltaPercent": null },
    "reviewCount": { "value": 0, "previous": 0, "deltaPercent": null }
  },
  "wallet": { "available": 0, "pending": 428000000, "reserved": 0 }   // hotel wallet now; null if the hotel has no wallet yet
}
```

The FE colours the change by meaning, not by sign: a negative `cancellations`, `cancellationRate` or `refunds` change is good (green). Each field's direction is fixed by this table, so the BE does not send a colour.

### 4.4 `GET /hotels/:hotelId/stats/series`

| Query | Values | Default |
|---|---|---|
| `granularity` | `day` (max 92 days), `week` (max 53 weeks; weeks start on **Monday**), `month` (max 24 months) | `day` if the range is ≤ 31 days, `week` if ≤ 92 days, otherwise `month` |

Every bucket between `from` and `to` is present, with zeros when empty. The first and last buckets may be partial (cut by `from`/`to`); `days` says how many days they cover. Each point follows the definitions of §3 over its own days.

```jsonc
{
  "generatedAt": "2026-10-28T03:42:00.000Z",
  "granularity": "day",
  "period": { "from": "2026-10-01", "to": "2026-10-21", "days": 21 },
  "points": [
    {
      "periodStart": "2026-10-01",
      "days": 1,
      "roomRevenue": 54000000,
      "roomNightsSold": 22,
      "roomNightsAvailable": 36,
      "occupancyRate": 61.1,
      "adr": 2454545.45,
      "bookingsCreated": 9,
      "cancellations": 1,
      "netEarnings": 47200000
    }
  ]
}
```

The chart shows `roomRevenue` (bars) and `occupancyRate` (line) by default; the other fields let the user switch metric without a new request.

### 4.5 `GET /hotels/:hotelId/stats/occupancy-forecast`

"On the books" for the next `days` days, starting today, from `room_calendars`. No money, so staff can read it.

```jsonc
{
  "generatedAt": "2026-10-28T03:42:00.000Z",
  "from": "2026-10-28",
  "days": [
    { "date": "2026-11-07", "roomsTotal": 34, "booked": 31, "held": 1, "blocked": 1, "free": 1, "occupancyRate": 93.9 }
  ]
}
```

- `roomsTotal` = rooms not in `MAINTENANCE` (the same rooms the availability calendar counts as sellable, PD7); `booked` = `BOOKED` rows; `held` = `HELD` rows not expired yet; `blocked` = `BLOCKED` rows; `free` = `roomsTotal − booked − held − blocked` (not below 0).
- `occupancyRate` = `booked / (roomsTotal − blocked) × 100`, `null` when the denominator is 0. The FE draws a heatmap with fixed thresholds: < 50 %, 50–79 %, 80–89 %, ≥ 90 %.
- Every day of the range is present.

### 4.6 `GET /hotels/:hotelId/stats/breakdown` *(later)*

Not in the first release. FE's proposal kept for when it is built (owner, `from?`/`to?`, 366 days max):

- `byRoomType`: every room type of the hotel (also with 0 sales) with `rooms`, `roomNightsSold`, `occupancyRate`, `roomRevenue`, `adr`, sorted by `roomRevenue` desc; totals equal `overview.performance`.
- `bySource`: `AI_RECOMMENDATION` (`booking.recommendationId` set) > `PROMOTION` (`promotionId` or `voucherId` set) > `DIRECT`, each booking counted once; the sum equals `bookingsCreated`. Only `DIRECT` has values until recommendations and promotions exist.
- `byStatus`: bookings created in the period by current status. `byPaymentMethod`: `SEPAY` only for now.

### 4.7 `GET /me/hotels/stats` *(later)*

Not in the first release. For partners with 2 or more hotels: every hotel the partner owns, including `DRAFT` ones (with zeros), sorted by name, each with `roomRevenue`, `netEarnings`, `occupancyRate` (as `Metric`s), `avgRating` and `actionItems: { critical, warning }`, plus `totals` where `occupancyRate` is computed from the summed room nights, not as an average of hotel rates.

## 5. Shared types (in `packages/shared`, before the backend code)

| File | Content |
|---|---|
| `src/schemas/stats.ts` | `statsRangeQuerySchema` (`from` + `to` together, 366-day limit), `statsSeriesQuerySchema` (+ `granularity`, bucket limit per granularity), `occupancyForecastQuerySchema` (`days` 7–90, default 30), `todayStatsQuerySchema` (`arrivalsLimit` 1–20, default 5), `STATS_GRANULARITIES`, `STATS_LIMITS`, and the helpers `defaultGranularity(from, to)` and `statsBucketCount(from, to, granularity)` |
| `src/responses/stats.ts` | `Metric`, `RateMetric`, `StatsPeriod`, `ActionItem` (a union on `type`, so each type has typed `params`; + `ACTION_ITEM_TYPES`, `ACTION_ITEM_SEVERITIES`, `SETUP_STEPS`), `ActionItemList`, `TodayArrival`, `HotelTodayStats`, `HotelStatsOverview`, `StatsSeriesPoint`, `HotelStatsSeries`, `OccupancyForecastDay`, `OccupancyForecast`, all registered in `responseSchemas` for Swagger |

## 6. Backend notes

- **Module**: `modules/stats` (`StatsController`, `StatsService`, an action-items service), hotel access as in the other hotel routes: `member` for action items, today and forecast; `owner-view` (owner only, allowed while suspended) for overview and series.
- **Queries**: aggregate in SQL (`$queryRaw` with `generate_series` for the days and buckets, `jsonb_array_elements` over `nightly_prices`), never by loading bookings into memory. Day boundaries of `timestamptz` columns use `AT TIME ZONE 'Asia/Ho_Chi_Minh'`.
- **Tenant** (PD3): `booking` has no `hotel_id`; hotel-scoped queries join through `room_type` (`room_type.hotel_id`), covered by the indexes below. Adding `booking.hotel_id` is reconsidered only if a measurement shows it is needed.
- **Indexes** (one migration with the module, SQL shown to the user before it is applied): `booking(room_type_id, check_in_date)`, `booking(room_type_id, created_at)`, `room_calendars(date, status)`, `wallet_transaction(wallet_id, created_at)`. Reviews get `review(hotel_id, created_at)` with the loyalty phase.
- **Tests** (e2e): a hotel with bookings across a month boundary, a multi-room booking, a cancellation with and without refund, an expired hold, a blocked room and a refund; every metric of §3 checked against hand-computed values; partner A gets `HOTEL_NOT_FOUND` for partner B's hotel; staff get `FORBIDDEN` on owner-only routes and only their action item types.
- **Demo seed**: older bookings spread over a few months so the chart and the KPIs have values for screenshots.

## 7. Decisions (2026-10-28)

| # | Question | Decision |
|---|---|---|
| PD1 | Scope of the first release | `action-items`, `today`, `overview`, `series`, `occupancy-forecast`; `breakdown` and `/me/hotels/stats` later |
| PD2 | Do `NO_SHOW` nights count in occupancy and room revenue? | Yes: the room was held and the hotel keeps the money |
| PD3 | Add `hotel_id` to `booking`? | No for now: join through `room_type` with indexes |
| PD4 | 5-minute cache? | No cache in the first release; `generatedAt` is still sent |
| PD5 | What is room revenue? | Nightly prices × rooms from `nightly_prices` (prices include VAT, BR-05); revisited when promotions arrive |
| PD6 | URL group | `/hotels/:hotelId/stats/...` (reusable for the platform manager's `/stats/...`) and `/hotels/:hotelId/action-items` |
| PD7 | Rooms in maintenance | Not subtracted for past days (only the current status is known); the forecast counts rooms not in `MAINTENANCE`, like the availability calendar |
| PD8 | When | Built before the hotel operations phase, ahead of the rest of phase 6 |

Changes from FE's draft (2026-10-22), because of the booking data model: bookings hold `num_rooms` rooms and store `nightly_prices`, so room nights and revenue use them instead of "one booking = one room" and an even split of the total; `bookingsCreated` is "paid, possibly cancelled later"; `REFUND_REQUESTS_PENDING` already works (refunds were built with bookings); `ARRIVALS_WITHOUT_ROOM` dropped; arrivals show `code`, `rooms`, `arrivalTime` and `roomNumbers` instead of `roomNumber`; `cancellations` added to `overview`; access `owner-view` so suspended partners keep their reports.

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-10-28 | BE | Revised against the booking data model; decisions PD1–PD8; first release scoped to five endpoints |
| 2026-10-22 | FE | Draft proposal |
