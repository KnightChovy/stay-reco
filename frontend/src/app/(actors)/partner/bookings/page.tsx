import { Suspense } from "react";
import PartnerBookings from "@/features/partner/bookings/PartnerBookings";

export default function Page() {
  // PartnerBookings reads the opening tab from useSearchParams.
  return (
    <Suspense>
      <PartnerBookings />
    </Suspense>
  );
}
