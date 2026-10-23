import { Suspense } from "react";
import PartnerHotel from "@/features/partner/hotel/PartnerHotel";

export default function Page() {
  // PartnerHotel reads the active tab from useSearchParams.
  return (
    <Suspense>
      <PartnerHotel />
    </Suspense>
  );
}
