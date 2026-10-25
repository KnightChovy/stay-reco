"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Hotel, HotelSummary } from "@stayreco/shared";
import { useHotel, useMyHotels } from "../api/staff-queries";

export type HotelDetail = {
  summary: HotelSummary;
  detail: Hotel;
};

type StaffHotelContextValue = {
  hotels: HotelSummary[];
  /** The hotel the staff member is assigned to; undefined while loading or when the account has none. */
  hotel: HotelDetail | undefined;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
};

const StaffHotelContext = createContext<StaffHotelContextValue | null>(null);

export function StaffHotelProvider({ children }: { children: ReactNode }) {
  const hotelsQuery = useMyHotels();
  const summary = hotelsQuery.data?.[0];
  const detailQuery = useHotel(summary?.id);

  const value = useMemo<StaffHotelContextValue>(
    () => ({
      hotels: hotelsQuery.data ?? [],
      hotel:
        summary && detailQuery.data
          ? { summary, detail: detailQuery.data }
          : undefined,
      isLoading: hotelsQuery.isLoading || (!!summary && detailQuery.isLoading),
      error: hotelsQuery.error ?? detailQuery.error,
      refetch: () => {
        void hotelsQuery.refetch();
        if (summary) void detailQuery.refetch();
      },
    }),
    [detailQuery, hotelsQuery, summary],
  );

  return <StaffHotelContext.Provider value={value}>{children}</StaffHotelContext.Provider>;
}

export function useStaffHotel() {
  const context = useContext(StaffHotelContext);
  if (!context) {
    throw new Error("useStaffHotel must be used within StaffHotelProvider");
  }
  return context;
}
