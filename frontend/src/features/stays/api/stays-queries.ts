"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { HotelSearchQuery, StayQuery } from "@stayreco/shared";
import { useAuthStore } from "@/lib/auth-store";
import * as staysService from "@/services/stays.service";
import { toApiSearch } from "../lib/params";

export const staysKeys = {
  all: ["stays"] as const,
  search: (query: HotelSearchQuery, customerId?: string) => [...staysKeys.all, "search", customerId, query] as const,
  hotel: (hotelId: string, query: StayQuery) => [...staysKeys.all, "hotel", hotelId, query] as const,
  roomType: (roomTypeId: string, query: StayQuery) => [...staysKeys.all, "room-type", roomTypeId, query] as const,
  amenities: ["stays", "amenities"] as const,
};

export function useHotelSearch(query: HotelSearchQuery) {
  const customerId = useAuthStore((state) => state.user?.role === "customer" ? state.user.id : undefined);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  return useQuery({
    queryKey: staysKeys.search(query, customerId),
    queryFn: () => staysService.searchHotels(toApiSearch(query)),
    enabled: hasHydrated,
    placeholderData: (previous, source) => source?.queryKey[2] === customerId ? previous : undefined,
  });
}

/**
 * Filters suggested to the signed-in customer for this search; nothing for anyone else. Asked for the search without
 * the filters a suggestion can set (style, amenities, stars, free cancellation), page and sort, so the chips stay the
 * same and in place while the customer turns them on and off, as Airbnb's filter bar does.
 */
export function useFilterSuggestions(query: HotelSearchQuery) {
  const customerId = useAuthStore((state) => state.user?.role === "customer" ? state.user.id : undefined);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const search: HotelSearchQuery = {
    ...query,
    style: undefined,
    amenityIds: undefined,
    starRating: undefined,
    freeCancellation: undefined,
    page: 1,
    pageSize: 10,
    sort: "recommended",
  };
  return useQuery({
    queryKey: [...staysKeys.all, "filter-suggestions", customerId, search] as const,
    queryFn: () => staysService.getFilterSuggestions(toApiSearch(search)),
    enabled: hasHydrated && !!customerId,
    staleTime: 60_000,
  });
}

export function useHotelListing(hotelId: string | undefined, query: StayQuery) {
  return useQuery({
    queryKey: staysKeys.hotel(hotelId ?? "", query),
    queryFn: () => staysService.getHotelListing(hotelId!, query),
    // Changing the stay keeps the page on screen while the new prices load.
    placeholderData: keepPreviousData,
    enabled: !!hotelId,
  });
}

export function useRoomTypeListing(roomTypeId: string | undefined, query: StayQuery) {
  return useQuery({
    queryKey: staysKeys.roomType(roomTypeId ?? "", query),
    queryFn: () => staysService.getRoomTypeListing(roomTypeId!, query),
    // Changing the stay keeps the page on screen while the new prices load.
    placeholderData: keepPreviousData,
    enabled: !!roomTypeId,
  });
}

export function useAmenities() {
  return useQuery({ queryKey: staysKeys.amenities, queryFn: staysService.getAmenities, staleTime: Infinity });
}
