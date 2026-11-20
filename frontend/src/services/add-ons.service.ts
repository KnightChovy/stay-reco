import type {
  AddBookingAddOnInput,
  Booking,
  CreateAddOnInput,
  HotelAddOn,
  UpdateAddOnInput,
} from "@stayreco/shared";
import { api } from "@/lib/axios";
import type { APIResponse } from "@/types/response.type";

/**
 * Hotel add-ons (docs/api/add-ons.md): the catalogue a hotel sells on top of the room, and the front-desk lines staff
 * put on a stay. Customers book prepaid add-ons through `POST /bookings` (`addOns`), not here.
 */

/** Every add-on of the hotel, active first. Owner or any staff member. */
export async function getHotelAddOns(hotelId: string) {
  const { data } = await api.get<APIResponse<HotelAddOn[]>>(`/hotels/${hotelId}/add-ons`);
  return data.data;
}

export async function createAddOn(hotelId: string, input: CreateAddOnInput) {
  const { data } = await api.post<APIResponse<HotelAddOn>>(`/hotels/${hotelId}/add-ons`, input);
  return data.data;
}

/** Bookings keep the name and price they were sold at; `isActive: false` takes it off sale. */
export async function updateAddOn(addOnId: string, input: UpdateAddOnInput) {
  const { data } = await api.patch<APIResponse<HotelAddOn>>(`/add-ons/${addOnId}`, input);
  return data.data;
}

/** A service used during the stay, collected at the desk at check-out. Owner or staff with `FRONT_DESK`. */
export async function addBookingAddOn(bookingId: string, input: AddBookingAddOnInput) {
  const { data } = await api.post<APIResponse<Booking>>(`/bookings/${bookingId}/add-ons`, input);
  return data.data;
}

/** Only `FRONT_DESK` lines can be removed. */
export async function removeBookingAddOn(bookingId: string, lineId: string) {
  const { data } = await api.delete<APIResponse<Booking>>(`/bookings/${bookingId}/add-ons/${lineId}`);
  return data.data;
}
