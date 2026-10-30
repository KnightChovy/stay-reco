import { api } from "@/lib/axios";
import type {
  Booking,
  BookingSummary,
  BookingVoucher,
  CancelBookingInput,
  CancellationQuote,
  CreateBookingInput,
  MyBookingsQuery,
} from "@stayreco/shared";
import type { APIResponse, PageMeta } from "@/types/response.type";

/**
 * Customer booking endpoints (docs/api/customer.md).
 * `POST /bookings` holds the rooms for 15 minutes; the payment page polls `GET /bookings/:id`.
 */

export async function createBooking(input: CreateBookingInput) {
  const { data } = await api.post<APIResponse<Booking>>("/bookings", input);
  return data.data;
}

export async function getBooking(bookingId: string) {
  const { data } = await api.get<APIResponse<Booking>>(`/bookings/${bookingId}`);
  return data.data;
}

/** My trips. `tab` is one of upcoming / staying / completed / cancelled; `search` matches the booking code. */
export async function getMyBookings(params: Partial<MyBookingsQuery> = {}) {
  const { data } = await api.get<APIResponse<BookingSummary[]>>("/me/bookings", {
    params,
    paramsSerializer: { indexes: null },
  });
  return { bookings: data.data, meta: data.meta as PageMeta };
}

export async function getBookingVoucher(bookingId: string) {
  const { data } = await api.get<APIResponse<BookingVoucher>>(`/bookings/${bookingId}/voucher`);
  return data.data;
}

export async function getCancellationQuote(bookingId: string) {
  const { data } = await api.get<APIResponse<CancellationQuote>>(
    `/bookings/${bookingId}/cancellation-quote`,
  );
  return data.data;
}

export async function cancelBooking(bookingId: string, input: CancelBookingInput) {
  const { data } = await api.post<APIResponse<Booking>>(`/bookings/${bookingId}/cancel`, input);
  return data.data;
}
