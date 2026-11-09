import { Suspense } from "react";
import PartnerPricing from "@/features/partner/pricing/PartnerPricing";

export default function Page() {
  // PartnerPricing reads the night to preview from useSearchParams.
  return (
    <Suspense>
      <PartnerPricing />
    </Suspense>
  );
}
