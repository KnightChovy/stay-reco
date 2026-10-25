import type { APIResponse, HotelListing, HotelSearchQuery, HotelSearchResult, PageMeta, StayQuery } from "@stayreco/shared";
import { apiService } from "./ApiService";

/** Tìm kiếm và trang khách sạn công khai (docs/api/customer.md), giống frontend/src/services/stays.service.ts. */

export const searchHotels = async (query: HotelSearchQuery) => {
  const { data } = await apiService.get<APIResponse<HotelSearchResult[]>>("/hotels", {
    params: query,
    // `starRating` lặp lại khóa (`?starRating=5&starRating=4`), không phải `starRating[]`.
    paramsSerializer: { indexes: null },
  });
  return { hotels: data.data, meta: data.meta as PageMeta };
};

export const getHotelListing = async (hotelId: string, query: StayQuery) => {
  const { data } = await apiService.get<APIResponse<HotelListing>>(`/hotels/${hotelId}/listing`, { params: query });
  return data.data;
};

/** Màn khách sạn và màn đặt phòng dùng chung key nên màn đặt phòng đọc lại từ cache. */
export const hotelListingQuery = (hotelId: string, { checkIn, checkOut, guests, rooms }: Required<StayQuery>) => ({
  queryKey: ["stays", "hotel", hotelId, { checkIn, checkOut, guests, rooms }],
  queryFn: () => getHotelListing(hotelId, { checkIn, checkOut, guests, rooms }),
});
