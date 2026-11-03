"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  lookup: (hotelId: string, query: { code?: string; qrToken?: string }) =>
    [...staffKeys.all, "lookup", hotelId, query] as const,
  roomOptions: (bookingId: string) => [...staffKeys.all, "room-options", bookingId] as const,
  checkOutQuote: (bookingId: string) => [...staffKeys.all, "check-out-quote", bookingId] as const,
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


/** UC37: find a booking at the front desk by code or voucher QR token. */
export function useBookingLookup(
  hotelId: string | undefined,
  query: { code?: string; qrToken?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: staffKeys.lookup(hotelId ?? "", query),
    queryFn: () => staffService.lookupBooking(hotelId!, query),
    enabled: !!hotelId && enabled && Boolean(query.code || query.qrToken),
    retry: false,
  });
}

/** UC38: held rooms and other free rooms of the same type. */
export function useRoomOptions(bookingId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: staffKeys.roomOptions(bookingId ?? ""),
    queryFn: () => staffService.getRoomOptions(bookingId!),
    enabled: !!bookingId && enabled,
    retry: false,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, roomIds }: { bookingId: string; roomIds?: string[] }) =>
      staffService.checkInBooking(bookingId, roomIds ? { roomIds } : {}),
    onSuccess: (booking) => {
      queryClient.setQueryData(staffKeys.booking(booking.id), booking);
      void queryClient.invalidateQueries({ queryKey: [...staffKeys.all, "lookup"] });
      // The booking is CHECKED_IN now: drop the old room-options entry instead of refetching it (409).
      queryClient.removeQueries({ queryKey: staffKeys.roomOptions(booking.id) });
    },
  });
}

/** UC39: the early checkout, late fee and paid amount shown before checking out. */
export function useCheckOutQuote(bookingId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: staffKeys.checkOutQuote(bookingId ?? ""),
    queryFn: () => staffService.getCheckOutQuote(bookingId!),
    enabled: !!bookingId && enabled,
    retry: false,
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      lateFee,
    }: {
      bookingId: string;
      lateFee?: { amount: number; reason: string };
    }) => staffService.checkOutBooking(bookingId, lateFee ? { lateFee } : {}),
    onSuccess: (booking) => {
      queryClient.setQueryData(staffKeys.booking(booking.id), booking);
      void queryClient.invalidateQueries({ queryKey: [...staffKeys.all, "lookup"] });
      // The booking is COMPLETED now: the quote endpoint only accepts CHECKED_IN, so remove it rather than refetch.
      queryClient.removeQueries({ queryKey: staffKeys.checkOutQuote(booking.id) });
      void queryClient.invalidateQueries({ queryKey: [...staffKeys.all, "rooms"] });
    },
  });
}

export function useCleanRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => staffService.cleanRoom(roomId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...staffKeys.all, "booking"] });
    },
  });
}
