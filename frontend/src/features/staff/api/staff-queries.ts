"use client";

import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AvailabilityQuery } from "@stayreco/shared";
import * as staffService from "@/services/staff.service";
import { getApiErrorCode } from "@/lib/api-error";

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
  hotelBookings: (hotelId: string, params: staffService.HotelBookingsParams) =>
    [...staffKeys.all, "hotel-bookings", hotelId, params] as const,
  lookup: (hotelId: string, query: { code?: string; qrToken?: string }) =>
    [...staffKeys.all, "lookup", hotelId, query] as const,
  roomOptions: (bookingId: string) => [...staffKeys.all, "room-options", bookingId] as const,
  checkOutQuote: (bookingId: string) => [...staffKeys.all, "check-out-quote", bookingId] as const,
  pricingRules: (hotelId: string) => [...staffKeys.all, "pricing-rules", hotelId] as const,
  nightlyPrices: (roomTypeId: string, checkIn: string, checkOut: string) =>
    [...staffKeys.all, "nightly-prices", roomTypeId, checkIn, checkOut] as const,
  actionItems: (hotelId: string) => [...staffKeys.all, "action-items", hotelId] as const,
  todayStats: (hotelId: string) => [...staffKeys.all, "stats-today", hotelId] as const,
  occupancyForecast: (hotelId: string, days: number) =>
    [...staffKeys.all, "occupancy-forecast", hotelId, days] as const,
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


export function usePricingRules(hotelId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.pricingRules(hotelId ?? ""),
    queryFn: () => staffService.getPricingRules(hotelId!),
    enabled: !!hotelId,
  });
}

/** Nightly prices of several room types over the same range, one query each. */
export function useNightlyPrices(roomTypeIds: string[], checkIn: string, checkOut: string) {
  return useQueries({
    queries: roomTypeIds.map((roomTypeId) => ({
      queryKey: staffKeys.nightlyPrices(roomTypeId, checkIn, checkOut),
      queryFn: () => staffService.getNightlyPrices(roomTypeId, checkIn, checkOut),
      placeholderData: keepPreviousData,
    })),
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
      // The room board and the dashboard room counts change with it.
      void queryClient.invalidateQueries({ queryKey: [...staffKeys.all, "rooms"] });
      void queryClient.invalidateQueries({ queryKey: [...staffKeys.all, "stats-today"] });
    },
    onError: (error) => {
      // Someone else changed the room meanwhile: show the board as it is now.
      if (getApiErrorCode(error) === "ROOM_STATUS_CONFLICT") {
        void queryClient.invalidateQueries({ queryKey: [...staffKeys.all, "rooms"] });
      }
    },
  });
}


/** UC57: the hotel's bookings (filters/pagination); `paymentStatus: ["REFUND_PENDING"]` is the refund queue. */
export function useHotelBookings(hotelId: string | undefined, params: staffService.HotelBookingsParams) {
  return useQuery({
    queryKey: staffKeys.hotelBookings(hotelId ?? "", params),
    queryFn: () => staffService.getHotelBookings(hotelId!, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  });
}

function useBookingAction<TVariables, TResult>(
  fn: (variables: TVariables) => Promise<TResult>,
  bookingIdOf: (variables: TVariables) => string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.booking(bookingIdOf(variables)) });
      queryClient.invalidateQueries({ queryKey: [...staffKeys.all, "lookup"] });
      queryClient.invalidateQueries({ queryKey: [...staffKeys.all, "hotel-bookings"] });
    },
  });
}

/** Decisions O4/O5: mark a paid, confirmed guest as a no-show. */
export function useNoShow() {
  return useBookingAction(
    (bookingId: string) => staffService.markNoShow(bookingId),
    (bookingId) => bookingId,
  );
}

/** UC43: accept the waiting guest-detail change request. */
export function useAcceptChange() {
  return useBookingAction(
    (bookingId: string) => staffService.acceptBookingChange(bookingId),
    (bookingId) => bookingId,
  );
}

/** UC43: reject the waiting change request with a reason. */
export function useRejectChange() {
  return useBookingAction(
    ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      staffService.rejectBookingChange(bookingId, { reason }),
    ({ bookingId }) => bookingId,
  );
}

/** Staff with REFUND forward the request to the partner with a note. */
export function useForwardRefund() {
  return useBookingAction(
    ({ bookingId, note }: { bookingId: string; note: string }) =>
      staffService.forwardRefund(bookingId, { note }),
    ({ bookingId }) => bookingId,
  );
}

// ── Dashboard ───────────────────────────────────────────────

/** Counts change as guests arrive and leave: refresh every minute while the dashboard is open. */
const DASHBOARD_REFRESH_MS = 60_000;

export function useActionItems(hotelId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.actionItems(hotelId ?? ""),
    queryFn: () => staffService.getActionItems(hotelId!),
    enabled: !!hotelId,
    refetchInterval: DASHBOARD_REFRESH_MS,
  });
}

export function useTodayStats(hotelId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.todayStats(hotelId ?? ""),
    queryFn: () => staffService.getTodayStats(hotelId!),
    enabled: !!hotelId,
    refetchInterval: DASHBOARD_REFRESH_MS,
  });
}

export function useOccupancyForecast(hotelId: string | undefined, days = 14) {
  return useQuery({
    queryKey: staffKeys.occupancyForecast(hotelId ?? "", days),
    queryFn: () => staffService.getOccupancyForecast(hotelId!, days),
    enabled: !!hotelId,
  });
}
