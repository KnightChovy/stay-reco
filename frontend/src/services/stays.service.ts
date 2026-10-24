import { api } from "@/lib/axios";
import type {
  Amenity,
  HotelListing,
  HotelSearchQuery,
  HotelSearchResult,
  RoomTypeListing,
  StayQuery,
} from "@stayreco/shared";
import type { APIResponse, PageMeta } from "@/types/response.type";

/**
 * Public stay-browsing endpoints (docs/api/customer.md): search, hotel page and room type page.
 * No token is needed. `GET /hotels` requires both dates; the two listing endpoints work with or without them.
 */

export async function searchHotels(query: HotelSearchQuery) {
  const { data } = await api.get<APIResponse<HotelSearchResult[]>>("/hotels", {
    params: query,
    // `starRating` / `amenityIds` are repeated query keys (`?starRating=5&starRating=4`), not `starRating[]`.
    paramsSerializer: { indexes: null },
  });
  return { hotels: data.data, meta: data.meta as PageMeta };
}

export async function getHotelListing(hotelId: string, query: StayQuery = { guests: 2, rooms: 1 }) {
  const { data } = await api.get<APIResponse<HotelListing>>(`/hotels/${hotelId}/listing`, { params: query });
  return data.data;
}

export async function getRoomTypeListing(roomTypeId: string, query: StayQuery = { guests: 2, rooms: 1 }) {
  const { data } = await api.get<APIResponse<RoomTypeListing>>(`/room-types/${roomTypeId}/listing`, {
    params: query,
  });
  return data.data;
}

/** Amenities of the search filter; the public catalog does not need a hotel. */
export async function getAmenities() {
  const { data } = await api.get<APIResponse<Amenity[]>>("/amenities");
  return data.data;
}
