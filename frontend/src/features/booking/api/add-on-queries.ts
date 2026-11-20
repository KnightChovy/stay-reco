"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { AddBookingAddOnInput, Booking, CreateAddOnInput, UpdateAddOnInput } from "@stayreco/shared";
import * as addOnsService from "@/services/add-ons.service";

export const addOnKeys = {
  all: ["add-ons"] as const,
  hotel: (hotelId: string) => [...addOnKeys.all, "hotel", hotelId] as const,
};

/** The hotel catalogue (owner or staff), active first. */
export function useHotelAddOns(hotelId: string | undefined) {
  return useQuery({
    queryKey: addOnKeys.hotel(hotelId ?? ""),
    queryFn: () => addOnsService.getHotelAddOns(hotelId!),
    enabled: Boolean(hotelId),
  });
}

export function useCreateAddOn(hotelId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAddOnInput) => addOnsService.createAddOn(hotelId!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addOnKeys.hotel(hotelId ?? "") }),
  });
}

export function useUpdateAddOn(hotelId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addOnId, input }: { addOnId: string; input: UpdateAddOnInput }) =>
      addOnsService.updateAddOn(addOnId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addOnKeys.hotel(hotelId ?? "") }),
  });
}

/**
 * A front-desk line changes the booking every portal shows (staff, partner, customer) and the check-out quote, so
 * every cached query that names this booking id is refreshed rather than guessing each portal's key.
 */
function refreshBooking(queryClient: QueryClient, booking: Booking) {
  void queryClient.invalidateQueries({
    predicate: (query) => query.queryKey.some((part) => part === booking.id),
  });
}

export function useAddBookingAddOn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, input }: { bookingId: string; input: AddBookingAddOnInput }) =>
      addOnsService.addBookingAddOn(bookingId, input),
    onSuccess: (booking) => refreshBooking(queryClient, booking),
  });
}

export function useRemoveBookingAddOn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, lineId }: { bookingId: string; lineId: string }) =>
      addOnsService.removeBookingAddOn(bookingId, lineId),
    onSuccess: (booking) => refreshBooking(queryClient, booking),
  });
}
