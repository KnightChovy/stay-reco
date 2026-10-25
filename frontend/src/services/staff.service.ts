import { api } from "@/lib/axios";
import type {
  AvailabilityDay,
  AvailabilityQuery,
  Booking,
  Hotel,
  HotelSummary,
  Room,
  RoomListQuery,
  RoomType,
} from "@stayreco/shared";
import type { APIResponse, PageMeta } from "@/types/response.type";

/**
 * Endpoints a hotel staff member can call (docs/api/staff.md, docs/api/partner.md).
 * The booking list (`GET /hotels/:hotelId/bookings`) is not part of the API yet; when it arrives add it here.
 */

export type RoomListParams = Partial<RoomListQuery>;

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

/** Staff need the `BOOKING` or `REFUND` permission group; anyone else gets 403 or 404. */
export async function getBooking(bookingId: string) {
  const { data } = await api.get<APIResponse<Booking>>(`/bookings/${bookingId}`);
  return data.data;
}
