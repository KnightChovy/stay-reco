"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { HotelSearchQuery, StayQuery } from "@stayreco/shared";
import * as staysService from "@/services/stays.service";

export const staysKeys = {
  all: ["stays"] as const,
  search: (query: HotelSearchQuery) => [...staysKeys.all, "search", query] as const,
  hotel: (hotelId: string, query: StayQuery) => [...staysKeys.all, "hotel", hotelId, query] as const,
  roomType: (roomTypeId: string, query: StayQuery) => [...staysKeys.all, "room-type", roomTypeId, query] as const,
  amenities: ["stays", "amenities"] as const,
};

export function useHotelSearch(query: HotelSearchQuery) {
  return useQuery({
    queryKey: staysKeys.search(query),
    queryFn: () => staysService.searchHotels(query),
    placeholderData: keepPreviousData,
  });
}

export function useHotelListing(hotelId: string | undefined, query: StayQuery) {
  return useQuery({
    queryKey: staysKeys.hotel(hotelId ?? "", query),
    queryFn: () => staysService.getHotelListing(hotelId!, query),
    enabled: !!hotelId,
  });
}

export function useRoomTypeListing(roomTypeId: string | undefined, query: StayQuery) {
  return useQuery({
    queryKey: staysKeys.roomType(roomTypeId ?? "", query),
    queryFn: () => staysService.getRoomTypeListing(roomTypeId!, query),
    enabled: !!roomTypeId,
  });
}

export function useAmenities() {
  return useQuery({ queryKey: staysKeys.amenities, queryFn: staysService.getAmenities, staleTime: Infinity });
}
