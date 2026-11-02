import type {
  APIResponse,
  Booking,
  BookingSummary,
  BookingVoucher,
  CancelBookingInput,
  CancellationQuote,
  ChangeRequestInput,
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

/** Phí hủy và số tiền hoàn nếu hủy ngay bây giờ (MSG11), cùng điều kiện trạng thái như khi hủy. */
export const getCancellationQuote = async (id: string) => {
  const { data } = await apiService.get<APIResponse<CancellationQuote>>(`/bookings/${id}/cancellation-quote`);
  return data.data;
};

/** Hoàn 0đ thì hủy ngay; có tiền hoàn thì booking vẫn CONFIRMED và chờ khách sạn duyệt (REFUND_PENDING). */
export const cancelBooking = async (id: string, payload: CancelBookingInput) => {
  const { data } = await apiService.post<APIResponse<Booking>>(`/bookings/${id}/cancel`, payload);
  return data.data;
};

/** Chỉ khi CONFIRMED, mỗi lần một yêu cầu; khách sạn duyệt rồi mới đổi (xem `changeRequest` trong booking). */
export const requestChange = async (id: string, payload: ChangeRequestInput) => {
  const { data } = await apiService.post<APIResponse<Booking>>(`/bookings/${id}/change-request`, payload);
  return data.data;
};

/** Chỉ chạy khi backend bật PAYMENT_SIMULATOR (dev); production trả 404. */
export const simulatePayment = async (id: string) => {
  const { data } = await apiService.post<APIResponse<Booking>>(`/dev/bookings/${id}/simulate-payment`);
  return data.data;
};
