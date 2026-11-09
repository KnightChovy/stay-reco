import { api } from "@/lib/axios";
import type {
  ActionItemList,
  AvailabilityDay,
  AvailabilityQuery,
  Booking,
  BookingSummary,
  CheckInInput,
  CheckOutInput,
  CheckOutQuote,
  Hotel,
  HotelBookingsQuery,
  HotelSummary,
  HotelTodayStats,
  OccupancyForecast,
  PricingRule,
  RoomTypeListing,
  Room,
  RoomListQuery,
  ForwardRefundInput,
  RejectChangeInput,
  RoomOptions,
  RoomType,
} from "@stayreco/shared";
import type { APIResponse, PageMeta } from "@/types/response.type";

/**
 * Endpoints a hotel staff member can call (docs/api/staff.md, docs/api/partner.md).
 */

export type RoomListParams = Partial<RoomListQuery>;
export type HotelBookingsParams = Partial<HotelBookingsQuery>;

export async function getMyHotels() {
  const { data } = await api.get<APIResponse<HotelSummary[]>>("/me/hotels");
  return data.data;
}

export async function getHotel(hotelId: string) {
  const { data } = await api.get<APIResponse<Hotel>>(`/hotels/${hotelId}`);
  return data.data;
}

export async function getRoomTypes(hotelId: string) {
  const { data } = await api.get<APIResponse<RoomType[]>>(`/hotels/${hotelId}/room-types`);
  return data.data;
}

export async function getRooms(hotelId: string, params: RoomListParams = {}) {
  const { data } = await api.get<APIResponse<Room[]>>(`/hotels/${hotelId}/rooms`, { params });
  return { rooms: data.data, meta: data.meta as PageMeta | undefined };
}

export async function getAvailability(hotelId: string, params: AvailabilityQuery) {
  const { data } = await api.get<APIResponse<AvailabilityDay[]>>(`/hotels/${hotelId}/availability`, {
    params,
  });
  return data.data;
}

/** Read-only for staff (docs/api/staff.md); highest priority first. */
export async function getPricingRules(hotelId: string) {
  const { data } = await api.get<APIResponse<PricingRule[]>>(`/hotels/${hotelId}/pricing-rules`);
  return data.data;
}

/**
 * The price of each night of a stay for one room, as a guest booking today would pay it (the same price engine as the
 * search). One call per room type instead of one `price-preview` per night.
 */
export async function getNightlyPrices(roomTypeId: string, checkIn: string, checkOut: string) {
  const { data } = await api.get<APIResponse<RoomTypeListing>>(`/room-types/${roomTypeId}/listing`, {
    params: { checkIn, checkOut, guests: 1, rooms: 1 },
  });
  return data.data.offer?.nightlyPrices ?? [];
}

/** Staff need the `BOOKING` or `REFUND` permission group; anyone else gets 403 or 404. */
export async function getBooking(bookingId: string) {
  const { data } = await api.get<APIResponse<Booking>>(`/bookings/${bookingId}`);
  return data.data;
}

// ── Front desk: check-in / check-out (docs/api/staff.md) ─────

/** UC37: the booking code typed at the desk (dashes optional) or the token read from the voucher QR. */
export async function lookupBooking(
  hotelId: string,
  query: { code?: string; qrToken?: string },
) {
  const { data } = await api.get<APIResponse<Booking>>(`/hotels/${hotelId}/bookings/lookup`, {
    params: query,
  });
  return data.data;
}

/** UC38, BR-10: held rooms plus other free rooms of the same type, for check-in assignment. */
export async function getRoomOptions(bookingId: string) {
  const { data } = await api.get<APIResponse<RoomOptions>>(`/bookings/${bookingId}/room-options`);
  return data.data;
}

export async function checkInBooking(bookingId: string, input: CheckInInput = {}) {
  const { data } = await api.post<APIResponse<Booking>>(`/bookings/${bookingId}/check-in`, input);
  return data.data;
}

/** UC39: what checking out now means (early checkout, late fee, amount paid). */
export async function getCheckOutQuote(bookingId: string) {
  const { data } = await api.get<APIResponse<CheckOutQuote>>(`/bookings/${bookingId}/check-out-quote`);
  return data.data;
}

export async function checkOutBooking(bookingId: string, input: CheckOutInput = {}) {
  const { data } = await api.post<APIResponse<Booking>>(`/bookings/${bookingId}/check-out`, input);
  return data.data;
}

/** `CLEANING` → `AVAILABLE` after the room is cleaned. */
export async function cleanRoom(roomId: string) {
  const { data } = await api.post<APIResponse<Room>>(`/rooms/${roomId}/clean`);
  return data.data;
}


/** UC57: the hotel's bookings, with the refund queue as `paymentStatus: ['REFUND_PENDING']`. */
export async function getHotelBookings(hotelId: string, params: HotelBookingsParams = {}) {
  const { data } = await api.get<APIResponse<BookingSummary[]>>(`/hotels/${hotelId}/bookings`, {
    params,
    paramsSerializer: { indexes: null },
  });
  return { bookings: data.data, meta: data.meta as PageMeta };
}

/** Decisions O4/O5: the guest never arrived; the hotel keeps the payment and the nights are released. */
export async function markNoShow(bookingId: string) {
  const { data } = await api.post<APIResponse<Booking>>(`/bookings/${bookingId}/no-show`);
  return data.data;
}

/** UC43: accept the waiting guest-detail change request. */
export async function acceptBookingChange(bookingId: string) {
  const { data } = await api.post<APIResponse<Booking>>(`/bookings/${bookingId}/accept-change`);
  return data.data;
}

/** UC43: reject the waiting change request with a reason shown to the customer. */
export async function rejectBookingChange(bookingId: string, input: RejectChangeInput) {
  const { data } = await api.post<APIResponse<Booking>>(`/bookings/${bookingId}/reject-change`, input);
  return data.data;
}

/** Staff with `REFUND` forward the customer's refund request to the partner. */
export async function forwardRefund(bookingId: string, input: ForwardRefundInput) {
  const { data } = await api.post<APIResponse<Booking>>(`/bookings/${bookingId}/forward-refund`, input);
  return data.data;
}

// ── Dashboard (member access) ───────────────────────────────

/** Things that need someone's attention (overdue check-outs, refund and change requests…). */
export async function getActionItems(hotelId: string) {
  const { data } = await api.get<APIResponse<ActionItemList>>(`/hotels/${hotelId}/action-items`);
  return data.data;
}

/** Today at the hotel: arrivals, departures, in-house guests, rooms by status. */
export async function getTodayStats(hotelId: string) {
  const { data } = await api.get<APIResponse<HotelTodayStats>>(`/hotels/${hotelId}/stats/today`);
  return data.data;
}

/** Occupancy of the next days. */
export async function getOccupancyForecast(hotelId: string, days?: number) {
  const { data } = await api.get<APIResponse<OccupancyForecast>>(
    `/hotels/${hotelId}/stats/occupancy-forecast`,
    { params: days ? { days } : undefined },
  );
  return data.data;
}
