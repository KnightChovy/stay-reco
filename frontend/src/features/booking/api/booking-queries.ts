"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CancelBookingInput, CreateBookingInput, MyBookingsQuery, PaymentStatus } from "@stayreco/shared";
import * as bookingService from "@/services/booking.service";

export const bookingKeys = {
  all: ["booking"] as const,
  detail: (bookingId: string) => [...bookingKeys.all, "detail", bookingId] as const,
  myTrips: (params: Partial<MyBookingsQuery>) => [...bookingKeys.all, "my-trips", params] as const,
  voucher: (bookingId: string) => [...bookingKeys.all, "voucher", bookingId] as const,
  quote: (bookingId: string) => [...bookingKeys.all, "quote", bookingId] as const,
};

/** Keep polling while the booking waits for the SePay transfer. */
const WAITING_PAYMENT: PaymentStatus[] = ["UNPAID"];
const WAITING_BOOKING = ["PENDING"];

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => bookingService.createBooking(input),
    onSuccess: (booking) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
      void queryClient.invalidateQueries({ queryKey: [...bookingKeys.all, "my-trips"] });
    },
  });
}

/**
 * A booking detail. Pass `poll` on the payment page: it refetches every 4 s until the webhook confirms the transfer
 * (or the 15-minute hold expires), then stops.
 */
export function useBooking(bookingId: string | undefined, options: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId ?? ""),
    queryFn: () => bookingService.getBooking(bookingId!),
    enabled: !!bookingId,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      if (!options.poll) return false;
      const booking = query.state.data;
      if (!booking) return 4_000;
      const waiting =
        WAITING_BOOKING.includes(booking.status) && WAITING_PAYMENT.includes(booking.paymentStatus);
      return waiting ? 4_000 : false;
    },
  });
}

export function useMyBookings(params: Partial<MyBookingsQuery> = {}) {
  return useQuery({
    queryKey: bookingKeys.myTrips(params),
    queryFn: () => bookingService.getMyBookings(params),
    placeholderData: keepPreviousData,
  });
}

export function useBookingVoucher(bookingId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: bookingKeys.voucher(bookingId ?? ""),
    queryFn: () => bookingService.getBookingVoucher(bookingId!),
    enabled: !!bookingId && enabled,
    retry: false,
  });
}

export function useCancellationQuote(bookingId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: bookingKeys.quote(bookingId ?? ""),
    queryFn: () => bookingService.getCancellationQuote(bookingId!),
    enabled: !!bookingId && enabled,
    retry: false,
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, input }: { bookingId: string; input: CancelBookingInput }) =>
      bookingService.cancelBooking(bookingId, input),
    onSuccess: (booking) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
      void queryClient.invalidateQueries({ queryKey: [...bookingKeys.all, "my-trips"] });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.quote(booking.id) });
    },
  });
}
