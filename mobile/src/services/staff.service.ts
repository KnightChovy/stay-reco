import type {
  ActionItemList,
  APIResponse,
  Booking,
  BookingSummary,
  CheckInInput,
  CheckOutInput,
  CheckOutQuote,
  ForwardRefundInput,
  HotelBookingsQuery,
  HotelSummary,
  HotelTodayStats,
  PageMeta,
  RejectChangeInput,
  RoomOptions,
} from "@stayreco/shared";
import { apiService } from "./ApiService";

/** Khách sạn nhân viên được phân công (cùng endpoint với StaffHotelProvider bên web). */
export const getMyHotels = async () => {
  const { data } = await apiService.get<APIResponse<HotelSummary[]>>("/me/hotels");
  return data.data;
};

// Cùng endpoint với frontend/src/services/staff.service.ts (docs/api/staff.md).

/** Danh sách đơn của khách sạn; hàng đợi hoàn tiền là `paymentStatus: ['REFUND_PENDING']`. */
export const getHotelBookings = async (hotelId: string, params: Partial<HotelBookingsQuery> = {}) => {
  const { data } = await apiService.get<APIResponse<BookingSummary[]>>(`/hotels/${hotelId}/bookings`, {
    params,
    // `status` lặp key (`?status=A&status=B`), không dùng `status[]`.
    paramsSerializer: { indexes: null },
  });
  return { bookings: data.data, meta: data.meta as PageMeta };
};

/** Token QR trên voucher có dấu chấm, mã đơn thì không: cùng quy ước với trang web. */
export const toLookup = (raw: string) => (raw.includes(".") ? { qrToken: raw } : { code: raw });

/** Mã đơn gõ tại quầy (có hoặc không dấu gạch) hoặc token QR trên voucher, đúng một trong hai. */
export const lookupBooking = async (hotelId: string, query: { code?: string; qrToken?: string }) => {
  const { data } = await apiService.get<APIResponse<Booking>>(`/hotels/${hotelId}/bookings/lookup`, { params: query });
  return data.data;
};

/** Phòng đang giữ cho đơn và các phòng trống khác cùng hạng (BR-10). */
export const getRoomOptions = async (bookingId: string) => {
  const { data } = await apiService.get<APIResponse<RoomOptions>>(`/bookings/${bookingId}/room-options`);
  return data.data;
};

export const checkInBooking = async (bookingId: string, input: CheckInInput = {}) => {
  const { data } = await apiService.post<APIResponse<Booking>>(`/bookings/${bookingId}/check-in`, input);
  return data.data;
};

/** Trả phòng ngay lúc này nghĩa là gì: trả sớm, phí trả muộn, số tiền đã thanh toán. */
export const getCheckOutQuote = async (bookingId: string) => {
  const { data } = await apiService.get<APIResponse<CheckOutQuote>>(`/bookings/${bookingId}/check-out-quote`);
  return data.data;
};

export const checkOutBooking = async (bookingId: string, input: CheckOutInput = {}) => {
  const { data } = await apiService.post<APIResponse<Booking>>(`/bookings/${bookingId}/check-out`, input);
  return data.data;
};

export const markNoShow = async (bookingId: string) => {
  const { data } = await apiService.post<APIResponse<Booking>>(`/bookings/${bookingId}/no-show`);
  return data.data;
};

export const acceptBookingChange = async (bookingId: string) => {
  const { data } = await apiService.post<APIResponse<Booking>>(`/bookings/${bookingId}/accept-change`);
  return data.data;
};

export const rejectBookingChange = async (bookingId: string, input: RejectChangeInput) => {
  const { data } = await apiService.post<APIResponse<Booking>>(`/bookings/${bookingId}/reject-change`, input);
  return data.data;
};

/** Staff có quyền REFUND chuyển yêu cầu hoàn tiền của khách lên partner kèm ghi chú. */
export const forwardRefund = async (bookingId: string, input: ForwardRefundInput) => {
  const { data } = await apiService.post<APIResponse<Booking>>(`/bookings/${bookingId}/forward-refund`, input);
  return data.data;
};

export const getActionItems = async (hotelId: string) => {
  const { data } = await apiService.get<APIResponse<ActionItemList>>(`/hotels/${hotelId}/action-items`);
  return data.data;
};

export const getTodayStats = async (hotelId: string) => {
  const { data } = await apiService.get<APIResponse<HotelTodayStats>>(`/hotels/${hotelId}/stats/today`);
  return data.data;
};
