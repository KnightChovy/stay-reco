import type {
  APIResponse,
  Booking,
  BookingSummary,
  BookingVoucher,
  CreateBookingInput,
  MyBookingsQuery,
  PageMeta,
} from "@stayreco/shared";
import { apiService } from "./ApiService";

/** Giữ phòng 15 phút; booking trả về ở trạng thái PENDING kèm thông tin chuyển khoản. */
export const createBooking = async (payload: CreateBookingInput) => {
  const { data } = await apiService.post<APIResponse<Booking>>("/bookings", payload);
  return data.data;
};

export const getBooking = async (id: string) => {
  const { data } = await apiService.get<APIResponse<Booking>>(`/bookings/${id}`);
  return data.data;
};

export const getMyBookings = async (query: MyBookingsQuery) => {
  const { data } = await apiService.get<APIResponse<BookingSummary[]>>("/me/bookings", { params: query });
  return { bookings: data.data, meta: data.meta as PageMeta };
};

/** Chỉ có khi booking CONFIRMED / CHECKED_IN; trạng thái khác trả 409 BOOKING_STATUS_CONFLICT. */
export const getVoucher = async (id: string) => {
  const { data } = await apiService.get<APIResponse<BookingVoucher>>(`/bookings/${id}/voucher`);
  return data.data;
};

/** Chỉ chạy khi backend bật PAYMENT_SIMULATOR (dev); production trả 404. */
export const simulatePayment = async (id: string) => {
  const { data } = await apiService.post<APIResponse<Booking>>(`/dev/bookings/${id}/simulate-payment`);
  return data.data;
};
