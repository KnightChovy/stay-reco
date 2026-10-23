"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { HotelSummary } from "@stayreco/shared";
import { useAuthStore } from "@/lib/auth-store";
import { useMyHotels } from "../api/partner-queries";

const STORAGE_KEY = "stayreco-partner-hotel";

type PartnerHotelContextValue = {
  hotels: HotelSummary[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  /** The hotel every hotel-scoped screen works on; undefined while loading or when the partner has none. */
  hotel: HotelSummary | undefined;
  selectHotel: (hotelId: string) => void;
  /** Suspended partners keep read access, but every write returns 403 PARTNER_SUSPENDED. */
  isSuspended: boolean;
  canEdit: boolean;
};

const PartnerHotelContext = createContext<PartnerHotelContextValue | null>(null);

function readStoredHotelId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function PartnerHotelProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error, refetch } = useMyHotels();
  const partnerStatus = useAuthStore((state) => state.user?.partnerStatus);
  // AuthRouteGuard renders the portal only in the browser, after sign-in, so localStorage is available here.
  const [selectedId, setSelectedId] = useState<string | null>(readStoredHotelId);

  const selectHotel = useCallback((hotelId: string) => {
    setSelectedId(hotelId);
    try {
      window.localStorage.setItem(STORAGE_KEY, hotelId);
    } catch {
      // The selection is a convenience; losing it only falls back to the first hotel.
    }
  }, []);

  const value = useMemo<PartnerHotelContextValue>(() => {
    const hotels = data ?? [];
    const hotel = hotels.find((item) => item.id === selectedId) ?? hotels[0];
    const isSuspended = partnerStatus === "SUSPENDED";
    return {
      hotels,
      isLoading,
      error,
      refetch: () => void refetch(),
      hotel,
      selectHotel,
      isSuspended,
      canEdit: !isSuspended && hotel?.myRole !== "STAFF",
    };
  }, [data, error, isLoading, partnerStatus, refetch, selectHotel, selectedId]);

  return <PartnerHotelContext.Provider value={value}>{children}</PartnerHotelContext.Provider>;
}

export function usePartnerHotel() {
  const context = useContext(PartnerHotelContext);
  if (!context) {
    throw new Error("usePartnerHotel must be used within PartnerHotelProvider");
  }
  return context;
}
