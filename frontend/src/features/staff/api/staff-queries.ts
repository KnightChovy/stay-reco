"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AvailabilityQuery } from "@stayreco/shared";
import * as staffService from "@/services/staff.service";

export const staffKeys = {
  all: ["staff"] as const,
  hotels: () => [...staffKeys.all, "hotels"] as const,
  hotel: (hotelId: string) => [...staffKeys.all, "hotel", hotelId] as const,
  roomTypes: (hotelId: string) => [...staffKeys.all, "room-types", hotelId] as const,
  rooms: (hotelId: string, params: staffService.RoomListParams) =>
    [...staffKeys.all, "rooms", hotelId, params] as const,
  availability: (hotelId: string, params: AvailabilityQuery) =>
    [...staffKeys.all, "availability", hotelId, params] as const,
  booking: (bookingId: string) => [...staffKeys.all, "booking", bookingId] as const,
};

/** A staff member belongs to exactly one hotel; the partner owns it. */
export function useMyHotels() {
  return useQuery({ queryKey: staffKeys.hotels(), queryFn: staffService.getMyHotels });
}

export function useHotel(hotelId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.hotel(hotelId ?? ""),
    queryFn: () => staffService.getHotel(hotelId!),
    enabled: !!hotelId,
  });
}

export function useRoomTypes(hotelId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.roomTypes(hotelId ?? ""),
    queryFn: () => staffService.getRoomTypes(hotelId!),
    enabled: !!hotelId,
  });
}

export function useRooms(hotelId: string | undefined, params: staffService.RoomListParams) {
  return useQuery({
    queryKey: staffKeys.rooms(hotelId ?? "", params),
    queryFn: () => staffService.getRooms(hotelId!, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
  });
}

export function useAvailability(hotelId: string | undefined, params: AvailabilityQuery) {
  return useQuery({
    queryKey: staffKeys.availability(hotelId ?? "", params),
    queryFn: () => staffService.getAvailability(hotelId!, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
  });
}

export function useBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.booking(bookingId ?? ""),
    queryFn: () => staffService.getBooking(bookingId!),
    enabled: !!bookingId,
    // A booking changes while the guest pays or cancels; keep it fresh on the detail page.
    refetchOnWindowFocus: true,
  });
}
