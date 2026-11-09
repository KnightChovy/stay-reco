import { Suspense } from "react";
import PartnerAvailability from "@/features/partner/availability/PartnerAvailability";

export default function Page() {
  // PartnerAvailability reads the opening date from useSearchParams.
  return (
    <Suspense>
      <PartnerAvailability />
    </Suspense>
  );
}
