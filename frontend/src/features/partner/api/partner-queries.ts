"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { usePartnerActions } from "../components/PartnerActionProvider";

export const partnerKeys = {
  all: ["partner"] as const,
  hotels: () => [...partnerKeys.all, "hotels"] as const,
  hotel: (hotelId: string) => [...partnerKeys.all, "hotel", hotelId] as const,
  roomTypes: (hotelId: string) => [...partnerKeys.all, "room-types", hotelId] as const,
  roomsOf: (hotelId: string) => [...partnerKeys.all, "rooms", hotelId] as const,
  rooms: (hotelId: string, params: partnerService.RoomListParams) =>
    [...partnerKeys.roomsOf(hotelId), params] as const,
  staff: (hotelId: string) => [...partnerKeys.all, "staff", hotelId] as const,
  verifications: (hotelId: string) => [...partnerKeys.all, "verifications", hotelId] as const,
  verification: (requestId: string) => [...partnerKeys.all, "verification", requestId] as const,
  pricingRules: (hotelId: string) => [...partnerKeys.all, "pricing-rules", hotelId] as const,
  pricePreview: (roomTypeId: string, date: string, bookedOn: string) =>
    [...partnerKeys.all, "price-preview", roomTypeId, date, bookedOn] as const,
  availabilityOf: (hotelId: string) => [...partnerKeys.all, "availability", hotelId] as const,
  availability: (hotelId: string, from: string, to: string) =>
    [...partnerKeys.availabilityOf(hotelId), from, to] as const,
  bookingsOf: (hotelId: string) => [...partnerKeys.all, "bookings", hotelId] as const,
  bookings: (hotelId: string, params: partnerService.HotelBookingsParams) =>
    [...partnerKeys.bookingsOf(hotelId), params] as const,
  booking: (bookingId: string) => [...partnerKeys.all, "booking", bookingId] as const,
};

const catalogKeys = {
  amenities: ["catalog", "amenities"] as const,
  bedTypes: ["catalog", "bed-types"] as const,
};

// ── Queries ─────────────────────────────────────────────────

export function useMyHotels() {
  return useQuery({ queryKey: partnerKeys.hotels(), queryFn: partnerService.getMyHotels });
}

export function useHotel(hotelId: string | undefined) {
  return useQuery({
    queryKey: partnerKeys.hotel(hotelId ?? ""),
    queryFn: () => partnerService.getHotel(hotelId!),
    enabled: !!hotelId,
  });
}

/** The catalog changes rarely; one fetch per session is enough. */
export function useAmenities() {
  return useQuery({ queryKey: catalogKeys.amenities, queryFn: partnerService.getAmenities, staleTime: Infinity });
}

export function useBedTypes() {
  return useQuery({ queryKey: catalogKeys.bedTypes, queryFn: partnerService.getBedTypes, staleTime: Infinity });
}

export function useRoomTypes(hotelId: string | undefined) {
  return useQuery({
    queryKey: partnerKeys.roomTypes(hotelId ?? ""),
    queryFn: () => partnerService.getRoomTypes(hotelId!),
    enabled: !!hotelId,
  });
}

export function useRooms(hotelId: string | undefined, params: partnerService.RoomListParams) {
  return useQuery({
    queryKey: partnerKeys.rooms(hotelId ?? "", params),
    queryFn: () => partnerService.getRooms(hotelId!, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
  });
}

export function useHotelStaff(hotelId: string | undefined) {
  return useQuery({
    queryKey: partnerKeys.staff(hotelId ?? ""),
    queryFn: () => partnerService.getHotelStaff(hotelId!),
    enabled: !!hotelId,
  });
}

export function useVerificationRequests(hotelId: string | undefined) {
  return useQuery({
    queryKey: partnerKeys.verifications(hotelId ?? ""),
    queryFn: () => partnerService.getVerificationRequests(hotelId!),
    enabled: !!hotelId,
  });
}

export function useVerificationRequest(requestId: string | undefined) {
  return useQuery({
    queryKey: partnerKeys.verification(requestId ?? ""),
    queryFn: () => partnerService.getVerificationRequest(requestId!),
    enabled: !!requestId,
  });
}

export function usePricingRules(hotelId: string | undefined) {
  return useQuery({
    queryKey: partnerKeys.pricingRules(hotelId ?? ""),
    queryFn: () => partnerService.getPricingRules(hotelId!),
    enabled: !!hotelId,
  });
}

export function usePricePreview(roomTypeId: string | undefined, date: string, bookedOn: string) {
  return useQuery({
    queryKey: partnerKeys.pricePreview(roomTypeId ?? "", date, bookedOn),
    queryFn: () => partnerService.getPricePreview(roomTypeId!, { date, bookedOn }),
    enabled: !!roomTypeId && !!date && !!bookedOn,
  });
}

export function useAvailability(hotelId: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: partnerKeys.availability(hotelId ?? "", from, to),
    queryFn: () => partnerService.getAvailability(hotelId!, { from, to }),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
  });
}

export function useHotelBookings(hotelId: string | undefined, params: partnerService.HotelBookingsParams) {
  return useQuery({
    queryKey: partnerKeys.bookings(hotelId ?? "", params),
    queryFn: () => partnerService.getHotelBookings(hotelId!, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
  });
}

/** Number of refund requests waiting for the partner (sidebar badge, dashboard, bookings tab). */
export function useRefundQueueCount(hotelId: string | undefined) {
  const query = useHotelBookings(hotelId, { paymentStatus: ["REFUND_PENDING"], page: 1, pageSize: 1 });
  return { ...query, count: query.data?.meta.total ?? 0 };
}

export function useBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: partnerKeys.booking(bookingId ?? ""),
    queryFn: () => partnerService.getBooking(bookingId!),
    enabled: !!bookingId,
  });
}

// ── Mutations ───────────────────────────────────────────────

type PartnerMutationOptions<TData, TVars> = {
  /** Queries to refetch once the call settles. Also on error: a stale-data code (…_NOT_FOUND, …_CONFLICT) means the list changed. */
  invalidate: (vars: TVars) => QueryKey[];
  successMessage?: string | ((data: TData, vars: TVars) => string);
  /** Forms show their own (field-level) errors; everything else gets a notice. */
  errorNotice?: boolean;
  onSuccess?: (data: TData, vars: TVars) => void;
};

/**
 * One mutation wrapper for every partner write: shows the outcome as a notice and refreshes the affected queries.
 * Use `isPending` to disable the submit button so a double click sends one request.
 */
export function usePartnerMutation<TData, TVars = void>(
  mutationFn: (vars: TVars) => Promise<TData>,
  { invalidate, successMessage, errorNotice = true, onSuccess }: PartnerMutationOptions<TData, TVars>,
) {
  const queryClient = useQueryClient();
  const { showNotice } = usePartnerActions();

  return useMutation({
    mutationFn,
    onSuccess: (data, vars) => {
      if (successMessage) {
        showNotice(typeof successMessage === "function" ? successMessage(data, vars) : successMessage);
      }
      onSuccess?.(data, vars);
    },
    onError: (error) => {
      if (errorNotice) showNotice(getApiErrorMessage(error), "error");
    },
    onSettled: (_data, _error, vars) =>
      Promise.all(invalidate(vars).map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}
